import styled from "styled-components";
import { useMatch } from "./useMatch";
import { useEndMatch } from "./useEndMatch";
import React, { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { format } from "date-fns";
import Avatar from "../../ui/Avatar";
import toast from "react-hot-toast";
import Spinner from "../../ui/Spinner";
import { DEFAULT_AVATAR, STANDARD_GOAL, media } from "../../utils/constants";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Error from "../../ui/Error";
import SpinnerMini from "../../ui/SpinnerMini";
import useWindowWidth from "../../hooks/useWindowWidth";
import MatchDetailMobile from "./MatchDetailMobile";
import { useGoals } from "../../hooks/useGoals";
import ContentBox from "../../ui/ContentBox";
import { HiArrowRight } from "react-icons/hi2";

const Row = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.4rem 0;
`;

const TopRow = styled(Row)``;

const MainRow = styled(Row)`
    @media screen and (max-width: 1248px) {
        flex-direction: column;
        gap: 3.4rem;
    }
`;

const GoalRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 0.6rem;
`;

const GoalItem = styled(ContentBox)`
    display: flex;
    flex-direction: row;
    width: auto;
    align-items: center;
    justify-content: space-between;
    gap: 1.4rem;
    padding: 1rem;
`;

const BottomRow = styled(Row)`
    justify-content: center;
`;

const TeamHeader = styled.h1`
    background-color: var(--tertiary-background-color);
    width: 50%;
    border-radius: var(--border-radius-lg);
    color: var(--primary-text-color);
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

const ScoreInput = styled(Input)`
    padding: 1.4rem 2.8rem;
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    width: 25%;
    text-align: center;
    font-size: 2.4rem;
    font-weight: 600;
    transition: border-color 0.3s;
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
    color: var(--primary-text-color);
`;

const TimerContainer = styled.div`
    display: flex;
    justify-content: center;
`;

const Timer = styled.label`
    font-size: 3.8rem;
    padding: 1.4rem 2.8rem;
    text-align: center;
    min-width: 18rem;
    font-weight: 600;
    color: var(--primary-text-color);

    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4); // Leichter Schatten
`;

function MatchDetail() {
    const { match, isLoading, error } = useMatch();
    const { endMatch, isLoading: isLoadingEndMatch } = useEndMatch();
    const { goals, isLoadingGoals, countGoals } = useGoals();
    const [score1, setScore1] = useState("");
    const [score2, setScore2] = useState("");
    const [timer, setTimer] = useState("00:00");
    const timerIdRef = useRef(null);
    const windowWidth = useWindowWidth();

    useEffect(
        function () {
            if (match && match.status === "ended") {
                setScore1(match.scoreTeam1);
                setScore2(match.scoreTeam2);
            }

            if (match && match.end_time) {
                setTimer(
                    format(
                        new Date(match.end_time) - new Date(match.start_time),
                        "mm:ss"
                    )
                );
            }

            if (!match || match.status !== "active") {
                return;
            }
            timerIdRef.current = setInterval(() => {
                const val =
                    new Date() - new Date(match.start_time) < 0
                        ? 0
                        : new Date() - new Date(match.start_time);
                setTimer(format(val, "mm:ss"));
            }, 1000);

            return () => clearInterval(timerIdRef.current);
        },
        [match]
    );

    if (isLoading || isLoadingGoals) {
        return <Spinner />;
    }

    if (error) {
        return <Error message={error.message} />;
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

    if (windowWidth < media.maxTablet) {
        return <MatchDetailMobile match={match} timer={timer} />;
    }

    return (
        <>
            <TopRow>
                <TeamHeader>{windowWidth > 1248 ? "Team A" : "A"}</TeamHeader>
                <ScoreContainer>
                    <ScoreInput
                        value={score1 || match.scoreTeam1}
                        onChange={(e) => handleScoreChange(e, setScore1)}
                        disabled={isEnded}
                    />
                    &mdash;{" "}
                    <ScoreInput
                        value={score2 || match.scoreTeam2}
                        onChange={(e) => handleScoreChange(e, setScore2)}
                        disabled={isEnded}
                    />
                </ScoreContainer>
                <TeamHeader>{windowWidth > 1248 ? "Team B" : "B"}</TeamHeader>
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
            <GoalRow>
                {goals.map((goal, index) => (
                    <React.Fragment key={goal.id}>
                        {index > 0 && <HiArrowRight />}
                        <GoalItem>
                            <Avatar
                                $size="xs"
                                src={goal.player.avatar || DEFAULT_AVATAR}
                                alt={`Avatar of ${goal.player.name}`}
                            />
                            {`${goal.player.name} scored a ${
                                goal.goal_type === STANDARD_GOAL
                                    ? "goal"
                                    : "own goal"
                            }!`}
                        </GoalItem>
                    </React.Fragment>
                ))}
            </GoalRow>
            <BottomRow>
                {isActive && (
                    <Button $size="xlarge" onClick={handleEndMatch}>
                        {isLoadingEndMatch ? <SpinnerMini /> : "End match"}
                    </Button>
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
