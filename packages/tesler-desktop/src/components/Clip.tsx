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
import Chip from '@mui/material/Chip';
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

const formatReason = (reason: string): string =>
    reason
        .replace(/^sentry_aware_/i, '')
        .replace(/^user_interaction_/i, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .slice(0, 22);

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
        <Card
            variant="outlined"
            className="clip"
            sx={{
                width: '13rem',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1a1a1a',
                border: active
                    ? '1.5px solid rgba(227,25,55,0.75)'
                    : selected
                        ? '1.5px solid rgba(227,25,55,0.35)'
                        : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                boxShadow: active
                    ? '0 0 0 1px rgba(227,25,55,0.3), 0 4px 20px rgba(227,25,55,0.15)'
                    : 'none',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: active
                        ? '0 0 0 1px rgba(227,25,55,0.5), 0 8px 28px rgba(227,25,55,0.2)'
                        : '0 8px 24px rgba(0,0,0,0.5)',
                    borderColor: active ? 'rgba(227,25,55,0.9)' : 'rgba(255,255,255,0.18)',
                },
            }}
            onClick={() => status === 'ready' && onSelection?.(event)}
        >

            {/* Thumbnail */}
            <Box sx={{ position: 'relative' }}>
                {status === 'loading'
                    ? <Skeleton variant="rectangular" height={100} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                    : <Box
                        component="img"
                        src={thumb ? `data:image/png;base64,${thumb}` : ''}
                        loading="lazy"
                        alt=""
                        sx={{ display: 'block', width: '100%', height: 100, objectFit: 'cover', backgroundColor: '#111' }}
                    />
                }
                {/* Reason badge */}
                {status === 'ready' && event?.reason && (
                    <Chip
                        label={formatReason(event.reason)}
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            fontSize: '0.6rem',
                            height: 18,
                            bgcolor: 'rgba(0,0,0,0.65)',
                            color: 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            '& .MuiChip-label': { px: 0.75 },
                        }}
                    />
                )}
            </Box>

            {/* Info */}
            <CardContent sx={{ flex: 1, py: 0.75, px: 1.25, pb: '6px !important' }}>
                {status === 'loading' ? (
                    <>
                        <Skeleton variant="text" width="70%" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                        <Skeleton variant="text" width="50%" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                    </>
                ) : status === 'error' ? (
                    <Typography variant="body2" color="error">Failed to load clip</Typography>
                ) : (
                    <>
                        <Typography variant="subtitle2" sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5,
                            fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3,
                            color: 'rgba(255,255,255,0.9)',
                        }}>
                            <LocationOnRoundedIcon sx={{ fontSize: 13, color: '#e31937', flexShrink: 0 }} />
                            {event?.city}
                        </Typography>
                        <Typography variant="caption" sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5,
                            color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem',
                        }}>
                            <AccessTimeIcon sx={{ fontSize: 10 }} />
                            {event?.timestamp.toLocaleString()}
                        </Typography>
                    </>
                )}
            </CardContent>

            {/* Actions */}
            <CardActions sx={{ justifyContent: 'space-between', pt: 0, px: 0.5, pb: 0.5 }}>
                <Checkbox
                    size="small"
                    checked={selected}
                    sx={{
                        color: 'rgba(255,255,255,0.3)',
                        '&.Mui-checked': { color: '#e31937' },
                        padding: '4px',
                    }}
                    onClick={e => {
                        e.stopPropagation();
                        onSelectionChange?.((e.target as HTMLInputElement).checked);
                    }}
                />
                <IconButton
                    size="small"
                    color="error"
                    aria-label="Remove clip"
                    sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenDeletion(true);
                    }}
                >
                    <DeleteForeverIcon sx={{ fontSize: 16 }} />
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
