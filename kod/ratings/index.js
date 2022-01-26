const getDB = require('./db');
const socket = require('socket.io-client')(`ws://${process.env.HUB_SVC_SERVICE_HOST}:${process.env.HUB_SVC_SERVICE_PORT}` || 'ws://127.0.0.1:4000');
const cmd = require('./cmd')(socket);
const url = require('url');


console.log({ uri: process.env.MONGO_URL, dbname: url.parse(process.env.MONGO_URL).pathname.substr(1) });
console.log(process.env);

// const io = require("socket.io")(4003, {
//     cors: {
//         origin: "*",
//     }
// });

const getJokeRating = async (provider, jokeID, userID) => {
    const {ratings, id, findOne, aggregate} = await getDB();

    const [[{value: sum = 0}], { value: userRating = 0 }] = await Promise.all([
        aggregate(ratings, [ 
            { $match: { provider, jokeID } },
            { $group: {  _id: "$jokeID", value: { $sum: "$value" } } },
        ], [{}]),
        findOne(ratings, { userID: id(userID), jokeID, provider }, { value: 1 }, {})
    ]);
    return { sum, userRating };
}

const top = (()=>{
    let ready = false;
    let cache = [];
    let requests = [];
    const setReady = (bool) => {
        ready = bool;
        if(!bool) return;
            requests.forEach(request => request.res(cache));
            requests = [];
    }
    const request = () => new Promise((res, rej)=>{
        if(ready) return res(cache);
        requests.push({ res, rej });
    })
    const fetchTop = async () => {
        const { ratings, id } = await getDB();
        const results = await ratings.aggregate([
            { $group: 
                {
                    _id: { jokeID: "$jokeID", provider: "$provider" }, 
                    sum: { $sum: "$value" }, 
                    ratings: { $push: { value: "$value", userID: "$userID" } } 
                } 
            },
            { $sort: { sum: -1 } },
            { $limit: process.env.RANKING_LIMIT * 1 || 5 },
        ]).toArray()
        const contents = await Promise.all(
            results.map(row => 
                cache.find(cacheRow => cacheRow._id.provider === row._id.provider && cacheRow._id.jokeID.toString() === row._id.jokeID.toString())?.value
                || cmd('joke#byID', { provider: row._id.provider, ID: row._id.jokeID })
            )
        )

        cache = results.map((result, idx) => ({ ...result, value: (contents[idx].value || contents[idx]) }))
        if(!ready) setReady(true);
        return cache;
    }
    fetchTop();
    return {
        getTop: request,
        updateTop: async (sum, _jokeID, _provider) => {
            const cache = await request();
            if(
                cache.length < 5 
                || sum >= cache[cache.length - 1].sum 
                || cache.find(({ _id: { jokeID, provider } }) => jokeID.toString() === _jokeID.toString() && _provider === provider )
            )
                return fetchTop();
            return false;
        } 
    }
})();


const socketInit = async () => socket.emit('setAsEndpoint', { type: 'module', name: 'ratings',  secret: process.env.HUB_SECRET })

socket.on('endpointSaved', () => {
    console.log('saved!');
    socket.emit('handleCommand', 'getRatings')
    socket.emit('handleCommand', 'genID')
    socket.emit('handleCommand', 'joke#rate')
    socket.emit('handleCommand', 'ranking#fetch');
})

socket.on('command', async ({ token, name, payload, socketID })=> { 
    const db = await getDB();  
    switch(name){
        case 'genID': 
            return socket.emit('result', { token,  payload: db.id() });
        case 'ranking#fetch':
            return socket.emit('result', { token, payload: await top.getTop() });
        case 'getRatings': 
            return socket.emit('result', { token, payload: await getJokeRating(payload.provider, payload.jokeID, payload.userID) })
        case 'joke#rate': 
            let { jokeID, userID, provider, value } = payload;
            userID = db.id(userID);
            await db.ratings.replaceOne(
                { jokeID, userID, provider },
                { jokeID, userID, provider, value },
                { upsert: true }
            );
            const newRating = await getJokeRating(provider, jokeID, userID);

            socket.emit('broadcast', { event: 'rating#update', payload: { userID, jokeID, sum: newRating.sum, provider }})
            socket.emit('result', { token, payload: newRating });
            const newRanking = await top.updateTop(newRating.sum, jokeID, provider);
            if(newRanking){
                socket.emit('broadcast', { event: 'ranking#update', payload: newRanking })
            }
    }
})

socket.on('connect', socketInit);

