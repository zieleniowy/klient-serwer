import * as React from 'react';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import JokeRandom from './JokeRandom';
import Categories from './Categories';
import socket, { cmd } from './socket';
import Ranking from './Ranking';
export default function App() {
  console.log('app rerender');

  React.useEffect(()=>{
      if(!localStorage['userID']){
        cmd('genID')
          .then(id => localStorage['userID'] = id)
          .catch(err => console.error(err));
      }
  }, [])

  return (
    <Container maxWidth="sm">
      <Stack sx={{ py: 2 }} spacing={12}>
            <JokeRandom />
            <Ranking />
      </Stack>
    </Container>

  );
}
