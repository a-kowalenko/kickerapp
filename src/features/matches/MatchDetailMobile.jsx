import styled from "styled-components";
import Button from "../../ui/Button";
import {
    HiArrowDownTray,
    HiArrowPath,
    HiArrowUturnLeft,
    HiMinusCircle,
    HiPlusCircle,
} from "react-icons/hi2";
import { useUpdateMatch } from "./useUpdateMatch";
import { useEndMatch } from "./useEndMatch";
import toast from "react-hot-toast";
import SpinnerMini from "../../ui/SpinnerMini";
import { useEffect, useRef, useState } from "react";
import Divider from "../../ui/Divider";
import {
    DEFAULT_AVATAR,
    GENERATED_GOAL,
    MATCH_ACTIVE,
    MATCH_ENDED,
    MATCH_ENDED_BY_CRON,
    OWN_GOAL,
    STANDARD_GOAL,
} from "../../utils/constants";
import DelayedButton from "../../ui/DelayedButton";
import { useNavigate, useSearchParams } from "react-router-dom";
import Avatar from "../../ui/Avatar";
import { useGoals } from "../../hooks/useGoals";
import { format } from "date-fns";
import LoadingSpinner from "../../ui/LoadingSpinner";
import ScoreButton from "./ScoreButton";

const GameInfoContainer = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-around;
    text-transform: uppercase;
`;
const GameInfoLabel = styled.div`
    display: flex;
    flex-direction: column;
`;
const GameInfoText = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-weight: 600;
`;

const Heading = styled.h1`
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    text-transform: uppercase;
`;

const StyledMatchDetailMobile = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    margin: 2rem;
`;

const ScoreContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4.8rem;
`;

const Score = styled.div`
    display: flex;
    min-width: 10rem;
    font-weight: 600;
    font-size: xx-large;

    justify-content: center;
`;

const ScoreTeam1 = styled(Score)`
    justify-content: right;
`;
const ScoreTeam2 = styled(Score)`
    justify-content: left;
`;

const Player = styled.div`
    display: flex;
    min-width: 90%;
    align-items: center;
    justify-content: ${(props) =>
        props.$matchEnded ? "center" : "space-between"};
`;

const PlayerName = styled.span`
    display: flex;
    min-width: 55%;
    justify-content: flex-start;
    align-items: center;
    font-size: 2.8rem;
    padding: 0 1rem;
    gap: 1rem;

    color: ${(props) =>
        props.$winner === null
            ? "var(--primary-text-color)"
            : props.$winner === true
            ? "var(--winner-name-color)"
            : "var(--loser-name-color)"};

    & div {
        width: 100%;
        text-align: center;
    }
`;

const ActionsContainer = styled.div`
    display: flex;
    gap: 1.8rem;

    flex-direction: column;

    justify-content: center;

    margin-bottom: 2rem;
`;

const ButtonsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    width: fit-content;
`;

const SingleButtonRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    min-width: 15rem;
`;

const Team1Container = styled(TeamContainer)`
    align-items: center;
    position: relative;
`;
const Team2Container = styled(TeamContainer)`
    align-items: center;
    position: relative;
`;

const TimerContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: large;
    font-weight: 500;
`;

const Watermark = styled.div`
    position: absolute;
    opacity: 0.05;
    font-size: 88px;
    width: 100%;
    text-align: center;
    color: var(--primary-text-color);
    text-transform: uppercase;

    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
`;

const CenteredInfoLabel = styled.label`
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
`;

const GoalsHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    text-transform: uppercase;
`;

const GoalsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    overflow-y: auto;
    max-height: 50rem;
`;

const GoalRow = styled.div`
    display: grid;
    grid-template-columns: 5fr 1fr 3fr 1fr 5fr;
    align-items: center;
    justify-content: space-between;
`;

const GoalItemContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const GoalItem = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem;

    border-radius: var(--border-radius-sm);
    justify-content: ${(props) =>
        props.$team === 2 ? "flex-end" : "flex-start"};
    /* ${(props) =>
        props.$goaltype === STANDARD_GOAL
            ? `
                background-color: var(--standard-goal-color);
                border: 0px solid var(--standard-goal-color);
            `
            : `
                background-color:var(--own-goal-color);
                border: 0px solid var(--own-goal-color);
            `}; */
`;

