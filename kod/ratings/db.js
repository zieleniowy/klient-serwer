const url = require('url');
const mongodb = require('mongodb');
const client = mongodb.MongoClient;

let cache = null;

async function connect(uri){
    if(cache){
        return cache;
    }

    const client = await mongodb.MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = await client.db(url.parse(uri).pathname.substr(1))
    cache = db;
    return db;
}

const findOne = async (col, predicate, projection, defaultValue) => {
    const result = await col.findOne(predicate, projection);
    return result || defaultValue;
}
const aggregate = async (col, pipeline, defaultValue) => {
    const result = await col.aggregate(pipeline).toArray();
    return result.length ? result : defaultValue;
}


module.exports = async (cols=['ratings']) => {
    const db = await connect(process.env.MONGO_URL)
    const res = await Promise.all(cols.map(col => db.collection(col)));
    const o = Object.fromEntries(cols.map((col, idx)=>[col, res[idx]]));
    o.id = mongodb.ObjectID;
    o.findOne = findOne;
    o.aggregate = aggregate;
    return o;
}
