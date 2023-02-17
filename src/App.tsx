import Clips from '@/components/Clips';
import Viewer from '@/components/Viewer';
import Viewers from '@/components/Viewers';
import {FormControl, Modal, ModalClose, ModalDialog, Option, Select, Stack, Typography} from '@mui/joy';
import {useEffect, useState} from 'react'
import {CssVarsProvider} from '@mui/joy/styles'
import './App.scss'
import Slider from '@mui/joy/Slider';

const ROOT_PATH = '/Users/juu/Downloads/TESLADRIVE';
const SENTRY_PATH = `/TeslaCam/SentryClips`;

function App() {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState<number>();
    const [openedModal, setOpenedModal] = useState<boolean>(true);
    const [source, setSource] = useState<string>();

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
                            {source && <Clips path={source+SENTRY_PATH}/>}
                        </Stack>
                    </ModalDialog>
                </Modal>

                {/*<Viewers root="file:///Users/juu/Downloads" setDuration={setDuration} currentTime={currentTime}/>

                <div id="slider">
                    <Slider
                        valueLabelDisplay="on"
                        min={0}
                        max={duration}
                        step={0.1}
                        defaultValue={0}
                        value={currentTime}
                        onChangeCommitted={(_, val) => setCurrentTime(val as number)}/>
                </div>*/}
            </main>
        </CssVarsProvider>
    )
}

export default App
