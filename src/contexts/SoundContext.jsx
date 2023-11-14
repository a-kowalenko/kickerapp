import { useContext, createContext } from "react";
import toast from "react-hot-toast";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

const SoundContext = createContext();

function SoundProvider({ children }) {
    const [isSound, setIsSound] = useLocalStorageState(true, "isSound");

    function toggleSound() {
        setIsSound((sound) => {
            toast.success(`Sound was turned ${sound ? "off" : "on"}`);
            return !sound;
        });
    }

    return (
        <SoundContext.Provider value={{ isSound, toggleSound }}>
            {children}
        </SoundContext.Provider>
    );
}

function useSound() {
    const context = useContext(SoundContext);

    if (context === undefined) {
        throw new Error("SoundContext was used outside the SoundProvider");
    }

    return context;
}

export { SoundProvider, useSound };
