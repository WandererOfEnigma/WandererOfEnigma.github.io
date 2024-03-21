var mqtt;
var reconnectTimeout = 2000;
var host = "192.168.1.157";
var port = 9001;
var connected_flag = 0;
var row = 0;
var out_msg = "";
var mcount = 0;

function onConnectionLost() {
    console.log("connection lost");
    document.getElementById("status").innerHTML = "Connection Lost";
    document.getElementById("status_messages").innerHTML = "Connection Lost";
    connected_flag = 0;
}

function onFailure(message) {
    console.log("Failed");
    document.getElementById("status_messages").innerHTML = "Connection Failed- Retrying";
    setTimeout(MQTTconnect, reconnectTimeout);
}

function onMessageArrived(r_message) {
    out_msg = "Message received " + r_message.payloadString;
    out_msg = out_msg + "      Topic " + r_message.destinationName + "<br/>";
    out_msg = "<b>" + out_msg + "</b>";

    try {
        document.getElementById("out_messages").innerHTML += out_msg;
    } catch (err) {
        document.getElementById("out_messages").innerHTML = err.message;
    }

    if (row == 10) {
        row = 1;
        document.getElementById("out_messages").innerHTML = out_msg;
    } else
        row += 1;

    mcount += 1;
    console.log(mcount + "  " + row);
}

function onConnected(recon, url) {
    console.log(" in onConnected " + reconn);
}

function onConnect() {
    document.getElementById("status_messages").innerHTML = "Connected to " + host + " on port " + port;
    connected_flag = 1;
    document.getElementById("status").innerHTML = "Connected";
}

function disconnect() {
    if (connected_flag == 1)
        mqtt.disconnect();
}

function MQTTconnect() {
    var clean_sessions = document.forms["connform"]["clean_sessions"].value;
    var user_name = document.forms["connform"]["username"].value;
    var password = document.forms["connform"]["password"].value;

    if (clean_sessions = document.forms["connform"]["clean_sessions"].checked)
        clean_sessions = true;
    else
        clean_sessions = false;

    document.getElementById("status_messages").innerHTML = "";
    var s = document.forms["connform"]["server"].value;
    var p = document.forms["connform"]["port"].value;
    if (p != "") {
        port = parseInt(p);
    }
    if (s != "") {
        host = s;
    }

    console.log("connecting to " + host + " " + port + " clean session=" + clean_sessions);
    console.log("user " + user_name);
    document.getElementById("status_messages").innerHTML = 'connecting';
    var x = Math.floor(Math.random() * 10000);
    var cname = "orderform-" + x;
    mqtt = new Paho.MQTT.Client(host, port, cname);

    var options = {
        timeout: 3,
        cleanSession: clean_sessions,
        onSuccess: onConnect,
        onFailure: onFailure,
    };

    if (user_name != "")
        options.userName = document.forms["connform"]["username"].value;
    if (password != "")
        options.password = document.forms["connform"]["password"].value;

    mqtt.onConnectionLost = onConnectionLost;
    mqtt.onMessageArrived = onMessageArrived;
    mqtt.onConnected = onConnected;

    mqtt.connect(options);
    return false;
}

function sub_topics() {
    document.getElementById("status_messages").innerHTML = "";
    if (connected_flag == 0) {
        out_msg = "<b>Not Connected so can't subscribe</b>"
        console.log(out_msg);
        document.getElementById("status_messages").innerHTML = out_msg;
        return false;
    }
    var stopic = document.forms["subs"]["Stopic"].value;
    console.log("here");
    var sqos = parseInt(document.forms["subs"]["sqos"].value);
    if (sqos > 2)
        sqos = 0;
    console.log("Subscribing to topic =" + stopic + " QOS " + sqos);
    document.getElementById("status_messages
