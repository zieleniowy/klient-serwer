const cmd = require('./commands');

const randomArrayElement = arr => arr[Math.floor(Math.random()*arr.length)];


const io = require("socket.io")(process.env.PORT * 1 || 8080, {
    cors: {
        origin: "*",
    }
});

console.log(`started ws listening on ${process.env.PORT * 1 || 8080}`)

console.log(process.env);



// const connectToSocket = (endpoint)=>{
    // const socket = ioClient(endpoint, { forceNew: true })
const setAsEndpoint = (socket) => {
    var token = 0;
    var cmdStore = [];
    const invoke = (command, payload, socketID) => new Promise((res, rej)=>{
        cmdStore.push({ token: ++token, res, rej });
        socket.emit('command', { name: command, payload, token, socketID });
    })
    socket.on('result', ({ payload, token })=>{ 
       cmdStore.find(cmd => cmd.token === token)?.res?.(payload);
       cmdStore = cmdStore.filter(cmd => cmd.token !== token);
    })
    socket.on('handleCommand', name => {
        cmd.register(name, async (payload, socketID) => invoke(name, payload, socketID))
    })
    socket.on('broadcast', ({event,  payload }) => io.emit(event, payload));
    return { socket, invoke };
}

const providers = {}



const subModules = {}



const getRandomProvider = () => randomArrayElement(Object.keys(providers));

cmd.register('joke#random', async ({categories}, socketID) => {
    if(!Object.keys(providers).length)  throw new Error('There are no providers ready yet')
    const [provider, category] = categories?.length ? randomArrayElement(categories) : [getRandomProvider(), null]; 
    const joke = await providers[provider].invoke('joke#random', { category });
    return { joke, provider };
})  

cmd.register('categories', async () => {
    const providerList = Object.keys(providers);
    const categories = await Promise.all(providerList.map(key => providers[key].invoke('categories', {})))
    return categories.map(({ categories, label }, idx) => ({ categories, label, provider: providerList[idx] }))

})
cmd.register('joke#byID', async ({provider, ID}) => {
    return providers[provider].invoke('joke#byID', { ID });
})  




io.on("connection", socket => { 
    console.log('there is a connection');     
    socket.on('command', async data => {
        try {
            if(!cmd.exists(data.name)) throw new Error('module is down')
            socket.emit('result', await cmd.use({ ...data, socketID: socket.id }))
        }
        catch($e){
            return socket.emit('error', { token: data.token, payload: $e.message });
        }
    })
    socket.on('setAsEndpoint', ({ type, name, secret }) => {
        if(secret !== process.env.SECRET) return socket.emit('endpoint#error', {type, name})
        socket.__endpointType__ = type;
        socket.__endpointName__ = name;
        console.log('endpoint has attached', { type, name })
        switch(type){
            case 'provider':
                providers[name] = setAsEndpoint(socket);
                break;
            case 'module':
                subModules[name] = setAsEndpoint(socket);
                break;
        }
        socket.broadcast.emit('endpoint#connect', { type, name })
        socket.emit('endpointSaved')
    })
    socket.on('disconnect', ()=>{
        switch(socket.__endpointType__){
            case 'provider':
                delete providers[socket.__endpointName__]
                break;
            case 'module':
                delete subModules[socket.__endpointName__]
                break;
        } 
        if(socket.__endpointType__){
            console.log('endpoint has dettached', { type: socket.__endpointType__, name: socket.__endpointName__ })
            socket.broadcast.emit('endpoint#disconnect', { type: socket.__endpointType__, name: socket.__endpointName__ })
        }
    })
});


