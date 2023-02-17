import {Event} from '@/types/Event';
import {Card, CardContent, CardCover, Typography} from '@mui/joy';
import {useEffect, useState} from 'react';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import AccessTimeIcon from '@mui/icons-material/AccessTime';


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
    return <Card sx={{height: 96, width: 128}} onClick={() => onSelection?.(path)}>
        <CardCover>
            <img
                src={`data:image/png;base64,${thumb}`}
                loading="lazy"
                alt=""
            />
        </CardCover>
        <CardCover
            sx={{
                background:
                    'linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0) 200px), linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0) 300px)',
            }}
        />
        <CardContent sx={{justifyContent: 'flex-end'}}>
            <Typography
                startDecorator={<LocationOnRoundedIcon/>}
                textColor="neutral.300"
            >
                {event?.city}
            </Typography>
            <Typography
                startDecorator={<AccessTimeIcon/>}
                textColor="neutral.300"
            >
                {event?.timestamp}
            </Typography>
        </CardContent>
    </Card>
}

export default Clip
