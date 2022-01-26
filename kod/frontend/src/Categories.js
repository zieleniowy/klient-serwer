import React from 'react';
import { FormControl, InputLabel, Box, MenuItem, Select, ListSubheader } from '@mui/material';
import socket, {cmd} from './socket';

// Mui Menu component doesn't accept React.Fragment so the structure has to be iterated without nesting 
const flattenCategories = categories => {
    const flatArr = [];
    categories.forEach(({ categories, label, provider }) => {
        flatArr.push({ type: 'header', value: provider, label })
        {categories.forEach(category=>flatArr.push({ type: 'option', value: `${provider}.${category}`, label: category }))}
    });
    return flatArr;
}

export default function Categories(props){
    const [categories, setCategories] = React.useState([]);
    
    const handleChange = (e, value) => {
        props.onChange(e.target.value);
    }
    const fetchCategories = () => cmd('categories', {})
        .then(payload => setCategories(flattenCategories(payload)))
        .catch(console.error)

    React.useEffect(()=>{
        fetchCategories();
        const watcher = ({ type }) => { 
            if(type === 'provider') fetchCategories();
        };
        socket.on('endpoint#connect', watcher);
        socket.on('endpoint#disconnect', watcher);

        return () => {
            socket.off('endpoint#connect', watcher);
            socket.off('endpoint#disconnect', watcher);
        }
    }, [])

    return (
        <Box textAlign="center">
            <FormControl fullWidth>
                <InputLabel id="cat-label">Categories</InputLabel>
                <Select
                    labelId="cat-label"
                    label="Categories"
                    multiple
                    
                    value={props.selected}
                    onChange={handleChange}
                >
                    {categories.map(el => el.type === 'header'
                        ? <ListSubheader key={el.value}>{el.label}</ListSubheader>
                        : <MenuItem key={el.value} value={el.value}>{el.label}</MenuItem>
                    )}
                </Select>
            </FormControl>
        </Box>

    )
}