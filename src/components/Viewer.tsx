import {useEffect} from 'react';

interface IViewer {
    src: string,
    size?: 'full' | 'small',
    duration?: (data: number) => void,
    currentTime?: number,
    onClick?: React.MouseEventHandler<HTMLVideoElement>,
    disable?: boolean
}

const Viewer = ({src, duration, currentTime, disable = false, onClick}: IViewer) => {

    if (disable) {
        return <div className="empty-video"></div>
    }

    return (
        <video autoPlay
               muted
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
