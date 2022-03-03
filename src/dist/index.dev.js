"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var path = require("path");

var http = require("http");

var express = require("express");

var socketio = require("socket.io");

var Filter = require("bad-words");

var _require = require("./utils/messages"),
    generateMessage = _require.generateMessage,
    generateLocationMesssage = _require.generateLocationMesssage;

var _require2 = require("./utils/users"),
    addUser = _require2.addUser,
    removeUser = _require2.removeUser,
    getUser = _require2.getUser,
    getUsersInRoom = _require2.getUsersInRoom;

var app = express(); // create HTTP server using express app

var server = http.createServer(app); // connect socket.io to the http server

var io = socketio(server);
var port = process.env.port || 3000;
var publicDirectoryPath = path.join(__dirname, "../public");
app.use(express["static"](publicDirectoryPath));
io.on("connection", function (socket) {
  console.log("New WebSocket connection");
  socket.on("join", function (options, callback) {
    var _addUser = addUser(_objectSpread({
      id: socket.id
    }, options)),
        error = _addUser.error,
        user = _addUser.user;

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit("message", generateMessage("Admin", "welcome, ".concat(user.username)));
    socket.broadcast.to(user.room).emit("message", generateMessage(user.username, "".concat(user.username, " has joined!"))); // populate users in room

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    callback();
  });
  socket.on("sendMessage", function (message, callback) {
    var user = getUser(socket.id);
    var filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("profanity is not allowed!");
    }

    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });
  socket.on("sendLocation", function (coords, callback) {
    var user = getUser(socket.id);
    socket.to(user.room).emit("locationMessage", generateLocationMesssage(user.username, "http://google.com/maps?q=".concat(coords.latitude, ",").concat(coords.longitude)));
    callback();
  });
  socket.on("disconnect", function () {
    var user = removeUser(socket.id);

    if (user) {
      io.emit("message", generateMessage("Admin", "".concat(user.username, " left"))); // populate users in room

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});
server.listen(port, function () {
  return console.log("Server is up on port ".concat(port));
});