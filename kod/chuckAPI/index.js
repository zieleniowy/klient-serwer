const fetch = require('isomorphic-fetch');

const HOST = process.env.HOST || 'https://api.chucknorris.io';
const CATEGORIES_LABEL = 'Jokes reffering to Chuck Norris'

const socket = require('socket.io-client')(process.env.ENDPOINT || 'ws://127.0.0.1:4000');

// const io = require("socket.io")(4001, {
//     cors: {
//         origin: "*",
//     }
// });
console.log(process.env);

const commands = {
    'joke#random': async ({category}) => {
        const res = await fetch(`${HOST}/jokes/random${category ? '?category=' + category : ''}`);
        const data = await res.json();
        return { ID: data.id, value: data.value };
    },
    'joke#byID': async ({ ID }) => {
        const res = await fetch(`${HOST}/jokes/${ID}`);
        const {id, value} = await res.json();
        return { ID: id, value }
    },
    'categories': async () => {
        const res = await fetch(`${HOST}/jokes/categories`);
        const categories = await res.json();
        return { categories, label: CATEGORIES_LABEL };
    }
}

const initSocket = () => {
    socket.emit('setAsEndpoint', { type: 'provider', name: 'chuckAPI', secret: process.env.HUB_SECRET })
}
socket.on('command', async ({ payload, token, name }) => {
    socket.emit('result', { token, payload: await commands[name](payload) })
})


socket.on('connect', initSocket);
