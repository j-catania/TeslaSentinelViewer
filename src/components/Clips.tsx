import Clip from '@/components/Clip';
import {Stack} from '@mui/joy';
import {useEffect, useState} from 'react';

interface IClips {
    path: string
}

const Clips = ({path}: IClips) => {
    const [dirs, setDirs] = useState<string[]>();

    useEffect(() => {
        window.sentinel.getFiles(path).then(setDirs)
    },[]);

    return <Stack spacing={2} alignItems={'center'}>
        {dirs?.map(item =>
            <Clip key={item} path={item}/>
        )}
    </Stack>
}

export default Clips
