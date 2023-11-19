import { useEffect, useMemo } from "react";
import { useSound } from "../contexts/SoundContext";

export function useAudio(audioPath) {
    const audio = useMemo(() => new Audio(audioPath), [audioPath]);
    const { isSound } = useSound();

    useEffect(
        function () {
            if (!isSound) {
                audio.volume = 0;
            } else {
                audio.volume = 1;
            }
        },
        [isSound, audio]
    );

    return audio;
}
