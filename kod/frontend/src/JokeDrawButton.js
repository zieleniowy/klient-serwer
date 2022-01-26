import { Button } from '@mui/material';
import React from 'react';
import socket, {cmd} from './socket';

export default function JokeDrawButton(props){
    const drawJoke = () => {
        cmd('joke#random', { categories: props.selectedCategories.map(cat => cat.split('.')) })
            .then(props.onDraw)
            .catch(console.error);
    }
    React.useEffect(()=>drawJoke(), []);

    return (
        <Button onClick={drawJoke} fullWidth variant="contained" color="primary">Draw next joke</Button>
    )
}