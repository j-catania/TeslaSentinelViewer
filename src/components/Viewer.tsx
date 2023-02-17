import {ReactEventHandler, useEffect, useRef} from 'react';

interface IViewer {
    src: string,
    size?: 'full' | 'small',
    duration?: (data: number) => void,
    currentTime?: number,
    onClick?: React.MouseEventHandler<HTMLVideoElement>,
    onEnded?: ReactEventHandler<HTMLVideoElement>,
    paused: boolean,
}

const Viewer = ({src, duration, currentTime, onClick, onEnded, paused}: IViewer) => {
    const video = useRef(null);

    useEffect(() => {
        if (paused) {
            video.current.pause()
        } else {
            video.current.play()
        }
    }, [paused])

    return (
        <video autoPlay
               key={src}
               ref={video}
               muted
               onEnded={onEnded}
               width="100%"
               onDurationChange={(event: any) => {
                   duration?.(event.target.duration)
               }}
               onClick={onClick}
        >
            <source src={src}/>
        </video>);
}

export default Viewer;
