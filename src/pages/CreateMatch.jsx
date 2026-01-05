import { useNavigate } from "react-router-dom";
import ChoosePlayers from "../features/matches/ChoosePlayers";
import ChooseTeams from "../features/matches/ChooseTeams";
import useWindowWidth from "../hooks/useWindowWidth";
import ChoosePlayersMobile from "../features/matches/ChoosePlayersMobile";
import ChooseTeamsMobile from "../features/matches/ChooseTeamsMobile";
import {
    ChoosePlayerProvider,
    useChoosePlayers,
} from "../contexts/ChoosePlayerContext";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useMatchContext } from "../contexts/MatchContext";
import styled from "styled-components";
import Heading from "../ui/Heading";
import { HiOutlineUsers, HiOutlineUserGroup } from "react-icons/hi2";

const StyledCreateMatch = styled.div`
    display: flex;
    flex-direction: column;
    margin: 2rem 0;
`;

const ModeToggle = styled.div`
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
`;

const ModeButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem 2rem;
    font-size: 1.4rem;
    font-weight: 500;
    border: 2px solid
        ${(props) =>
            props.$active ? "var(--color-brand-600)" : "var(--color-grey-300)"};
    border-radius: var(--border-radius-lg);
    background-color: ${(props) =>
        props.$active ? "var(--color-brand-600)" : "transparent"};
    color: ${(props) =>
        props.$active ? "white" : "var(--primary-text-color)"};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background-color: ${(props) =>
            props.$active ? "var(--color-brand-700)" : "var(--color-grey-100)"};
    }

    & svg {
        font-size: 1.8rem;
    }
`;

function CreateMatchContent() {
    const { isDesktop } = useWindowWidth();
    const { isTeamMatchMode, setTeamMatchMode } = useChoosePlayers();

    return (
        <StyledCreateMatch>
            <ModeToggle>
                <ModeButton
                    type="button"
                    $active={!isTeamMatchMode}
                    onClick={() => setTeamMatchMode(false)}
                >
                    <HiOutlineUsers />
                    <span>Individual</span>
                </ModeButton>
                <ModeButton
                    type="button"
                    $active={isTeamMatchMode}
                    onClick={() => setTeamMatchMode(true)}
                >
                    <HiOutlineUserGroup />
                    <span>Team Match</span>
                </ModeButton>
            </ModeToggle>

            {isTeamMatchMode ? (
                isDesktop ? (
                    <ChooseTeams />
                ) : (
                    <ChooseTeamsMobile />
                )
            ) : isDesktop ? (
                <ChoosePlayers />
            ) : (
                <ChoosePlayersMobile />
            )}
        </StyledCreateMatch>
    );
}

function CreateMatch() {
    const { activeMatch } = useMatchContext();
    const navigate = useNavigate();

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
            <CreateMatchContent />
        </ChoosePlayerProvider>
    );
}

export default CreateMatch;
