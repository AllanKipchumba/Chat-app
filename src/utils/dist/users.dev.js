"use strict";

var users = []; // addUser, getUser, getUsersInRoom

var addUser = function addUser(_ref) {
  var id = _ref.id,
      username = _ref.username,
      room = _ref.room;
  // clean the datas
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase(); // validate the data

  if (!username || !room) {
    return {
      error: "Username and room required!"
    };
  } // check for existing user


  var existingUser = users.find(function (user) {
    return user.room === room && user.username === username;
  }); // validate username

  if (existingUser) {
    return {
      error: "username is in use"
    };
  } //  store user


  var user = {
    id: id,
    username: username,
    room: room
  };
  users.push(user);
  return {
    user: user
  };
};

var removeUser = function removeUser(id) {
  var index = users.findIndex(function (user) {
    return user.id === id;
  });

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

var getUser = function getUser(id) {
  return users.find(function (user) {
    return user.id === id;
  });
};

var getUsersInRoom = function getUsersInRoom(room) {
  return users.filter(function (user) {
    return user.room === room;
  });
};

module.exports = {
  addUser: addUser,
  removeUser: removeUser,
  getUser: getUser,
  getUsersInRoom: getUsersInRoom
};