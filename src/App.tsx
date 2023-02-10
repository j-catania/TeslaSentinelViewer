import Viewer from '@/components/Viewer';
import Viewers from '@/components/Viewers';
import {useEffect, useState} from 'react'
import {CssVarsProvider} from '@mui/joy/styles'
import './App.scss'
import Slider from '@mui/joy/Slider';

function App() {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState<number>();

    useEffect(() => {
        for (let elementByTagNameElement of document.getElementsByTagName('video')) {
            elementByTagNameElement.currentTime = currentTime ?? 0 / 1000;
            elementByTagNameElement.play();
        }
    }, [currentTime]);

    return (
        <CssVarsProvider>
            <main>

                <Viewers root="file:///Users/juu/Downloads" setDuration={setDuration} currentTime={currentTime}/>

                <div id="slider">
                    <Slider
                        valueLabelDisplay="on"
                        min={0}
                        max={duration}
                        step={0.1}
                        defaultValue={0}
                        value={currentTime}
                        onChangeCommitted={(_, val) => setCurrentTime(val as number)}/>
                </div>
            </main>
        </CssVarsProvider>
    )
}

export default App
