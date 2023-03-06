import Viewer from '@/components/Viewer';
import {Areas, Part, Videos} from '@/types';
import {Fragment, useEffect, useState} from 'react';

interface IViewers {
    // folder path
    root: string,
    // changed on slider click
    currentTime: number,
    // changed on play/pause button action
    paused: boolean,
    // fired when finding how many videos in folder
    onProcessMaxElements?: (param: number) => void
}

const Viewers = ({root, currentTime, paused, onProcessMaxElements}: IViewers) => {
    const [activeArea, setActiveArea] = useState<Areas>('front')
    const [videos, setVideos] = useState<Videos>();
    const [parts, setParts] = useState<Part[]>();
    const [index, setIndex] = useState<number>(0);
    const [videoTime, setVideoTime] = useState<number>(0);

    useEffect(() => {
        // @ts-ignore
        window.sentinel.getFiles(root)
            .then((vals: string[]) => vals.sort())
            .then((paths: string[]) => ({
                backs: paths.filter(item => item.indexOf('-back.mp4') > -1),
                rights: paths.filter(item => item.indexOf('-right_repeater.mp4') > -1),
                lefts: paths.filter(item => item.indexOf('-left_repeater.mp4') > -1),
                fronts: paths.filter(item => item.indexOf('-front.mp4') > -1)
            }))
            .then((vids: Videos) => {
                setVideos(vids);
                return vids;
            })
            .then((vids: Videos) => {
                onProcessMaxElements?.(vids?.lefts.length);

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
    }, [root]);

    useEffect(() => {
        if (index > 0 && index < (videos?.backs.length ?? 0)) {
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
        setIndex(Math.ceil(currentTime / 60));
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
