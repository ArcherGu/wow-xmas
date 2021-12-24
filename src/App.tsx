import { useEffect, useRef, useState } from "react";
import "./App.css"
import Cover from "./components/cover";
import { IsPC } from "./utils";
import { View } from "./core/view";

const Index: React.FC = () => {
    const mount = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<View>();
    const [isOrientation, setIsOrientation] = useState(false);
    const [isAutoRotate, setIsAutoRotate] = useState(true);
    const [isMusic, setIsMusic] = useState(false);
    const [isMusicPlay, setIsMusicPlay] = useState(true);
    const [showTouch, setShowTouch] = useState(false);
    const [activeCamera, setActiveCamera] = useState('pCamera');
    const isMobile = !IsPC();

    useEffect(() => {
        setView(new View(mount.current!, () => {
            setShowTouch(true);
        }, () => {
            setIsMusic(true);
        }))
        return () => {
            view?.dispose();
        }
    }, [])

    const openCover = async () => {
        if (!view) {
            alert("抱歉，这个玩意好像罢工了，请下次再玩吧~")
            return;
        }

        try {
            await view.open();
            setIsOrientation(true)
        } catch (error) {
            // denied
            console.warn(error)
            setIsOrientation(false)
        }

        view.changeToPCamera();
    }

    const triggerCamera = () => {
        if (!view) return;
        if (view.activeCamera.name === 'pCamera') {
            view.changeToGCamera();
            setActiveCamera('gCamera');
        }
        else {
            view.changeToPCamera();
            setActiveCamera('pCamera');
        }
    }

    const triggerAutoRotate = () => {
        if (view) {
            setIsAutoRotate(view.triggerAutoRotate());
        }
    }

    const triggerMusicPlay = () => {
        if (!view) return;
        view.triggerMusicPlay(!isMusicPlay);
        setIsMusicPlay(!isMusicPlay);
    }

    return (
        <div className="app">
            <div className="btn-block">
                {
                    isMusic &&
                    <div>
                        <button onClick={triggerMusicPlay} className="btn">
                            {isMusicPlay ? <IconAkarIconsSoundOff /> : <IconAkarIconsSoundOn />}
                        </button>
                    </div>
                }
                {
                    (isMobile && isOrientation) &&
                    <div>
                        <button onClick={triggerCamera} className="btn">
                            {activeCamera === 'pCamera' ? <IconIcOutlineMotionPhotosAuto /> : <IconCarbonTouch1 />}
                        </button>
                    </div>

                }
                <div>
                    <button onClick={triggerAutoRotate} className="btn">
                        {isAutoRotate ? <IconRiRotateLockLine /> : <IconRiRestartLine />}
                    </button>
                </div>
            </div>

            <Cover onClick={openCover} showTouch={showTouch} />
            <div className="world" ref={mount} />

            <div className="foot">
                Made with <IconRiHeart2Fill style={{ color: "#f43f5e" }} /> by
                <a
                    target="_blank"
                    href="https://archergu.me/"
                >Archer Gu</a>
            </div>
        </div>
    )
}

export default Index;