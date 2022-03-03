const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocationMesssage } = require("./utils/messages")
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")

const app = express()
    // create HTTP server using express app
const server = http.createServer(app)

// connect socket.io to the http server
const io = socketio(server)

const port = process.env.port || 3000
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath))

io.on("connection", (socket) => {
    console.log("New WebSocket connection")

    socket.on("join", (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit("message", generateMessage("Admin", `welcome, ${user.username}`))
        socket.broadcast.to(user.room).emit("message", generateMessage(user.username, `${user.username} has joined!`))
            // populate users in room
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback("profanity is not allowed!")
        }

        io.to(user.room).emit("message", generateMessage(user.username, message))
        callback()
    })

    socket.on("sendLocation", (coords, callback) => {
        const user = getUser(socket.id)
        socket.to(user.room).emit("locationMessage", generateLocationMesssage(user.username, `http://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id)

        if (user) {
            io.emit("message", generateMessage("Admin", `${user.username} left`))
                // populate users in room
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => console.log(`Server is up on port ${port}`))