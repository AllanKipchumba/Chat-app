"use strict";

var socket = io(); // ellements

var $messageForm = document.querySelector("#message-form");
var $messageFormInput = $messageForm.querySelector("input");
var $messageFormButton = $messageForm.querySelector("button");
var $sendLocationButton = document.querySelector("#send-location");
var $messages = document.querySelector("#messages"); // templates

var messageTemplate = document.querySelector("#message-template").innerHTML;
var locationTemplate = document.querySelector("#location-template").innerHTML;
var sidebarTemplate = document.querySelector("#sidebar-template").innerHTML; // options

var _Qs$parse = Qs.parse(location.search, {
  ignoreQueryPrefix: true
}),
    username = _Qs$parse.username,
    room = _Qs$parse.room;

var autoscroll = function autoscroll() {
  // new message ellement
  var $newMessage = $messages.lastElementChild; // height of new message

  var newMessageStyles = getComputedStyle($newMessage);
  var newMessageMargin = parseInt(newMessageStyles.marginBottom);
  var newMessageHeight = $newMessage.offsetHeight + newMessageMargin; // visible height

  var visibleHeight = $messages.offsetHeight; // height of messages container

  var containerHeight = $messages.scrollHeight; // how far have i scrolled?

  var scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", function (message) {
  console.log(message);
  var html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});
socket.on("locationMessage", function (message) {
  console.log(message);
  var html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});
socket.on("roomData", function (_ref) {
  var room = _ref.room,
      users = _ref.users;
  var html = Mustache.render(sidebarTemplate, {
    room: room,
    users: users
  });
  document.querySelector("#sidebar").innerHTML = html;
});
$messageForm.addEventListener("submit", function (e) {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled"); // disable submit button

  var message = e.target.elements.message.value;
  socket.emit("sendMessage", message, function (error) {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log("message was delivered");
  });
});
$sendLocationButton.addEventListener("click", function () {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition(function (position) {
    // console.log(position)
    socket.emit("sendLocation", {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, function () {
      $sendLocationButton.removeAttribute("disabled");
      console.log("location shared");
    });
  });
});
socket.emit("join", {
  username: username,
  room: room
}, function (error) {
  if (error) {
    alert(error); // redirect users to the root of the site

    location.href = "/";
  }
});