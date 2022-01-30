const express=require('express')
const path=require('path')
const http=require('http')
const socketio=require('socket.io')
const Filter=require('bad-words')
const { generateMessage, generateLocationMessage }=require('./utils/messages')
const {addUser,removeUser,getUsersInRoom,getUser}=require('./utils/users')

const app=express()
const server= http.createServer(app)// this is done by express automaticall but to use socket io we aare making the changes
const io=socketio(server)//socketio reuire raw server.

const port=process.env.PORT || 3000
const publicFolderDirectory= path.join(__dirname,'../public')

app.use(express.static(publicFolderDirectory))

io.on('connection',(socket)=>{
    
    socket.on('join',(options,callback)=>{

        const {error,user}=addUser({id:socket.id,...options})

        if(error){
            return callback(error)
        }

        socket.join(user.room)// a method on socket to connect to a room
        socket.emit('message',generateMessage('Admin','Welcome !'))
        socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()

    })

    socket.on('sendMessage',(message,callback)=>{      
        const filter=new Filter()
        if(filter.isProfane(message)){
           return callback('Bad words not allowed')
        }

        const user=getUser(socket.id)

        if(user){
            io.to(user.room).emit('message',generateMessage(user.username,message))
            callback()
        }
        callback("User not found")
    })

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage(`${user.username} has left !`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
        
    })

    socket.on('sendLocation',(position,callback)=>{
        const user=getUser(socket.id)
        if(user){
            io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://www.google.com/maps/?q=${position.latitude},${position.longitude}`))
            callback()
        }
        callback("No User Found !")
        
    })
})

server.listen(port,()=>{console.log("Server started at port"+port);})