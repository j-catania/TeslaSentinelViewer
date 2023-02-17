import Clips from '@/components/Clips';
import Viewer from '@/components/Viewer';
import Viewers from '@/components/Viewers';
import {FormControl, Modal, ModalClose, ModalDialog, Option, Select, Stack, Typography} from '@mui/joy';
import {useEffect, useState} from 'react'
import {CssVarsProvider} from '@mui/joy/styles'
import './App.scss'
import Slider from '@mui/joy/Slider';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const ROOT_PATH = '/Users/juu/Downloads/TESLADRIVE';
const SENTRY_PATH = `/TeslaCam/SentryClips`;

function App() {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState<number>();
    const [openedModal, setOpenedModal] = useState<boolean>(true);
    const [paused, setPaused] = useState<boolean>(false);
    const [source, setSource] = useState<string>();
    const [clip, setClip] = useState<string>();

    useEffect(() => {
        for (let elementByTagNameElement of document.getElementsByTagName('video')) {
            elementByTagNameElement.currentTime = currentTime ?? 0 / 1000;
            elementByTagNameElement.play();
        }
    }, [currentTime]);

    return (
        <CssVarsProvider>
            <main>
                <Modal open={openedModal} onClose={() => setOpenedModal(false)}>
                    <ModalDialog size="lg">
                        <ModalClose/>

                        <Stack spacing={2}>
                            <Select placeholder="Source" onChange={(e, val) => setSource(val)}>
                                <Option value={ROOT_PATH}>{ROOT_PATH}</Option>
                            </Select>
                            {source && <Clips path={source + SENTRY_PATH} onSelection={path => {
                                setOpenedModal(false);
                                setClip(path);
                            }
                            }/>}
                        </Stack>
                    </ModalDialog>
                </Modal>

                {clip && <>
                    <Viewers root={clip} setDuration={setDuration} currentTime={currentTime} paused={paused}/>
                    <div id="slider">
                        <Stack spacing={2} direction="row" alignItems="center" justifyContent="center">
                            {paused ? <PlayArrowIcon onClick={() => setPaused(false)}/> : <PauseIcon onClick={() => setPaused(true)}/>}
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
