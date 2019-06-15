// Load required modules
let http = require("http"); // http server core module
let express = require("express"); // web framework external module
let socketIo = require("socket.io"); // web socket external module

const port = process.env.PORT || 8080;

// This sample is using the easyrtc from parent folder.
// To use this server_example folder only without parent folder:
// 1. you need to replace this "require("../");" by "require("easyrtc");"
// 2. install easyrtc (npm i easyrtc --save) in server_example/package.json

let easyrtc = require("easyrtc"); // EasyRTC internal module

// Set process name
process.title = "node-easyrtc";

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
let app = express();


app.use(express.static('./static'));

// Start Express http server on port 8080
let webServer = http.createServer(app);

// Start Socket.io so it attaches itself to Express server
let socketServer = socketIo.listen(webServer, {
  "log level": 1
});

easyrtc.setOption("logLevel", "debug");

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function (socket, easyrtcid, msg, socketCallback, callback) {
  easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function (err, connectionObj) {
    if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
      callback(err, connectionObj);
      return;
    }

    connectionObj.setField("credential", msg.msgData.credential, {
      "isShared": false
    });

    console.log("[" + easyrtcid + "] Credential saved!", connectionObj.getFieldValueSync("credential"));

    callback(err, connectionObj);
  });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function (connectionObj, roomName, roomParameter, callback) {
  console.log("[" + connectionObj.getEasyrtcid() + "] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
  easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
let rtc = easyrtc.listen(app, socketServer, null, function (err, rtcRef) {
  console.log("Initiated");

  rtcRef.events.on("roomCreate", function (appObj, creatorConnectionObj, roomName, roomOptions, callback) {
    console.log("roomCreate fired! Trying to create: " + roomName);

    appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
  });
});

// Listen on port 8080
webServer.listen(port, function () {
  console.log(`listening on http://localhost:${port}`);
});