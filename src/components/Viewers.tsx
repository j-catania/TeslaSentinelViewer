import Viewer from '@/components/Viewer';
import {Areas} from '@/types/Areas';
import {useState} from 'react';

interface IViewers {
    root: string,
    setDuration: (data: number) => void,
    currentTime: number,
}

type Part = {area: Areas, path: string};

const Viewers = ({root, currentTime, setDuration}: IViewers) => {

    const [activeArea, setActiveArea] = useState<Areas>('front')

    const parts: Part[] = [{
        area: 'left_repeater',
        path: `${root}/PXL_20230128_061316490.mp4`
    }, {
        area: 'right_repeater',
        path: `${root}/PXL_20230128_061316490.mp4`
    }, {
        area: 'front',
        path: `${root}/PXL_20230128_061316490.mp4`
    }, {
        area: 'back',
        path: `${root}/PXL_20230128_061316490.mp4`
    }];

    return (<>
        <Viewer src={parts.find(val => val.area === activeArea)?.path ?? ''}
                duration={setDuration}
                currentTime={currentTime}/>

        {parts.map((part) => {
            return <div key={part.area} className={'viewer '+part.area}>
                <Viewer src={part.path} onClick={() => setActiveArea(part.area)} disable={part.area === activeArea}/>
            </div>
        })}
    </>)
}

export default Viewers;
