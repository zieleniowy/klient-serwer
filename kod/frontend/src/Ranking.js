import React from 'react';
import { Stack, Paper, Typography } from '@mui/material';
import socket, {cmd} from './socket';
import JokeRating from './JokeRating';
export default function Ranking(){
    const [ranking, setRanking] = React.useState([]);
    console.log('ranking rerender');
    const userID = localStorage["userID"];

    const handleRate = (jokeID, provider) => value => cmd('joke#rate', { userID: localStorage["userID"], jokeID, provider, value })
        .catch(console.error);


    React.useEffect(()=>{
        cmd('ranking#fetch').then(setRanking).catch(console.error)
        const watcher = (ranking) => setRanking(ranking)
        socket.on('ranking#update', watcher)
        return () => socket.off('ranking#update', watcher);
    }, [])
    return (
        <Stack spacing={1}>
            <Typography component="h2" variant="h4" align="center" sx={{ pb: 4}}>Our greatest jokes</Typography>
            {ranking.map(joke => (
                <Paper sx={{ p: 1 }} key={`${joke._id.jokeID}.${joke._id.provider}`}>
                    {joke.value}
                    <JokeRating 
                        sum={joke.sum} 
                        userRating={joke.ratings.find(rating=>rating.userID === userID)?.value||0} 
                        onRate={handleRate(joke._id.jokeID, joke._id.provider)} 
                    />
                </Paper>
            ))}
        </Stack>
    )
}