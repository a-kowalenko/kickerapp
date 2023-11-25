import styled from "styled-components";
import { useMatch } from "./useMatch";
import { useEndMatch } from "./useEndMatch";
import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { format } from "date-fns";
import Avatar from "../../ui/Avatar";
import toast from "react-hot-toast";
import {
    DEFAULT_AVATAR,
    GENERATED_GOAL,
    MATCH_ACTIVE,
    MATCH_ENDED,
    STANDARD_GOAL,
} from "../../utils/constants";
import Input from "../../ui/Input";
import Error from "../../ui/Error";
import SpinnerMini from "../../ui/SpinnerMini";
import useWindowWidth from "../../hooks/useWindowWidth";
import MatchDetailMobile from "./MatchDetailMobile";
import { useGoals } from "../../hooks/useGoals";
import ContentBox from "../../ui/ContentBox";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import GoalsFilterRow from "./GoalFilterRow";
import { useMatchContext } from "../../contexts/MatchContext";
import DelayedButton from "../../ui/DelayedButton";
import { HiArrowDownTray, HiArrowPath } from "react-icons/hi2";
import Button from "../../ui/Button";

const StyledMatchDetail = styled.div``;

const Row = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.4rem 0;
`;

const TopRow = styled(Row)``;

const MainRow = styled(Row)`
    height: 30rem;
`;

const GoalsContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow: scroll;
    overflow-x: hidden;
    flex-grow: 1;
    max-height: 50rem;
`;

const GoalRow = styled.div`
    display: grid;
    grid-template-columns: 30% 10% 10% 10% 30%;
    justify-content: center;
    align-items: center;
    padding: 0.4rem 2rem;
    gap: 0.6rem;
    width: 100%;
`;

const GoalItem = styled(ContentBox)`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.4rem;
    padding: 1rem;
    width: auto;
    justify-self: ${(props) => (props.$team === 1 ? "flex-end" : "flex-start")};
    ${(props) =>
        props.$goaltype === STANDARD_GOAL
            ? `
                background-color: var(--standard-goal-color);
                border: 0px solid var(--standard-goal-color);
            `
            : `
                background-color:var(--own-goal-color);
                border: 0px solid var(--own-goal-color);
            `};
`;

const GoalTime = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    margin: 0 auto;
`;

const CurrentTeamScore = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
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
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);

    @media (max-width: 950px) {
        font-size: 2.8rem;
        padding: 0.7rem 1.4rem;
        min-width: 12rem;
    }
`;

const CenteredInfoLabel = styled.label`
    display: flex;
    justify-content: center;
    align-items: center;
`;

