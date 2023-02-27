import {Event} from '@/types/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import {AspectRatio, Box, Button, Card, CardOverflow, Divider, Modal, ModalDialog, Typography} from '@mui/joy';
import {useEffect, useState} from 'react';

interface IClip {
    path: string,
    onSelection?: (param: string) => void,
    onDeletion?: (path: string) => void,
}

const Clip = ({path, onSelection, onDeletion}: IClip) => {
    const [thumb, setThumb] = useState<string>();
    const [event, setEvent] = useState<Event>();
    const [openDeletion, setOpenDeletion] = useState(false);


    useEffect(() => {
        window.sentinel.readB64File(`${path}/thumb.png`)
            .then(setThumb)
        window.sentinel.readStringFile(`${path}/event.json`)
            .then((str: string) => {
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
        <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
            <div>
                <Typography level="h2" sx={{fontSize: 'md', mt: 2}} startDecorator={<LocationOnRoundedIcon/>}>
                    {event?.city}
                </Typography>
                <Typography level="body2" sx={{mt: 0.5, mb: 2}} startDecorator={<AccessTimeIcon/>}>
                    {event?.timestamp}
                </Typography>
            </div>
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <Button variant="solid"
                        size="sm"
                        color="primary"
                        aria-label="Remove clip"
                        sx={{ml: 'auto', fontWeight: 600}}
                        onClick={(e: any) => {
                            e.stopPropagation();
                            setOpenDeletion(true);
                        }}>
                    <DeleteForeverIcon/>
                </Button>
            </Box>
        </Box>
        <Modal open={openDeletion} onClose={() => setOpenDeletion(false)}>
            <ModalDialog
                variant="outlined"
                role="alertdialog"
                aria-labelledby="alert-dialog-modal-title"
                aria-describedby="alert-dialog-modal-description"
            >
                <Typography
                    id="alert-dialog-modal-title"
                    component="h2"
                    startDecorator={<WarningRoundedIcon/>}
                >
                    Confirmation
                </Typography>
                <Divider/>
                <Typography id="alert-dialog-modal-description" textColor="text.tertiary">
                    Êtes vous sûr de vouloir supprimer ce clip ?
                </Typography>
                <Box sx={{display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 2}}>
                    <Button variant="plain" color="neutral" onClick={(e) => {
                        e.stopPropagation();
                        setOpenDeletion(false);
                    }}>
                        Annuler
                    </Button>
                    <Button variant="solid" color="danger" onClick={(e) => {
                        e.stopPropagation();
                        window.sentinel.remove(path).then(() =>
                            onDeletion?.(path))
                        setOpenDeletion(false);
                    }}>
                        Supprimer
                    </Button>
                </Box>
            </ModalDialog>
        </Modal>
    </Card>)
}

export default Clip
