import { Event, TeslaEventJSON } from '@/types/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';

interface IClip {
    path: string,
    onClick?: (event?: Event) => void,
    onDeletion?: (path: string) => void,
    active?: boolean,
    selected?: boolean,
    onSelectionChange?: (selected: boolean) => void,
}

const Clip = ({ path, onClick: onSelection, onDeletion, active = false, selected = false, onSelectionChange }: IClip) => {
    const [thumb, setThumb] = useState<string>();
    const [event, setEvent] = useState<Event>();
    const [openDeletion, setOpenDeletion] = useState(false);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    useEffect(() => {
        window.sentinel.readB64File(`${path}/thumb.png`)
            .then(setThumb)
            .catch(() => { /* thumb missing — leave undefined */ });
        window.sentinel.readStringFile(`${path}/event.json`)
            .then((str: string) => {
                const raw = JSON.parse(str) as TeslaEventJSON;
                setEvent({
                    ...raw,
                    timestamp: new Date(raw.timestamp),
                    root: path,
                });
                setStatus('ready');
            })
            .catch(() => setStatus('error'));
    }, []);


    return (
        <Card variant="outlined"
            className="clip"
            sx={{
                width: '15rem',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: active ? 'action.selected' : 'transparent',
                cursor: 'pointer',
            }}
            onClick={() => status === 'ready' && onSelection?.(event)}>

            {/* Thumbnail */}
            <Box sx={{ position: 'relative' }}>
                {status === 'loading'
                    ? <Skeleton variant="rectangular" height={120} />
                    : <Box
                        component="img"
                        src={thumb ? `data:image/png;base64,${thumb}` : ''}
                        loading="lazy"
                        alt=""
                        sx={{ display: 'block', width: '100%', height: 120, objectFit: 'cover' }}
                    />
                }
            </Box>

            {/* Info */}
            <CardContent sx={{ flex: 1, py: 1 }}>
                {status === 'loading' ? (
                    <>
                        <Skeleton variant="text" width="70%" />
                        <Skeleton variant="text" width="50%" />
                    </>
                ) : status === 'error' ? (
                    <Typography variant="body2" color="error">
                        Failed to load clip
                    </Typography>
                ) : (
                    <>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                            <LocationOnRoundedIcon fontSize="small" color="action" /> {event?.city}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeIcon fontSize="inherit" /> {event?.timestamp.toLocaleString()}
                        </Typography>
                    </>
                )}
            </CardContent>

            {/* Actions */}
            <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                <Checkbox
                    size="small"
                    checked={selected}
                    onClick={e => {
                        e.stopPropagation();
                        onSelectionChange?.((e.target as HTMLInputElement).checked);
                    }} />
                <IconButton
                    size="small"
                    color="error"
                    aria-label="Remove clip"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenDeletion(true);
                    }}>
                    <DeleteForeverIcon fontSize="small" />
                </IconButton>
            </CardActions>
            <Dialog
                open={openDeletion}
                onClose={() => setOpenDeletion(false)}
                aria-labelledby="alert-dialog-modal-title"
                aria-describedby="alert-dialog-modal-description"
            >
                <DialogTitle id="alert-dialog-modal-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningRoundedIcon />
                    Confirmation
                </DialogTitle>
                <Divider />
                <DialogContent>
                    <DialogContentText id="alert-dialog-modal-description">
                        Are you sure you want to delete this clip?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="text" color="inherit" onClick={(e) => {
                        e.stopPropagation();
                        setOpenDeletion(false);
                    }}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="error" onClick={(e) => {
                        e.stopPropagation();
                        window.sentinel.remove(path).then(() =>
                            onDeletion?.(path))
                        setOpenDeletion(false);
                    }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>)
}

export default Clip