function MatchDetail() {
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

    const navigate = useNavigate();
    const { matchId } = useParams();
    const [searchParams] = useSearchParams();
    const { match, isLoading, error } = useMatch();
    const { activeMatch } = useMatchContext();
    const { endMatch, isLoading: isLoadingEndMatch } = useEndMatch();
    const { goals, isLoadingGoals } = useGoals();
    const [score1, setScore1] = useState("");
    const [score2, setScore2] = useState("");
    const [timer, setTimer] = useState(<SpinnerMini />);
    const timerIdRef = useRef(null);
    const goalBoxRef = useRef(null);
    const { isMobile, isTablet } = useWindowWidth();
    const sort = searchParams.get("sort") ? searchParams.get("sort") : "asc";
    const finalGoals = goals
        ?.filter((goal) => goal.goal_type !== GENERATED_GOAL)
        .sort((a, b) => (sort === "asc" ? a.id - b.id : b.id - a.id));
    const finalMatch =
        activeMatch && activeMatch.id === Number(matchId) ? activeMatch : match;

    useEffect(
        function () {
            if (finalMatch) {
                setScore1(finalMatch.scoreTeam1);
                setScore2(finalMatch.scoreTeam2);
            }

            if (finalMatch && finalMatch.end_time) {
                setTimer(
                    format(
                        new Date(finalMatch.end_time) -
                            new Date(finalMatch.start_time),
                        "mm:ss"
                    )
                );
            }

            if (!finalMatch || finalMatch.status !== MATCH_ACTIVE) {
                return;
            }
            timerIdRef.current = setInterval(() => {
                const val =
                    new Date() - new Date(finalMatch.start_time) < 0
                        ? 0
                        : new Date() - new Date(finalMatch.start_time);
                setTimer(format(val, "mm:ss"));
            }, 1000);

            return () => clearInterval(timerIdRef.current);
        },
        [finalMatch]
    );

    useEffect(
        function () {
            if (goalBoxRef.current) {
                if (sort === "asc") {
                    const scrollHeight = goalBoxRef.current.scrollHeight;
                    goalBoxRef.current.scrollTo(0, scrollHeight);
                } else {
                    goalBoxRef.current.scrollTo(0, 0);
                }
            }
        },
        [finalGoals?.length, sort]
    );

    function createRematch() {
        navigate({
            pathname: "/matches/create",
            search: `?player1=${player1.id}&player2=${player2.id}${
                player3 ? `&player3=${player3.id}` : ""
            }${player4 ? `&player4=${player4.id}` : ""}`,
        });
    }

    if (isLoading || isLoadingGoals) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <Error message={error.message} />;
    }

    const { player1, player2, player3, player4 } = finalMatch;
    const isActive = finalMatch.status === MATCH_ACTIVE;
    const isEnded = finalMatch.status === MATCH_ENDED;
    const winner = isEnded
        ? finalMatch.scoreTeam1 > finalMatch.scoreTeam2
            ? "Team 1"
            : "Team 2"
        : null;

    if (isTablet || isMobile) {
        return <MatchDetailMobile match={finalMatch} timer={timer} />;
    }

    return (
        <StyledMatchDetail>
            <TopRow>
                <TeamHeader>Team 1</TeamHeader>
                <ScoreContainer>
                    <ScoreInput
                        value={score1}
                        onChange={(e) => handleScoreChange(e, setScore1)}
                        disabled={isEnded || finalGoals.length > 0}
                    />
                    &mdash;{" "}
                    <ScoreInput
                        value={score2}
                        onChange={(e) => handleScoreChange(e, setScore2)}
                        disabled={isEnded || finalGoals.length > 0}
                    />
                </ScoreContainer>
                <TeamHeader>Team 2</TeamHeader>
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
            {isEnded && (
                <>
                    <CenteredInfoLabel>
                        <i>Match ended. Winner: {winner}</i>
                    </CenteredInfoLabel>
                    <BottomRow>
                        <Button onClick={createRematch}>
                            Rematch
                            <HiArrowPath />
                        </Button>
                    </BottomRow>
                </>
            )}
            <GoalsFilterRow />
            <GoalsContainer ref={goalBoxRef}>
                {finalGoals.length === 0 && goals.length > 0 && (
                    <CenteredInfoLabel>
                        <i>
                            Only generated goals without timestamp are
                            available.
                        </i>
                    </CenteredInfoLabel>
                )}
                {finalGoals.map((goal) => (
                    <GoalRow key={goal.id}>
                        {goal.team === 2 && (
                            <>
                                <div></div>
                                <CurrentTeamScore>
                                    {goal.scoreTeam1}
                                </CurrentTeamScore>
                                <GoalTime>
                                    {format(
                                        new Date(goal.created_at) -
                                            new Date(finalMatch.start_time),
                                        "mm:ss"
                                    )}
                                </GoalTime>
                                <CurrentTeamScore>
                                    {goal.scoreTeam2}
                                </CurrentTeamScore>
                            </>
                        )}

                        <GoalItem $team={goal.team} $goaltype={goal.goal_type}>
                            <Avatar
                                $size="xs"
                                src={goal.player.avatar || DEFAULT_AVATAR}
                                alt={`Avatar of ${goal.player.name}`}
                            />
                            {`${goal.player.name} scored ${
                                goal.goal_type === STANDARD_GOAL
                                    ? "a goal"
                                    : "an own goal"
                            }!`}
                        </GoalItem>

                        {goal.team === 1 && (
                            <>
                                <CurrentTeamScore>
                                    {goal.scoreTeam1}
                                </CurrentTeamScore>
                                <GoalTime>
                                    {format(
                                        new Date(goal.created_at) -
                                            new Date(finalMatch.start_time),
                                        "mm:ss"
                                    )}
                                </GoalTime>
                                <CurrentTeamScore>
                                    {goal.scoreTeam2}
                                </CurrentTeamScore>
                                <div></div>
                            </>
                        )}
                    </GoalRow>
                ))}
            </GoalsContainer>
            <BottomRow>
                {isActive && (
                    <DelayedButton
                        $size="xlarge"
                        action={handleEndMatch}
                        icon={<HiArrowDownTray />}
                    >
                        {isLoadingEndMatch ? <SpinnerMini /> : "End match"}
                    </DelayedButton>
                )}
            </BottomRow>
        </StyledMatchDetail>
    );
}

export default MatchDetail;
