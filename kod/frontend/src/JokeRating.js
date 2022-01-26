import React from 'react';
import { ThumbDown, ThumbUp,  ThumbDownOutlined, ThumbUpOutlined } from '@mui/icons-material';
import { red, green } from '@mui/material/colors';

import { Stack, Typography, IconButton } from '@mui/material';
export default function JokeRating(props){
    const {sum, userRating, direction = "row"} = props;
    const handleRate = value => _ => props.onRate(value === userRating ? 0 : value);
    return (
        <Stack direction={direction} alignItems="center">
            <Typography sx={{ pl: 1, pr: 3, width: 64 }}>{sum}</Typography>
            <IconButton onClick={handleRate(1)}>{userRating === 1 ? <ThumbUp htmlColor={green[500]} /> : <ThumbUpOutlined />}</IconButton>
            <IconButton onClick={handleRate(-1)}>{userRating === -1 ? <ThumbDown htmlColor={red[500]} /> : <ThumbDownOutlined />}</IconButton>
        </Stack>
    )
}