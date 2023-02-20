import Clips from '@/components/Clips';
import Viewers from '@/components/Viewers';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import UsbIcon from '@mui/icons-material/Usb';
import {ListItemDecorator, Option, Select, Stack} from '@mui/joy';
import Slider from '@mui/joy/Slider';
import {CssVarsProvider} from '@mui/joy/styles'
import {useEffect, useState} from 'react'
import './App.scss'

const ROOT_PATH = '/Users/juu/Downloads/TESLADRIVE';
const SENTRY_PATH = `/TeslaCam/SentryClips`;

function App() {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState<number>();
    const [openedModal, setOpenedModal] = useState<boolean>(true);
    const [paused, setPaused] = useState<boolean>(false);
    const [source, setSource] = useState<string>();
    const [clip, setClip] = useState<string>();

    const [volumes, setVolumes] = useState<string[]>();

    useEffect(() => {
        for (let elementByTagNameElement of document.getElementsByTagName('video')) {
            elementByTagNameElement.currentTime = currentTime ?? 0 / 1000;
            elementByTagNameElement.play();
        }
    }, [currentTime]);

    useEffect(() => {
        updateSources();
    }, [])

    const updateSources = () => {
        window.sentinel.getFiles('/Volumes')
            .then((vols: string[]) => vols.filter(vol => vol.indexOf('Macintosh HD') === -1 && vol.indexOf('com.apple.') === -1))
            .then(setVolumes)
    }

    return (
        <CssVarsProvider>
            <main>

                {!clip && <Stack spacing={1}>
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
                    {source && <Clips path={source + SENTRY_PATH} onSelection={path => {
                        setOpenedModal(false);
                        setClip(path);
                    }
                    }/>}
                </Stack>}

                {clip && <>
                    <Viewers root={clip} setDuration={setDuration} currentTime={currentTime} paused={paused}/>
                    <div id="slider">
                        <Stack spacing={2} direction="row" alignItems="center" justifyContent="center">
                            {paused ? <PlayArrowIcon onClick={() => setPaused(false)}/>
                                : <PauseIcon onClick={() => setPaused(true)}/>}
                            <Slider
                                valueLabelDisplay="on"
                                min={0}
                                max={duration}
                                step={0.1}
                                defaultValue={0}
                                value={currentTime}
                                onChangeCommitted={(_, val) => setCurrentTime(val as number)}/>
                        </Stack>
                    </div>
                </>}
            </main>
        </CssVarsProvider>
    )
}

export default App
