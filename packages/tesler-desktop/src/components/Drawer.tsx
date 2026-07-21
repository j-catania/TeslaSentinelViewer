import Clips from '@/components/Clips';
import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';
import UsbIcon from '@mui/icons-material/Usb';

import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Event } from "@/types";

const TEST_PATH = import.meta.env.DEV ? '/Users/Juu/Downloads/TESLADRIVE' : null;

const CLIP_TYPES = ['SentryClips', 'SavedClips'] as const;
type ClipType = typeof CLIP_TYPES[number];

interface IDrawer {
    onEventSelected: (event?: Event) => void,
}

const Drawer = ({ onEventSelected }: IDrawer) => {
    const [volumes, setVolumes] = useState<string[]>();
    const [source, setSource] = useState<string>('');
    const [clipType, setClipType] = useState<ClipType>('SentryClips');
    const [open, setOpen] = useState<boolean>(true);
    const [opennable, setOpennable] = useState<boolean>(false);

    useEffect(() => {
        updateSources();
    }, [])

    const updateSources = () => {
        window.sentinel.getFiles('/Volumes')
            .then((vols: string[]) =>
                Promise.all(
                    vols.map(vol =>
                        window.sentinel.getFiles(`${vol}/TeslaCam`)
                            .then(() => vol)
                            .catch(() => null)
                    )
                )
            )
            .then((results) => results.filter((v): v is string => v !== null))
            .then(setVolumes);
    }
    return <>

        {/* Toggle button — only visible when drawer is closed */}
        {!open && (
            <IconButton className="toggle-drawer"
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setOpen(true);
                }}>
                <MenuIcon />
            </IconButton>
        )}

        {/* Backdrop — closes drawer on outside click, only when a clip has been selected */}
        {open && opennable && (
            <div className="drawer-backdrop" onClick={() => setOpen(false)} />
        )}

        <Stack spacing={1} alignItems="flex-start" className={open ? 'opened' : ''}>
            {/* App branding */}
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                pt: 1.5, pb: 1.5, mb: 0.5, width: '100%',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
                <Box sx={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e31937 0%, #7a0000 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1rem', color: 'white', flexShrink: 0,
                    userSelect: 'none',
                }}>T</Box>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} lineHeight={1.1}
                        letterSpacing={1.5} sx={{ fontSize: '1.05rem' }}>
                        TesLEr
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1, display: 'block' }}>
                        Sentry Mode Viewer
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <Select size='small'
                        displayEmpty
                        renderValue={(val) => (val as string) ? (val as string).split('/')[2] : 'Source'}
                        value={source}
                        onChange={(e: SelectChangeEvent) => setSource(e.target.value)}>

                        {volumes?.map(vol => {
                            const name = vol.split('/')[2];
                            return <MenuItem key={vol} value={vol}>
                                <ListItemIcon>
                                    <UsbIcon color={name === 'TESLADRIVE' ? 'success' : undefined} />
                                </ListItemIcon>
                                {name}
                            </MenuItem>
                        })}
                        {volumes?.length === 0 &&
                            <MenuItem disabled>No USB device found</MenuItem>}
                        {TEST_PATH && <MenuItem value={TEST_PATH}>
                            {TEST_PATH}
                        </MenuItem>}
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 140 }}>
                    <Select size='small'
                        value={clipType}
                        onChange={(e: SelectChangeEvent) => setClipType(e.target.value as ClipType)}>
                        {CLIP_TYPES.map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <IconButton onClick={updateSources}>
                    <RefreshIcon />
                </IconButton>
            </Box>
            {source && <Clips path={`${source}/TeslaCam/${clipType}`}
                onSelection={event => {
                    setOpen(false);
                    onEventSelected(event);
                    setOpennable(true);
                }
                } />}
        </Stack>

    </>
}

export default Drawer;
