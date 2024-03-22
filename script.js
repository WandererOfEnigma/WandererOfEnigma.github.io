document.addEventListener('DOMContentLoaded', function() {
    let hostInput = document.getElementById('hostInput');
    let portInput = document.getElementById('portInput');
    let startBtn = document.getElementById('startBtn');
    let endBtn = document.getElementById('endBtn');
    let statusMsg = document.getElementById('status');
    let client;

    // Initialize MQTT client
    let initializeMQTTClient = function() {
        let host = hostInput.value.trim();
        let port = portInput.value.trim();

        if (!host || !port) {
            alert('Please provide MQTT Broker Host and Port.');
            return;
        }

        let wsURL = 'wss://' + host + ':' + port + '/mqtt';

        console.log('Attempting to connect to MQTT broker:', wsURL);

        client = new Paho.MQTT.Client(wsURL, "clientId_" + new Date().getTime());

        client.onConnectionLost = function(responseObject) {
            console.log('Connection lost:', responseObject);
            console.error('Error details:', responseObject.errorCode, responseObject.errorMessage);

            if (responseObject.errorCode !== 0) {
                statusMsg.textContent = 'Connection lost: ' + responseObject.errorMessage;
                setTimeout(function() {
                    client.connect({
                        onSuccess: function() {
                            statusMsg.textContent = 'Reconnected to MQTT Broker.';
                        },
                        onFailure: function(errorMessage) {
                            statusMsg.textContent = 'Failed to reconnect: ' + errorMessage.errorMessage;
                        }
                    });
                }, 5000);
            }
        };

        client.connect({
            onSuccess: function() {
                statusMsg.textContent = 'Connected to MQTT Broker.';
                startBtn.disabled = true;
                endBtn.disabled = false;

                // Enable share status button once connected
                shareStatusBtn.disabled = false;
            },
            onFailure: function(errorMessage) {
                statusMsg.textContent = 'Failed to connect: ' + errorMessage.errorMessage;
            }
        });
    };

    startBtn.addEventListener('click', initializeMQTTClient);

    endBtn.addEventListener('click', function() {
        if (client) {
            client.disconnect();
            statusMsg.textContent = 'Connection ended.';
            startBtn.disabled = false;
            endBtn.disabled = true;
            // Disable share status button when disconnected
            shareStatusBtn.disabled = true;
        }
    });

    let shareStatusBtn = document.getElementById('shareStatusBtn');

    shareStatusBtn.addEventListener('click', function() {
        if (!client || !client.isConnected()) {
            alert('Please establish connection with MQTT Broker first.');
            return;
        }

        let latitude, longitude;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;

                let geoJson = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    properties: {
                        temperature: Math.floor(Math.random() * 61) - 40
                    }
                };

                let message = JSON.stringify(geoJson);
                let topic = 'ENGO551/Arnold/my_temperature'.replace(' ', '_');

                let messageObject = new Paho.MQTT.Message(message);
                messageObject.destinationName = topic;
                
                // Check if client is initialized before sending message
                if (client) {
                    client.send(messageObject);
                } else {
                    alert('MQTT client is not initialized.');
                }
            }, function(error) {
                console.error('Error getting current position:', error);
                alert('Error getting current position. Please enable location services or manually input your location.');
            });
        } else {
            console.error('Geolocation API not supported.');
            alert('Geolocation API not supported. Please manually input your location.');
        }
    });

    // Leaflet map initialization and MQTT message subscription
    let map = L.map('map').setView([0, 0], 2);
    let currentLocationMarker;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    if (client) {
        client.onMessageArrived = function(message) {
            let payload = JSON.parse(message.payloadString);
            let topic = message.destinationName;

            if (topic === 'ENGO551/Arnold/my_temperature') {
                let coordinates = payload.geometry.coordinates;
                let temperature = payload.properties.temperature;

                let marker = L.marker([coordinates[1], coordinates[0]]).addTo(map);
                marker.bindPopup('Temperature: ' + temperature + '°C').openPopup();
                marker.on('click', function() {
                    alert('Temperature: ' + temperature + '°C');
                });

                if (temperature < 10) {
                    marker.setIcon(L.icon({iconUrl: 'blue-marker.png'}));
                } else if (temperature < 30) {
                    marker.setIcon(L.icon({iconUrl: 'green-marker.png'}));
                } else {
                    marker.setIcon(L.icon({iconUrl: 'red-marker.jpeg'}));
                }
            } else if (topic === '<your_topic_for_location>') {
                let coordinates = payload.geometry.coordinates;

                if (currentLocationMarker) {
                    currentLocationMarker.setLatLng([coordinates[1], coordinates[0]]);
                } else {
                    currentLocationMarker = L.marker([coordinates[1], coordinates[0]]).addTo(map);
                }
            }
        };
    }

    // Geolocation API
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            map.setView([latitude, longitude], 10);

            let geoJson = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                }
            };

            let message = JSON.stringify(geoJson);
            let topic = '<your_topic_for_location>'; 
            let messageObject = new Paho.MQTT.Message(message);
            messageObject.destinationName = topic;
            // Check if client is initialized before sending message
            if (client) {
                client.send(messageObject);
            } else {
                alert('MQTT client is not initialized.');
            }
        }, function(error) {
            console.error('Error getting current position:', error);
            alert('Error getting current position. Please enable location services or manually input your location.');
        });
    } else {
        console.error('Geolocation API not supported.');
        alert('Geolocation API not supported. Please manually input your location.');
    }
});
