import Viewer from '@/components/Viewer';
import {Areas, Event, Part, Videos} from '@/types';
import {Fragment, useEffect, useState} from 'react';

interface IViewers {
    // folder path
    event: Event,
    // changed on slider click
    currentTime: number,
    // changed on play/pause button action
    paused: boolean,
    // fired when finding how many videos in folder
    onProcessMaxElements?: (param: number) => void
    // fired when finding the start date
    onProcessStartDate?: (param: Date) => void
}

const buildParts = (vids: Videos, idx: number): Part[] => [
    {area: 'left_repeater', path: `file://${vids.lefts[idx]}`},
    {area: 'right_repeater', path: `file://${vids.rights[idx]}`},
    {area: 'front', path: `file://${vids.fronts[idx]}`},
    {area: 'back', path: `file://${vids.backs[idx]}`},
];

const Viewers = ({event, currentTime, paused, onProcessMaxElements, onProcessStartDate}: IViewers) => {
    const [activeArea, setActiveArea] = useState<Areas>('front')
    const [videos, setVideos] = useState<Videos>();
    const [parts, setParts] = useState<Part[]>();
    // video index in the array
    const [index, setIndex] = useState<number>(0);
    // wanted currentTime in the video
    const [videoTime, setVideoTime] = useState<number>(0);

    useEffect(() => {
        window.sentinel.getFiles(event.root)
            .then((vals: string[]) => vals.sort())
            .then((paths: string[]) => ({
                backs: paths.filter(item => item.indexOf('-back.mp4') > -1),
                rights: paths.filter(item => item.indexOf('-right_repeater.mp4') > -1),
                lefts: paths.filter(item => item.indexOf('-left_repeater.mp4') > -1),
                fronts: paths.filter(item => item.indexOf('-front.mp4') > -1)
            }))
            .then((vids: Videos) => {
                setVideos(vids);
                // Filename format: YYYY-MM-DD_HH-MM-SS-left_repeater.mp4
                const filename = vids.lefts[0]?.split('/').pop() ?? '';
                const match = filename.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})/);
                if (match) {
                    const [, date, h, m, s] = match;
                    onProcessStartDate?.(new Date(`${date}T${h}:${m}:${s}`));
                }
                onProcessMaxElements?.(Math.max(
                    vids.fronts.length, vids.backs.length,
                    vids.lefts.length, vids.rights.length
                ));

                setParts(buildParts(vids, index));
            })
    }, [event]);

    useEffect(() => {
        if (videos && index < videos.backs.length) {
            setParts(buildParts(videos, index));
        }
    }, [index])

    useEffect(() => {
        setIndex(Math.trunc(currentTime / 60));
        setVideoTime(currentTime % 60);
    }, [currentTime])


    return (<Fragment>
        {parts?.map((part) => {
            return <div key={part.area}
                        className={'viewer ' + part.area + (part.area === activeArea ? ' active' : '')}>
                <Viewer currentTime={videoTime}
                        paused={paused}
                        src={part.path}
                        onClick={() => setActiveArea(part.area)}
                        onEnded={() => {
                            if (part.area === activeArea) {
                                setIndex(prevState => prevState + 1)
                            }
                        }}/>
            </div>
        })}

        <div className={'viewer empty-video ' + activeArea}></div>
    </Fragment>)
}

export default Viewers;
