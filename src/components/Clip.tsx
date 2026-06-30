import {Event, TeslaEventJSON} from '@/types/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import {useEffect, useState} from 'react';

interface IClip {
    path: string,
    onSelection?: (event?: Event) => void,
    onDeletion?: (path: string) => void,
    active?: boolean,
    onSelectionChange?: (selected: boolean) => void,
}

const Clip = ({path, onSelection, onDeletion, active = false, onSelectionChange}: IClip) => {
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
                  backgroundColor: active ? 'action.selected' : 'transparent',
                  cursor: 'pointer',
              }}
              onClick={() => status === 'ready' && onSelection?.(event)}>
            <Box sx={{ position: 'relative' }}>
                <Checkbox
                    sx={{ position: 'absolute', top: 0, left: 0, zIndex: 4 }}
                    onClick={e => {
                        e.stopPropagation();
                        onSelectionChange?.((e.target as HTMLInputElement).checked);
                    }}/>
                <Box sx={{ position: 'relative', paddingTop: '50%', overflow: 'hidden' }}>
                    {status === 'loading'
                        ? <Skeleton variant="rectangular" sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                        : <img
                            src={thumb ? `data:image/png;base64,${thumb}` : ''}
                            loading="lazy"
                            alt=""
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                    }
                </Box>
            </Box>
            <CardContent>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div style={{flex: 1}}>
                        {status === 'loading' ? (
                            <>
                                <Skeleton variant="text" width="70%" sx={{ mt: 2 }} />
                                <Skeleton variant="text" width="50%" />
                            </>
                        ) : status === 'error' ? (
                            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                                Failed to load clip
                            </Typography>
                        ) : (
                            <>
                                <Typography variant="subtitle1" sx={{fontSize: 'md', mt: 2, display: 'flex', alignItems: 'center', gap: 0.5}}>
                                    <LocationOnRoundedIcon fontSize="small"/> {event?.city}
                                </Typography>
                                <Typography variant="body2" sx={{mt: 0.5, mb: 2, display: 'flex', alignItems: 'center', gap: 0.5}}>
                                    <AccessTimeIcon fontSize="small"/> {event?.timestamp.toLocaleString()}
                                </Typography>
                            </>
                        )}
                    </div>
                    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        <Button variant="contained"
                                size="small"
                                color="primary"
                                aria-label="Remove clip"
                                sx={{ml: 'auto', fontWeight: 600, minWidth: 'auto', p: '4px'}}
                                onClick={(e: any) => {
                                    e.stopPropagation();
                                    setOpenDeletion(true);
                                }}>
                            <DeleteForeverIcon/>
                        </Button>
                    </Box>
                </Box>
            </CardContent>
            <Dialog
                open={openDeletion}
                onClose={() => setOpenDeletion(false)}
                aria-labelledby="alert-dialog-modal-title"
                aria-describedby="alert-dialog-modal-description"
            >
                <DialogTitle id="alert-dialog-modal-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningRoundedIcon/>
                    Confirmation
                </DialogTitle>
                <Divider/>
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
