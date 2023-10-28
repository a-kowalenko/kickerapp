import { useNavigate } from "react-router-dom";
import ChoosePlayers from "../features/matches/ChoosePlayers";
import { useActiveMatch } from "../features/matches/useActiveMatch";
import { useEffect } from "react";
import toast from "react-hot-toast";

function CreateMatch() {
    const { activeMatch, isLoading, error } = useActiveMatch();
    const navigate = useNavigate();

    useEffect(
        function () {
            if (activeMatch?.length > 0) {
                toast.error(`There is already an active match`);
                navigate(`/matches/${activeMatch[0].id}`);
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
