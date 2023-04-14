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

const Viewers = ({event, currentTime, paused, onProcessMaxElements, onProcessStartDate}: IViewers) => {
    const [activeArea, setActiveArea] = useState<Areas>('front')
    const [videos, setVideos] = useState<Videos>();
    const [parts, setParts] = useState<Part[]>();
    // video index in the array
    const [index, setIndex] = useState<number>(0);
    // wanted currentTime in the video
    const [videoTime, setVideoTime] = useState<number>(0);

    useEffect(() => {
        // @ts-ignore
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
                let startedDateStr = vids.lefts[0]
                    .split('/')
                    .pop()
                    ?.replace('-left_repeater.mp4', '')
                    .replace('_', 'T') ?? '';
                const explodedStartedDate = startedDateStr.split('T');
                startedDateStr = explodedStartedDate[0] + 'T' + explodedStartedDate[1].replaceAll('-', ':');

                const startedDate = new Date(startedDateStr ?? '');

                onProcessStartDate?.(startedDate)
                onProcessMaxElements?.(vids.lefts.length);

                setParts([{
                    area: 'left_repeater',
                    path: `file://${vids?.lefts[index]}`
                }, {
                    area: 'right_repeater',
                    path: `file://${vids?.rights[index]}`
                }, {
                    area: 'front',
                    path: `file://${vids?.fronts[index]}`
                }, {
                    area: 'back',
                    path: `file://${vids?.backs[index]}`
                }])
            })
    }, [event]);

    useEffect(() => {
        console.log({index})
        if (index < (videos?.backs.length ?? 0)) {
            setParts([{
                area: 'left_repeater',
                path: `file://${videos?.lefts[index]}`
            }, {
                area: 'right_repeater',
                path: `file://${videos?.rights[index]}`
            }, {
                area: 'front',
                path: `file://${videos?.fronts[index]}`
            }, {
                area: 'back',
                path: `file://${videos?.backs[index]}`
            }])
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
