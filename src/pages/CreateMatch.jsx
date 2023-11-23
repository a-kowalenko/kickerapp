import { useNavigate } from "react-router-dom";
import ChoosePlayers from "../features/matches/ChoosePlayers";
import useWindowWidth from "../hooks/useWindowWidth";
import { media } from "../utils/constants";
import ChoosePlayersMobile from "../features/matches/ChoosePlayersMobile";
import { ChoosePlayerProvider } from "../contexts/ChoosePlayerContext";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useMatchContext } from "../contexts/MatchContext";

function CreateMatch() {
    const { activeMatch } = useMatchContext();
    const navigate = useNavigate();
    const windowWidth = useWindowWidth();

    useEffect(
        function () {
            if (activeMatch) {
                toast.error(`There is already an active match`);
                navigate(`/matches/${activeMatch.id}`);
            }
        },
        [activeMatch, navigate]
    );

    return (
        <ChoosePlayerProvider>
            {windowWidth > media.maxTablet ? (
                <ChoosePlayers />
            ) : (
                <ChoosePlayersMobile />
            )}
        </ChoosePlayerProvider>
    );
}

export default CreateMatch;
