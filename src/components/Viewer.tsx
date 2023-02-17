import {MutableRefObject, ReactEventHandler, useEffect, useRef} from 'react';

interface IViewer {
    src: string,
    size?: 'full' | 'small',
    duration?: (data?: number) => void,
    currentTime: number,
    onClick?: React.MouseEventHandler<HTMLVideoElement>,
    onEnded?: ReactEventHandler<HTMLVideoElement>,
    paused: boolean,
}

const Viewer = ({src, duration, currentTime, onClick, onEnded, paused}: IViewer) => {
    const video = useRef<HTMLVideoElement>();

    useEffect(() => {
        if (paused) {
            video.current?.pause();
        } else {
            video.current?.play();
        }
    }, [paused])
    useEffect(() => {
        if (video.current) {
            video.current.currentTime = currentTime;
        }
    }, [currentTime])
    useEffect(() => {
        duration?.(video.current?.duration)
    }, [])

    return (
        <video autoPlay
               key={src}
               ref={video as MutableRefObject<HTMLVideoElement>}
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
