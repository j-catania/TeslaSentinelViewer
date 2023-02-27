import Clips from '@/components/Clips';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import RefreshIcon from '@mui/icons-material/Refresh';
import UsbIcon from '@mui/icons-material/Usb';

import {ListItemDecorator, Option, Select} from '@mui/joy';
import IconButton from '@mui/joy/IconButton';
import Stack from '@mui/joy/Stack';
import {useEffect, useState} from 'react';

const ROOT_PATH = '/Users/juu/Downloads/TESLADRIVE';
const SENTRY_PATH = `/TeslaCam/SentryClips`;

interface IDrawer {
    onPathSelected: (param: string) => void,
}

const Drawer = ({onPathSelected}: IDrawer) => {
    const [volumes, setVolumes] = useState<string[]>();
    const [source, setSource] = useState<string>();
    const [open, setOpen] = useState<boolean>();

    useEffect(() => {
        updateSources();
    }, [])

    const updateSources = () => {
        window.sentinel.getFiles('/Volumes')
            .then((vols: string[]) => vols.filter(vol => vol.indexOf('Macintosh HD') === -1 && vol.indexOf('com.apple.') === -1))
            .then(setVolumes)
    }
    return <>
        <IconButton variant="plain"
                    onClick={(e: any) => {
                        e.stopPropagation();
                        setOpen(true);
                    }}>
            <ArrowForwardIosIcon/>
        </IconButton>
        <Stack spacing={1} className={open ? 'opened' : ''} alignItems="flex-start">
            <IconButton variant="plain"
                        color="neutral"
                        onClick={(e: any) => {
                            e.stopPropagation();
                            setOpen(false);
                        }}>
                <MenuOpenIcon/>
            </IconButton>

            <Select placeholder="Source"
                    endDecorator={
                        <RefreshIcon onMouseDown={(event) => {
                            // don't open the popup when clicking on this button
                            event.stopPropagation();
                        }}
                                     onClick={() => {
                                         updateSources();
                                     }}/>
                    }
                    onChange={(e, val) => setSource(val as string)}>

                {volumes?.map(vol => {
                    const name = vol.split('/')[2];
                    return <Option key={vol} value={vol}>
                        <ListItemDecorator>
                            <UsbIcon color={name === 'TESLADRIVE' ? 'success' : undefined}/>
                        </ListItemDecorator>
                        {name}
                    </Option>
                })}

                <Option value={ROOT_PATH}>{ROOT_PATH}</Option>

            </Select>
            {source && <Clips path={source + SENTRY_PATH}
                              onSelection={path => {
                                  setOpen(false);
                                  onPathSelected(path);
                              }
                              }/>}
        </Stack>
    </>
}

export default Drawer;
