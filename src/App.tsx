import Drawer from '@/components/Drawer';
import Viewers from '@/components/Viewers';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {Stack} from '@mui/joy';
import Slider from '@mui/joy/Slider';
import {CssVarsProvider} from '@mui/joy/styles'
import {useEffect, useState} from 'react'
import './App.scss'

function App() {
    const [currentTime, setCurrentTime] = useState(0);
    const [paused, setPaused] = useState<boolean>(false);
    const [clip, setClip] = useState<string>();
    const [sliderValue, setSliderValue] = useState<number>(0);
    const [maxElements, setMaxElements] = useState<number>();


    useEffect(() => {

        const toID = setTimeout(() => {
            setSliderValue(prevState => prevState + 1);
        }, 1000);

        return () => clearTimeout(toID);
    }, [sliderValue])


    return (
        <CssVarsProvider>
            <main>
                <Drawer onPathSelected={path => {
                    setClip(path);
                    setCurrentTime(0);
                    setSliderValue(0);
                }}/>

                {clip && <>
                    <Viewers root={clip}
                             currentTime={currentTime}
                             paused={paused}
                             onProcessMaxElements={setMaxElements}/>

                    <div id="slider">
                        <Stack spacing={2} direction="row" alignItems="center" justifyContent="center">
                            {paused ? <PlayArrowIcon onClick={() => setPaused(false)}/>
                                : <PauseIcon onClick={() => setPaused(true)}/>}
                            <Slider
                                valueLabelDisplay="on"
                                min={0}
                                max={60 * (maxElements ?? 0)}
                                step={1}
                                defaultValue={0}
                                value={sliderValue}
                                onChangeCommitted={(_, val) => {
                                    setCurrentTime(val as number)
                                    setSliderValue(val as number)
                                }}/>
                        </Stack>
                    </div>
                </>}
            </main>
        </CssVarsProvider>
    )
}

export default App
