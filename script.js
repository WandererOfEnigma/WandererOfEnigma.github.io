document.addEventListener('DOMContentLoaded', function() {
    // MQTT settings
    let hostInput = document.getElementById('hostInput');
    let portInput = document.getElementById('portInput');
    let startBtn = document.getElementById('startBtn');
    let endBtn = document.getElementById('endBtn');
    let statusMsg = document.getElementById('status');
    let client;

    startBtn.addEventListener('click', function() {
        let host = hostInput.value.trim();
        let port = portInput.value.trim();

        if (!host || !port) {
            alert('Please provide MQTT Broker Host and Port.');
            return;
        }

        // Construct secure WebSocket URL (WSS)
        let wsURL = 'wss://' + host + ':' + port + '/mqtt';

        client = new Paho.MQTT.Client(wsURL, "clientId_" + new Date().getTime());

        client.onConnectionLost = function(responseObject) {
            if (responseObject.errorCode !== 0) {
                statusMsg.textContent = 'Connection lost: ' + responseObject.errorMessage;
                // Try to reconnect
                setTimeout(function() {
                    client.connect({
                        onSuccess: function() {
                            statusMsg.textContent = 'Reconnected to MQTT Broker.';
                        },
                        onFailure: function(errorMessage) {
                            statusMsg.textContent = 'Failed to reconnect: ' + errorMessage.errorMessage;
                        }
                    });
                }, 5000); // Try reconnecting after 5 seconds
            }
        };

        client.connect({
            onSuccess: function() {
                statusMsg.textContent = 'Connected to MQTT Broker.';
                startBtn.disabled = true;
                endBtn.disabled = false;
            },
            onFailure: function(errorMessage) {
                statusMsg.textContent = 'Failed to connect: ' + errorMessage.errorMessage;
            }
        });
    });

    endBtn.addEventListener('click', function() {
        if (client) {
            client.disconnect();
            statusMsg.textContent = 'Connection ended.';
            startBtn.disabled = false;
            endBtn.disabled = true;
        }
    });

    // Publish message
    let topicInput = document.getElementById('topicInput');
    let messageInput = document.getElementById('messageInput');
    let publishBtn = document.getElementById('publishBtn');

    publishBtn.addEventListener('click', function() {
        if (!client || !client.isConnected()) {
            alert('Please establish connection with MQTT Broker first.');
            return;
        }

        let topic = topicInput.value.trim();
        let message = messageInput.value.trim();

        if (!topic || !message) {
            alert('Please provide MQTT Topic and Message.');
            return;
        }

        let messageObject = new Paho.MQTT.Message(message);
        messageObject.destinationName = topic;
        client.send(messageObject);
    });

    // Share status button
    let shareStatusBtn = document.getElementById('shareStatusBtn');

    shareStatusBtn.addEventListener('click', function() {
        // Generate GeoJSON message
        let geoJson = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            properties: {
                temperature: Math.floor(Math.random() * 61) - 40 // Random temperature between -40 to 60
            }
        };

        let message = JSON.stringify(geoJson);
        let topic = 'ENGO551/Arnold/my_temperature'.replace(' ', '_');

        // Publish GeoJSON message
        let messageObject = new Paho.MQTT.Message(message);
        messageObject.destinationName = topic;
        client.send(messageObject);
    });

    // Leaflet map
    let map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Subscribe to MQTT topic for updating map
    if (client) {
        client.onMessageArrived = function(message) {
            let payload = JSON.parse(message.payloadString);
            let coordinates = payload.geometry.coordinates;
            let temperature = payload.properties.temperature;

            // Update map
            let marker = L.marker([coordinates[1], coordinates[0]]).addTo(map);
            marker.bindPopup('Temperature: ' + temperature + '°C').openPopup();
            marker.on('click', function() {
                alert('Temperature: ' + temperature + '°C');
            });

            // Change marker color based on temperature
            if (temperature < 10) {
                marker.setIcon(L.icon({iconUrl: 'blue-marker.png'}));
            } else if (temperature < 30) {
                marker.setIcon(L.icon({iconUrl: 'green-marker.png'}));
            } else {
                marker.setIcon(L.icon({iconUrl: 'red-marker.jpeg'}));
            }
        };
    }

    // Geolocation API
    let latitude, longitude;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            map.setView([latitude, longitude], 10);
        }, function(error) {
            console.error('Error getting current position:', error);
            // Handle error gracefully
            alert('Error getting current position. Please enable location services or manually input your location.');
        });
    } else {
        console.error('Geolocation API not supported.');
        // Handle unsupported geolocation
        alert('Geolocation API not supported. Please manually input your location.');
    }
});
