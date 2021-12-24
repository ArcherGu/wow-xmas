import "./index.css";
import bow from "../../assets/bow.svg";
import { useState } from "react";
import Postcard from "../postcard";

interface CoverProps {
    onClick: () => Promise<any>,
    showTouch: boolean
}
const Index: React.FC<CoverProps> = ({ onClick, showTouch = false }) => {
    const [coverClass, setCoverClass] = useState("cover");
    const openIt = () => {
        if (!showTouch) return;
        onClick().then(() => {
            setCoverClass("cover open");
            setTimeout(() => {
                setCoverClass("cover opened")
            }, 1900);
        })
    }

    return (
        <div className={coverClass}>
            <div className="line-item line-item--hor" />
            <div className="line-item line-item--vert" />
            <div className="bow">
                <img src={bow} alt="bow" onClick={openIt} />
                {showTouch && <IconCarbonTouch1 className="touch" />}
            </div>

            <Postcard />
        </div>
    )
}

export default Index;