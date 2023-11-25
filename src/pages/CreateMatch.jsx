import { useNavigate } from "react-router-dom";
import ChoosePlayers from "../features/matches/ChoosePlayers";
import useWindowWidth from "../hooks/useWindowWidth";
import ChoosePlayersMobile from "../features/matches/ChoosePlayersMobile";
import { ChoosePlayerProvider } from "../contexts/ChoosePlayerContext";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useMatchContext } from "../contexts/MatchContext";
import styled from "styled-components";
import Heading from "../ui/Heading";

const StyledCreateMatch = styled.div`
    display: flex;
    flex-direction: column;
    margin: 2rem 0;
`;

function CreateMatch() {
    const { activeMatch } = useMatchContext();
    const navigate = useNavigate();
    const { isDesktop } = useWindowWidth();

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
            <Heading as="h1" type="page" hasBackBtn={true}>
                Create Match
            </Heading>
            <StyledCreateMatch>
                {isDesktop ? <ChoosePlayers /> : <ChoosePlayersMobile />}
            </StyledCreateMatch>
        </ChoosePlayerProvider>
    );
}

export default CreateMatch;
