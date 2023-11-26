import { useEffect, useMemo } from "react";
import { useSound } from "../contexts/SoundContext";

export function useAudio(audioPath) {
    const audio = useMemo(() => new Audio(audioPath), [audioPath]);
    const { isSound } = useSound();

    useEffect(
        function () {
            audio.muted = !isSound;
        },
        [isSound, audio]
    );

    return audio;
}
