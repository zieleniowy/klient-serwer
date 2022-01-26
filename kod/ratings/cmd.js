module.exports = (socket) => {
    var token = 0;
    var store = [];
    const invoke = (command, payload) => new Promise((res, rej)=>{
        store.push({ token: ++token, res, rej });
        socket.emit('command', { name: command, payload, token });
    })
    const popRequest = (success = true) => ({ payload, token })=>{ 
        store.find(cmd => cmd.token === token)?.[success?'res':'rej']?.(payload);
        store = store.filter(cmd => cmd.token !== token);
    };
    socket.on('result', popRequest())
    socket.on('error', popRequest(false))
    return invoke;
}
