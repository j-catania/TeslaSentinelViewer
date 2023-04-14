import Drawer from '@/components/Drawer';
import Viewers from '@/components/Viewers';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {Stack} from '@mui/joy';
import Slider from '@mui/joy/Slider';
import {CssVarsProvider} from '@mui/joy/styles'
import {useEffect, useState} from 'react'
import './App.scss'
import {Event} from "@/types";


function App() {
    const [currentTime, setCurrentTime] = useState(0);
    const [paused, setPaused] = useState<boolean>(false);
    const [event, setEvent] = useState<Event>();
    const [sliderValue, setSliderValue] = useState<number>(0);
    const [maxElements, setMaxElements] = useState<number>();
    const [mark, setMark] = useState<{ value: number }[]>([])

    useEffect(() => {

        const toID = setTimeout(() => {
            setSliderValue(prevState => prevState + 1);
        }, 1000);

        return () => clearTimeout(toID);
    }, [sliderValue])


    return (
        <CssVarsProvider>
            <main>
                <Drawer onEventSelected={event => {
                    setEvent(event);
                    setCurrentTime(0);
                    setSliderValue(0);
                }}/>

                {event && <>
                    <Viewers event={event}
                             currentTime={currentTime}
                             paused={paused}
                             onProcessMaxElements={setMaxElements}
                             onProcessStartDate={startedDate => {
                                 const diff = (event.timestamp.getTime() - startedDate.getTime()) / 1000;
                                 setMark([{value: diff}]);
                             }}/>

                    <div id="slider">
                        <Stack spacing={2} direction="row" alignItems="center" justifyContent="center">
                            {paused ? <PlayArrowIcon onClick={() => setPaused(false)}/>
                                : <PauseIcon onClick={() => setPaused(true)}/>}
                            <Slider
                                valueLabelDisplay="on"
                                min={0}
                                max={60 * (maxElements ?? 0)}
                                step={1}
                                marks={mark}
                                defaultValue={0}
                                value={sliderValue}
                                onChangeCommitted={(_, val) => {
                                    setCurrentTime(val as number)
                                    setSliderValue(val as number)
                                }}
                                sx={{
                                    "--Slider-mark-size": "10px",
                                    "--Slider-mark-background": '#de0000'
                                }}/>
                        </Stack>
                    </div>
                </>}
            </main>
        </CssVarsProvider>
    )
}

export default App
