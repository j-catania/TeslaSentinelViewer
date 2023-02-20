import Clip from '@/components/Clip';
import {Grid} from '@mui/joy';
import {useEffect, useState} from 'react';

interface IClips {
    path: string,
    onSelection?: (param: string) => void,
}

const Clips = ({path, onSelection}: IClips) => {
    const [dirs, setDirs] = useState<string[]>();

    useEffect(() => {
        window.sentinel.getFiles(path).then(setDirs)
    }, [path]);

    return <Grid container spacing={2} justifyContent="center">
        {dirs?.map(item =>
            <Grid key={item}>
                <Clip path={item} onSelection={onSelection}/>
            </Grid>
        )}
    </Grid>
}

export default Clips