const GoalTimestamp = styled.span`
    text-align: ${(props) => (props.$team === 1 ? "left" : "right")};
    color: var(--tertiary-text-color);
`;

const ScoreAtThisGoal = styled.span`
    text-align: center;
    font-weight: 600;
`;

const GoalType = styled.span`
    display: flex;
    width: 100%;
    justify-content: center;
    font-style: italic;
    font-size: 1.4rem;
    /* justify-content: ${(props) =>
        props.$team === 2 ? "flex-end" : "flex-start"}; */
    justify-content: center;
`;

function MatchDetailMobile({ match, timer }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { player1, player2, player3, player4, id: matchId } = match;
    const { endMatch, isLoading: isLoadingEndMatch } = useEndMatch();
    const [latestScorer, setLatestScorer] = useState(null);
    const { goals, isLoadingGoals } = useGoals();
    const goalBoxRef = useRef(null);
    const sort = searchParams.get("sort") ? searchParams.get("sort") : "desc";
    const finalGoals = goals
        ?.filter((goal) => goal.goal_type !== GENERATED_GOAL)
        .sort((a, b) => (sort === "asc" ? a.id - b.id : b.id - a.id));

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

    const {
        scoreGoal,
        scoreOwnGoal,
        undoLastAction,
        isScoringGoal,
        isScoringOwnGoal,
        isUndoingLastAction,
    } = useUpdateMatch();

    const isActive = match.status === MATCH_ACTIVE;
    const isEnded =
        match.status === MATCH_ENDED || match.status === MATCH_ENDED_BY_CRON;

    const winner = isEnded
        ? match.scoreTeam1 > match.scoreTeam2
            ? "Team 1"
            : "Team 2"
        : null;

    const isDisabled =
        isScoringGoal ||
        isScoringOwnGoal ||
        isUndoingLastAction ||
        isLoadingEndMatch ||
        isEnded;

    function handleGoal(player) {
        setLatestScorer(player);
        scoreGoal({ playerId: player.id });
    }

    function handleOwnGoal(player) {
        setLatestScorer(player);
        scoreOwnGoal({ playerId: player.id });
    }

    function handleUndo() {
        undoLastAction();
    }

    function handleEndMatch() {
        if (match.scoreTeam1 === 0 && match.scoreTeam2 === 0) {
            toast.error("Atleast one team must have a score above 0");
            return;
        }

        endMatch({ id: matchId });
    }

    function createRematch() {
        navigate({
            pathname: "/matches/create",
            search: `?player1=${player1.id}&player2=${player2.id}${
                player3 ? `&player3=${player3.id}` : ""
            }${player4 ? `&player4=${player4.id}` : ""}`,
        });
    }

    return (
        <StyledMatchDetailMobile>
            <GameInfoContainer>
                <GameInfoLabel>
                    <span>Gamemode:</span>
                    <span>Status:</span>
                    <span>Started:</span>
                    {isEnded && <span>Ended:</span>}
                </GameInfoLabel>

                <GameInfoText>
                    <span>{match.gamemode}</span>
                    <span>{match.status}</span>
                    <span>
                        {format(
                            new Date(match.start_time),
                            "dd.MM.yyyy - HH:mm"
                        )}
                    </span>
                    {isEnded && (
                        <span>
                            {format(
                                new Date(match.end_time),
                                "dd.MM.yyyy - HH:mm"
                            )}
                        </span>
                    )}
                </GameInfoText>
            </GameInfoContainer>
            <TimerContainer>{timer}</TimerContainer>

            <ActionsContainer>
                <Team1Container>
                    <Watermark>Team 1</Watermark>
                    <Player $matchEnded={isEnded}>
                        {isActive && (
                            <ScoreButton
                                onClick={() => handleOwnGoal(player1)}
                                disabled={isDisabled}
                            >
                                {isScoringOwnGoal &&
                                latestScorer === player1 ? (
                                    <SpinnerMini />
                                ) : (
                                    <HiMinusCircle />
                                )}
                            </ScoreButton>
                        )}
                        <PlayerName
                            $winner={
                                !isEnded
                                    ? null
                                    : winner === "Team 1"
                                    ? true
                                    : false
                            }
                        >
                            <Avatar
                                $size="xs"
                                src={player1.avatar || DEFAULT_AVATAR}
                            />
                            <div>{player1.name}</div>
                        </PlayerName>
                        {isActive && (
                            <ScoreButton
                                onClick={() => handleGoal(player1)}
                                disabled={isDisabled}
                            >
                                {isScoringGoal && latestScorer === player1 ? (
                                    <SpinnerMini />
                                ) : (
                                    <HiPlusCircle />
                                )}
                            </ScoreButton>
                        )}
                    </Player>
                    {player3 && (
                        <Player $matchEnded={isEnded}>
                            {isActive && (
                                <ScoreButton
                                    onClick={() => handleOwnGoal(player3)}
                                    disabled={isDisabled}
                                >
                                    {isScoringOwnGoal &&
                                    latestScorer === player3 ? (
                                        <SpinnerMini />
                                    ) : (
                                        <HiMinusCircle />
                                    )}
                                </ScoreButton>
                            )}
                            <PlayerName
                                $winner={
                                    !isEnded
                                        ? null
                                        : winner === "Team 1"
                                        ? true
                                        : false
                                }
                            >
                                <Avatar
                                    $size="xs"
                                    src={player3.avatar || DEFAULT_AVATAR}
                                />
                                <div>{player3.name}</div>
                            </PlayerName>
                            {isActive && (
                                <ScoreButton
                                    onClick={() => handleGoal(player3)}
                                    disabled={isDisabled}
                                >
                                    {isScoringGoal &&
                                    latestScorer === player3 ? (
                                        <SpinnerMini />
                                    ) : (
                                        <HiPlusCircle />
                                    )}
                                </ScoreButton>
                            )}
                        </Player>
                    )}
                </Team1Container>

                <Score>{match.scoreTeam1}</Score>

                <Divider $variation="horizontal" />

                <Score>{match.scoreTeam2}</Score>

                <Team2Container>
                    <Watermark>Team 2</Watermark>
                    <Player $matchEnded={isEnded}>
                        {isActive && (
                            <ScoreButton
                                onClick={() => handleOwnGoal(player2)}
                                disabled={isDisabled}
                            >
                                {isScoringOwnGoal &&
                                latestScorer === player2 ? (
                                    <SpinnerMini />
                                ) : (
                                    <HiMinusCircle />
                                )}
                            </ScoreButton>
                        )}
                        <PlayerName
                            $winner={
                                !isEnded
                                    ? null
                                    : winner === "Team 2"
                                    ? true
                                    : false
                            }
                        >
                            <Avatar
                                $size="xs"
                                src={player2.avatar || DEFAULT_AVATAR}
                            />
                            <div>{player2.name}</div>
                        </PlayerName>
                        {isActive && (
                            <ScoreButton
                                onClick={() => handleGoal(player2)}
                                disabled={isDisabled}
                            >
                                {isScoringGoal && latestScorer === player2 ? (
                                    <SpinnerMini />
                                ) : (
                                    <HiPlusCircle />
                                )}
                            </ScoreButton>
                        )}
                    </Player>
                    {player4 && (
                        <Player $matchEnded={isEnded}>
                            {isActive && (
                                <ScoreButton
                                    onClick={() => handleOwnGoal(player4)}
                                    disabled={isDisabled}
                                >
                                    {isScoringOwnGoal &&
                                    latestScorer === player4 ? (
                                        <SpinnerMini />
                                    ) : (
                                        <HiMinusCircle />
                                    )}
                                </ScoreButton>
                            )}
                            <PlayerName
                                $winner={
                                    !isEnded
                                        ? null
                                        : winner === "Team 2"
                                        ? true
                                        : false
                                }
                            >
                                <Avatar
                                    $size="xs"
                                    src={player4.avatar || DEFAULT_AVATAR}
                                />
                                <div>{player4.name}</div>
                            </PlayerName>
                            {isActive && (
                                <ScoreButton
                                    onClick={() => handleGoal(player4)}
                                    disabled={isDisabled}
                                >
                                    {isScoringGoal &&
                                    latestScorer === player4 ? (
                                        <SpinnerMini />
                                    ) : (
                                        <HiPlusCircle />
                                    )}
                                </ScoreButton>
                            )}
                        </Player>
                    )}
                </Team2Container>
            </ActionsContainer>

            {isActive && (
                <SingleButtonRow>
                    <ButtonsContainer>
                        <Button
                            $variation="secondary"
                            onClick={handleUndo}
                            disabled={isDisabled}
                        >
                            {isUndoingLastAction ? (
                                <SpinnerMini />
                            ) : (
                                <>
                                    <HiArrowUturnLeft /> Undo last
                                </>
                            )}
                        </Button>
                    </ButtonsContainer>
                </SingleButtonRow>
            )}

            <Divider />

            <SingleButtonRow>
                <ButtonsContainer>
                    {isActive && (
                        <DelayedButton
                            action={handleEndMatch}
                            icon={<HiArrowDownTray />}
                        >
                            {isLoadingEndMatch ? <SpinnerMini /> : "End match"}
                        </DelayedButton>
                    )}
                    {isEnded && (
                        <>
                            <label>
                                <i>Match ended. Winner: {winner}</i>
                            </label>
                            <SingleButtonRow>
                                <Button onClick={createRematch}>
                                    <HiArrowPath />
                                    Rematch
                                </Button>
                            </SingleButtonRow>
                        </>
                    )}
                </ButtonsContainer>
            </SingleButtonRow>

            <Divider $variation="horizontal" />

            <GoalsHeader>
                <div>Team 1</div>
                <div>Goals</div>
                <div>Team 2</div>
            </GoalsHeader>
            {isLoadingGoals ? (
                <LoadingSpinner />
            ) : (
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
                            <>
                                {goal.team === 1 && (
                                    <>
                                        <GoalItemContainer $team={goal.team}>
                                            <GoalItem $team={goal.team}>
                                                <Avatar
                                                    $size="xs"
                                                    src={
                                                        goal.player.avatar ||
                                                        DEFAULT_AVATAR
                                                    }
                                                    alt={`Avatar of ${goal.player.name}`}
                                                />
                                                {goal.player.name}
                                            </GoalItem>
                                            <GoalType $team={goal.team}>
                                                {goal.goal_type ===
                                                    STANDARD_GOAL && "Goal"}
                                                {goal.goal_type === OWN_GOAL &&
                                                    "Own Goal"}
                                            </GoalType>
                                        </GoalItemContainer>
                                        <GoalTimestamp $team={goal.team}>
                                            {Number(
                                                format(
                                                    new Date(goal.created_at) -
                                                        new Date(
                                                            match.start_time
                                                        ),
                                                    "mm"
                                                )
                                            ) + 1}
                                            &apos;
                                        </GoalTimestamp>
                                    </>
                                )}

                                {goal.team === 2 && (
                                    <>
                                        <GoalItem></GoalItem>
                                        <GoalTimestamp></GoalTimestamp>
                                    </>
                                )}

                                <ScoreAtThisGoal>
                                    {goal.scoreTeam1}:{goal.scoreTeam2}
                                </ScoreAtThisGoal>

                                {goal.team === 1 && (
                                    <>
                                        <GoalTimestamp></GoalTimestamp>
                                        <GoalItem></GoalItem>
                                    </>
                                )}

                                {goal.team === 2 && (
                                    <>
                                        <GoalTimestamp $team={goal.team}>
                                            {Number(
                                                format(
                                                    new Date(goal.created_at) -
                                                        new Date(
                                                            match.start_time
                                                        ),
                                                    "mm"
                                                )
                                            ) + 1}
                                            &apos;
                                        </GoalTimestamp>

                                        <GoalItemContainer $team={goal.team}>
                                            <GoalItem
                                                $team={goal.team}
                                                $goaltype={goal.goal_type}
                                            >
                                                {goal.player.name}
                                                <Avatar
                                                    $size="xs"
                                                    src={
                                                        goal.player.avatar ||
                                                        DEFAULT_AVATAR
                                                    }
                                                    alt={`Avatar of ${goal.player.name}`}
                                                />
                                            </GoalItem>
                                            <GoalType $team={goal.team}>
                                                {goal.goal_type ===
                                                    STANDARD_GOAL && "Goal"}
                                                {goal.goal_type === OWN_GOAL &&
                                                    "Own Goal"}
                                            </GoalType>
                                        </GoalItemContainer>
                                    </>
                                )}
                            </>
                        </GoalRow>
                    ))}
                </GoalsContainer>
            )}
        </StyledMatchDetailMobile>
    );
}

export default MatchDetailMobile;
