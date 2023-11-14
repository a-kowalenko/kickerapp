import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from "react-icons/hi2";
import { useSound } from "../contexts/SoundContext";
import ButtonIcon from "./ButtonIcon";

function SoundToggle() {
    const { isSound, toggleSound } = useSound();

    return (
        <ButtonIcon onClick={toggleSound}>
            {isSound ? <HiOutlineSpeakerWave /> : <HiOutlineSpeakerXMark />}
        </ButtonIcon>
    );
}

export default SoundToggle;
