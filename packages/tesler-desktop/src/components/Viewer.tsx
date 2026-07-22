import {ReactEventHandler, useEffect, useRef} from 'react';

interface IViewer {
    src: string,
    currentTime: number,
    onClick?: React.MouseEventHandler<HTMLVideoElement>,
    onEnded?: ReactEventHandler<HTMLVideoElement>,
    paused: boolean,
}

const Viewer = ({src, currentTime, onClick, onEnded, paused}: IViewer) => {
    const video = useRef<HTMLVideoElement>(null);

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

    return (
        <video autoPlay
               key={src}
               ref={video}
               muted
               onEnded={onEnded}
               width="100%"
               onClick={onClick}
        >
            <source src={src}/>
        </video>);
}

export default Viewer;
