import Drawer from '@/components/Drawer';
import Viewers from '@/components/Viewers';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react'
import './App.scss'
import { Event } from 'tesler-core';


function App() {
    const [currentTime, setCurrentTime] = useState(0);
    const [paused, setPaused] = useState<boolean>(false);
    const [event, setEvent] = useState<Event>();
    const [sliderValue, setSliderValue] = useState<number>(0);
    const [maxElements, setMaxElements] = useState<number>();
    const [mark, setMark] = useState<{ value: number }[]>([])

    useEffect(() => {
        if (paused) return;
        const toID = setTimeout(() => {
            setSliderValue(prevState => prevState + 1);
        }, 1000);

        return () => clearTimeout(toID);
    }, [sliderValue, paused])


    return (
        <main>
            <Drawer onEventSelected={event => {
                setEvent(event);
                setCurrentTime(0);
                setSliderValue(0);
            }} />

            {!event && (
                <Box sx={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}>
                    <Typography sx={{
                        fontSize: '5rem',
                        fontWeight: 900,
                        letterSpacing: 8,
                        color: 'rgba(255,255,255,0.04)',
                        lineHeight: 1,
                    }}>
                        TesLEr
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.18)', mt: 1, letterSpacing: 1 }}>
                        Select a clip from the sidebar
                    </Typography>
                </Box>
            )}

            {event && <>
                <Viewers event={event}
                    currentTime={currentTime}
                    paused={paused}
                    onProcessMaxElements={setMaxElements}
                    onProcessStartDate={startedDate => {
                        const diff = (event.timestamp.getTime() - startedDate.getTime()) / 1000;
                        setMark([{ value: diff }]);
                    }} />

                <div id="slider">
                    <Stack spacing={1.5} direction="row" alignItems="center" justifyContent="center">
                        {/* Event info */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 120, mr: 0.5 }}>
                            <Typography variant="caption" sx={{
                                display: 'flex', alignItems: 'center', gap: 0.5,
                                color: 'rgba(255,255,255,0.75)', lineHeight: 1.3, fontWeight: 600,
                            }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 12 }} />
                                {event.city}
                            </Typography>
                            <Typography variant="caption" sx={{
                                color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', lineHeight: 1.2,
                            }}>
                                {event.timestamp.toLocaleString()}
                            </Typography>
                        </Box>

                        {/* Play / Pause */}
                        <IconButton
                            size="small"
                            onClick={() => setPaused(p => !p)}
                            sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                        >
                            {paused ? <PlayArrowIcon /> : <PauseIcon />}
                        </IconButton>

                        {/* Scrubber */}
                        <Slider
                            valueLabelDisplay="on"
                            valueLabelFormat={(v) => v < 60 ? `${v}s` : `${Math.floor(v / 60)}m${v % 60 > 0 ? `${v % 60}s` : ''}`}
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
                                '& .MuiSlider-mark': {
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: '#e31937',
                                },
                                '& .MuiSlider-markActive': {
                                    backgroundColor: '#e31937',
                                },
                                '& .MuiSlider-thumb': {
                                    width: 14,
                                    height: 14,
                                },
                            }} />
                    </Stack>
                </div>
            </>}
        </main>
    )
}

export default App
