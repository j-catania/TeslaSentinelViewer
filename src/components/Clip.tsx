import {Event} from '@/types/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import {AspectRatio, Card, CardOverflow, Typography} from '@mui/joy';
import {useEffect, useState} from 'react';


interface IClip {
    path: string,
    onSelection?: (param: string) => void,
}

const Clip = ({path, onSelection}: IClip) => {
    const [thumb, setThumb] = useState<string>();
    const [event, setEvent] = useState<Event>();

    useEffect(() => {
        window.sentinel.readB64File(`${path}/thumb.png`)
            .then(setThumb)
        window.sentinel.readStringFile(`${path}/event.json`)
            .then(str => {
                const parsed: Event = JSON.parse(str);
                parsed.timestamp = new Date(parsed.timestamp).toLocaleString();
                setEvent(parsed)
            })
    }, []);
    return (<Card variant="outlined" sx={{width: 320}} onClick={() => onSelection?.(path)}>
        <CardOverflow>
            <AspectRatio ratio="2">
                <img
                    src={`data:image/png;base64,${thumb}`}
                    loading="lazy"
                    alt=""
                />
            </AspectRatio>
        </CardOverflow>
        <Typography level="h2" sx={{fontSize: 'md', mt: 2}} startDecorator={<LocationOnRoundedIcon/>}>
            {event?.city}
        </Typography>
        <Typography level="body2" sx={{mt: 0.5, mb: 2}} startDecorator={<AccessTimeIcon/>}>
            {event?.timestamp}
        </Typography>
    </Card>)
}

export default Clip
