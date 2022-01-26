const fetch = require('isomorphic-fetch');

const HOST = process.env.HOST || 'https://v2.jokeapi.dev';
const CATEGORIES_LABEL = 'Other jokes'
// const socket = require('socket.io-client')(`ws://${process.env.HUB_SVC_SERVICE_HOST}:${process.env.HUB_SVC_SERVICE_PORT}` || 'ws://127.0.0.1:4000');
const socket = require('socket.io-client')(process.env.ENDPOINT || 'ws://127.0.0.1:4000');

const parseJOKE = data => ({ ID: data.id, value: data.type === 'single' ? data.joke : `${data.setup}\n${data.delivery}` });

const commands = {
    'joke#random': async ({category}) => {
        const res = await fetch(`${HOST}/joke/${category || 'ANY'}`);
        return parseJOKE(await res.json());
    },
    'joke#byID': async ({ ID }) => {
        const res = await fetch(`${HOST}/joke/ANY?idRange=${ID}`);
        return parseJOKE(await res.json());
    },
    'categories': async () => {
        const res = await fetch(`${HOST}/categories`);
        const {categories} = await res.json();
        return { categories, label: CATEGORIES_LABEL };
    }
}



socket.on('command', async ({ payload, token, name }) => {
    socket.emit('result', { token, payload: await commands[name](payload) })
})

const initSocket = () => {
    socket.emit('setAsEndpoint', { type: 'provider', name: 'jokeAPI', secret: process.env.HUB_SECRET })
}
socket.on('connect', initSocket);