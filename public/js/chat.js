const socket=io()

//Elements
const $messageForm=document.querySelector('#message-form')
const $messageFormInput=$messageForm.querySelector('input')
const $messageFormButton=$messageForm.querySelector('button')
const $sendLocationButton=document.querySelector('#send-location')
const $messages=document.querySelector('#messages')

//Templetates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationMessageTemplate=document.querySelector('#locationMessage-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room} = Qs.parse(location.search,{ ignoreQueryPrefix :true })

const autoscroll=()=>{
    //New Message Element
    const $newMessage=$messages.lastElementChild

    //Height of new message
    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight+newMessageMargin

    //Visible height
    const visibleHeight=$messages.offsetHeight

    //Height of messages containner
    const containerHeight=$messages.scrollHeight

    //How far have I scrolled
    const scrolloffset=$messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrolloffset){
        $messages.scrollTop=$messages.scrollHeight
    }
}


socket.on('message',({username,text,createdAt})=>{
    const html=Mustache.render(messageTemplate,{
        username,
        message:text,
        createdAt:moment(createdAt).format('h:mm a') //using moment js
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage',({username,url,createdAt})=>{
    const html=Mustache.render(locationMessageTemplate,{
            username,
            url,
            createdAt:moment(createdAt).format('h:mm a')
        })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled','disabled')

    const message=$messageFormInput.value
    socket.emit('sendMessage',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()

        if(error){
            return console.log(error);
        }
        console.log("Message delivered");
        
    })
})

$sendLocationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported byh your browser')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation' ,{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },(error)=>{
            $sendLocationButton.removeAttribute('disabled')
            if(!error){
                console.log("Location shared !");
            }
            else{
                console.log(error);
            }
            
        })
    })
    
})

socket.emit('join', {username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/' //sending user to home page
    }
})