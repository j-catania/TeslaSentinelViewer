import {ReactEventHandler, useEffect} from 'react';

interface IViewer {
    src: string,
    size?: 'full' | 'small',
    duration?: (data: number) => void,
    currentTime?: number,
    onClick?: React.MouseEventHandler<HTMLVideoElement>,
    onEnded?: ReactEventHandler<HTMLVideoElement>
}

const Viewer = ({src, duration, currentTime, onClick, onEnded}: IViewer) => {

    return (
        <video autoPlay
               key={src}
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
