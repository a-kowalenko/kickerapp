import { useNavigate } from "react-router-dom";
import ChoosePlayers from "../features/matches/ChoosePlayers";
import { useActiveMatch } from "../features/matches/useActiveMatch";
import { useEffect } from "react";
import toast from "react-hot-toast";

function CreateMatch() {
    const { activeMatch, isLoading, error } = useActiveMatch();
    const navigate = useNavigate();

    console.log("activeMatch", activeMatch);

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
        <>
            <ChoosePlayers />
        </>
    );
}

export default CreateMatch;
