import styled from "styled-components";
import { useMatch } from "./useMatch";
import { useEndMatch } from "./useEndMatch";
import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { format } from "date-fns";
import Avatar from "../../ui/Avatar";
import toast from "react-hot-toast";
import Spinner from "../../ui/Spinner";
import { DEFAULT_AVATAR } from "../../utils/constants";

const Row = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.4rem 0;
`;

const TopRow = styled(Row)``;

const MainRow = styled(Row)``;

const BottomRow = styled(Row)`
    justify-content: center;
`;

const TeamHeader = styled.h1`
    background-color: var(--color-amber-100);
    width: 50%;
    border-radius: var(--border-radius-lg);
    color: var(--color-grey-700);
    padding: 0.8rem 1.2rem;
    text-align: center;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.3s;

    &:hover {
        box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.15);
    }
`;

const ScoreContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.2rem;
`;

const ScoreInput = styled.input`
    padding: 1.4rem 2.8rem;
    border: 1px solid var(--color-amber-100);
    border-radius: var(--border-radius-sm);
    width: 25%;
    text-align: center;
    font-size: 2.4rem;
    font-weight: 600;
    transition: border-color 0.3s;

    &:hover {
        border-color: var(--color-amber-200);
    }

    &:focus {
        background-color: var(--color-grey-50);
    }
`;

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.8rem;
    width: 50%;
`;

const Player = styled.div`
    display: flex;
    justify-content: ${(props) =>
        props.$team === "1" ? "flex-start" : "flex-end"};
    gap: 2.8rem;
    align-items: center;
    font-weight: 600;
    font-size: 3.2rem;
    color: var(--color-grey-700);
`;

const TimerContainer = styled.div`
    display: flex;
    justify-content: center;
`;

const Timer = styled.label`
    font-size: 3.8rem;
    padding: 1.4rem 2.8rem;
    font-weight: 600;
    color: var(--color-grey-700);

    background-color: var(--color-grey-100);
    border-radius: var(--border-radius-sm);
    box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.1); // Leichter Schatten
`;

const EndMatchButton = styled.button`
    padding: 1.4rem 2.8rem;
    border: none;
    border-radius: var(--border-radius-sm);
    background-color: var(--color-amber-100);
    font-size: 2.8rem;
    font-weight: 600;

    &:hover {
        background-color: var(--color-amber-200);
    }

    &:active {
        background-color: var(--color-amber-300);
    }
`;

function MatchDetail() {
    const { match, isLoading, error } = useMatch();
    const { endMatch, isLoading: isLoadingEndMatch } = useEndMatch();
    const [score1, setScore1] = useState("");
    const [score2, setScore2] = useState("");
    const [timer, setTimer] = useState("00:00");
    const timerIdRef = useRef(null);

    useEffect(
        function () {
            if (match && match.status === "ended") {
                setScore1(match.scoreTeam1);
                setScore2(match.scoreTeam2);
            }

            if (match && match.end_time) {
                setTimer(
                    format(
                        new Date(match.end_time) - new Date(match.created_at),
                        "mm:ss"
                    )
                );
            }

            if (!match || match.status !== "active") {
                return;
            }
            timerIdRef.current = setInterval(() => {
                const val =
                    new Date() - new Date(match.created_at) < 0
                        ? 0
                        : new Date() - new Date(match.created_at);
                setTimer(format(val, "mm:ss"));
            }, 1000);

            return () => clearInterval(timerIdRef.current);
        },
        [match]
    );

    if (isLoading) {
        return <Spinner />;
    }

    const { player1, player2, player3, player4 } = match;

    const isActive = match.status === "active";
    const isEnded = match.status === "ended";
    const winner = isEnded
        ? match.scoreTeam1 > match.scoreTeam2
            ? "Team 1"
            : "Team 2"
        : null;

    function handleScoreChange(e, setter) {
        const value = e.target.value;
        if (/^\d+$/.test(value) || value === "") {
            setter(Number(value));
        }
    }

    function handleEndMatch() {
        if (score1 === "" || score2 === "") {
            toast.error("Score is missing");
            return;
        }

        if (score1 === 0 && score2 === 0) {
            toast.error("Atleast one team must have a score above 0");
            return;
        }

        endMatch({ id: match.id, score1, score2 });
        clearInterval(timerIdRef.current);
    }

    return (
        <>
            <TopRow>
                <TeamHeader>Team A</TeamHeader>
                <ScoreContainer>
                    <ScoreInput
                        value={score1}
                        onChange={(e) => handleScoreChange(e, setScore1)}
                        disabled={isEnded}
                    />
                    &mdash;{" "}
                    <ScoreInput
                        value={score2}
                        onChange={(e) => handleScoreChange(e, setScore2)}
                        disabled={isEnded}
                    />
                </ScoreContainer>
                <TeamHeader>Team B</TeamHeader>
            </TopRow>
            <MainRow>
                <TeamContainer>
                    <Player $team="1">
                        <Avatar
                            src={player1.avatar || DEFAULT_AVATAR}
                            alt={`Avatar of ${player1.name}`}
                        />
                        <span>{player1.name}</span>
                    </Player>
                    {player3 && (
                        <Player $team="1">
                            <Avatar
                                src={player3.avatar || DEFAULT_AVATAR}
                                alt={`Avatar of ${player3.name}`}
                            />
                            <span>{player3.name}</span>
                        </Player>
                    )}
                </TeamContainer>
                <TimerContainer>
                    <Timer>{timer}</Timer>
                </TimerContainer>
                <TeamContainer>
                    <Player $team="2">
                        <span>{player2.name}</span>
                        <Avatar
                            src={player2.avatar || DEFAULT_AVATAR}
                            alt={`Avatar of ${player2.name}`}
                        />
                    </Player>
                    {player4 && (
                        <Player $team="2">
                            <span>{player4.name}</span>
                            <Avatar
                                src={player4.avatar || DEFAULT_AVATAR}
                                alt={`Avatar of ${player4.name}`}
                            />
                        </Player>
                    )}
                </TeamContainer>
            </MainRow>
            <BottomRow>
                {isActive && (
                    <EndMatchButton onClick={handleEndMatch}>
                        End match
                    </EndMatchButton>
                )}
                {isEnded && (
                    <label>
                        <i>Match ended. Winner: {winner}</i>
                    </label>
                )}
            </BottomRow>
        </>
    );
}

export default MatchDetail;
