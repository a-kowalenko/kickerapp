import { useNavigate } from "react-router-dom";
import ChoosePlayers from "../features/matches/ChoosePlayers";
import { useActiveMatch } from "../features/matches/useActiveMatch";
import { useEffect } from "react";
import toast from "react-hot-toast";
import useWindowWidth from "../hooks/useWindowWidth";
import { media } from "../utils/constants";
import ChoosePlayersMobile from "../features/matches/ChoosePlayersMobile";
import { ChoosePlayerProvider } from "../contexts/ChoosePlayerContext";
import Spinner from "../ui/Spinner";
import Error from "../ui/Error";

function CreateMatch() {
    const { activeMatch, isLoading, error } = useActiveMatch();
    const navigate = useNavigate();
    const windowWidth = useWindowWidth();

    useEffect(
        function () {
            if (activeMatch?.length > 0) {
                toast.error(`There is already an active match`);
                navigate(`/matches/${activeMatch[0].id}`);
            }
        },
        [activeMatch, navigate]
    );

    if (isLoading) {
        return <Spinner />;
    }

    if (error) {
        return <Error message={error.message} />;
    }

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
