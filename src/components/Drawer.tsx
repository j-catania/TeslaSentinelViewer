import Clips from '@/components/Clips';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import RefreshIcon from '@mui/icons-material/Refresh';
import UsbIcon from '@mui/icons-material/Usb';

import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import {useEffect, useState} from 'react';
import {Event} from "@/types";

const TEST_PATH = import.meta.env.DEV ? '/Users/juu/Downloads/TESLADRIVE' : null;
const SENTRY_PATH = `/TeslaCam/SentryClips`;

interface IDrawer {
    onEventSelected: (event?: Event) => void,
}

const Drawer = ({onEventSelected}: IDrawer) => {
    const [volumes, setVolumes] = useState<string[]>();
    const [source, setSource] = useState<string>('');
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
                        window.sentinel.getFiles(`${vol}/TeslaCam/SentryClips`)
                            .then(() => vol)
                            .catch(() => null)
                    )
                )
            )
            .then((results) => results.filter((v): v is string => v !== null))
            .then(setVolumes);
    }
    return <>

        <IconButton className="toggle-drawer"
                    disabled={!opennable}
                    onClick={(e: any) => {
                        e.stopPropagation();
                        setOpen(prev => !prev);
                    }}>
            {open ? <MenuOpenIcon/> : <MenuIcon/>}
        </IconButton>

        <Stack spacing={1} alignItems="flex-start" className={open ? 'opened' : ''}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <Select
                        displayEmpty
                        renderValue={(val) => (val as string) ? (val as string).split('/')[2] : 'Source'}
                        value={source}
                        onChange={(e: SelectChangeEvent) => setSource(e.target.value)}>

                        {volumes?.map(vol => {
                            const name = vol.split('/')[2];
                            return <MenuItem key={vol} value={vol}>
                                <ListItemIcon>
                                    <UsbIcon color={name === 'TESLADRIVE' ? 'success' : undefined}/>
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
                <IconButton onClick={updateSources}>
                    <RefreshIcon/>
                </IconButton>
            </Box>
            {source && <Clips path={source + SENTRY_PATH}
                              onSelection={event => {
                                  setOpen(false);
                                  onEventSelected(event);
                                  setOpennable(true);
                              }
                              }/>}
        </Stack>

    </>
}

export default Drawer;
