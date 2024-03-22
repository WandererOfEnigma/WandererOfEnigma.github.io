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

        console.log('Attempting to connect to MQTT broker:', wsURL);

        client = new Paho.MQTT.Client(wsURL, "clientId_" + new Date().getTime());

        client.onConnectionLost = function(responseObject) {
            console.log('Connection lost:', responseObject);
            console.error('Error details:', responseObject.errorCode, responseObject.errorMessage);

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

                // Subscribe to MQTT topics for updating map
                client.subscribe('ENGO551/Arnold/my_temperature');
                client.subscribe('ENGO551/Arnold/add_marker'); // Add subscription to add_marker topic
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

    // Leaflet map
    let map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Subscribe to MQTT topic for updating map
    if (client) {
        client.onMessageArrived = function(message) {
            let topic = message.destinationName;
            let payload = JSON.parse(message.payloadString);

            // Check if the message is for adding a marker
            if (topic === 'ENGO551/Arnold/add_marker') {
                let coordinates = payload.geometry.coordinates;
                let temperature = payload.properties.temperature;

                // Add marker to the map
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
