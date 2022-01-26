import React from 'react';
import JokeRating from './JokeRating';
import JokeDrawButton from './JokeDrawButton';
import { Stack, Tooltip, Typography, Paper } from '@mui/material';
import Categories from './Categories';
import socket, { cmd } from './socket';


export default function JokeRandom(props) {
    const [{ joke = {} , provider}, setJoke] = React.useState({});
    const [{ sum = 0, userRating = 0 }, setRatings] = React.useState({  })
    const [selectedCategories, selectCategories] = React.useState([]);
    const getJokePayload = (additionals) => ({
        userID: localStorage['userID'],
        jokeID: joke.ID,
        provider,
        ...additionals,
    })
    const fetchRating = () => cmd('getRatings', getJokePayload())
        .then(setRatings)
        .catch(console.error);
    const handleRate = (value) => cmd('joke#rate', getJokePayload({ value }))
        .then(setRatings)
        .catch(console.error)

    React.useEffect(()=>{
        const watcher = (payload)=>{ 
            if(payload.provider !== provider || payload.jokeID !== joke.ID) return;
            if(payload.userID === localStorage["userID"] && payload.sum !== sum) return fetchRating();
            setRatings({ userRating, sum });
        };
        socket.on('rating#update', watcher);
        return () => socket.off('rating#update', watcher);
    }, [sum, userRating, provider, joke.ID])

    React.useEffect(()=>{
        if(!joke.ID) return;
        fetchRating();
    }, [joke.ID])
    console.log('random joke rerender');

    return (
        <Stack sx={{ p: 2 }} component={Paper} spacing={2} direction="column">
            <Categories selected={selectedCategories} onChange={selectCategories} />
            <Tooltip arrow placement="left" title={`This joke comes from ${provider} provider`}>
                <Typography>{joke.value}</Typography>
            </Tooltip>
            <Stack spacing={4} direction="row" justifyContent="space-between" alignItems="center">
                <JokeDrawButton selectedCategories={selectedCategories} onDraw={setJoke} />
                <JokeRating userRating={userRating} sum={sum} onRate={handleRate} />
            </Stack>
        </Stack>

    )
}