import Clip from '@/components/Clip';
import {Divider, Stack} from '@mui/joy';
import {useEffect, useState} from 'react';

interface IClips {
    path: string,
    onSelection?: (param: string) => void,
}

const Clips = ({path, onSelection}: IClips) => {
    const [dirs, setDirs] = useState<string[]>();

    useEffect(() => {
        window.sentinel.getFiles(path).then(setDirs)
    },[]);

    return <Stack spacing={2} direction="row" alignItems={'center'} divider={<Divider orientation="vertical"/>}>
        {dirs?.map(item =>
            <Clip key={item} path={item} onSelection={onSelection}/>
        )}
    </Stack>
}

export default Clips
