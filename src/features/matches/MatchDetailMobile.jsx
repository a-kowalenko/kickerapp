import styled from "styled-components";
import Button from "../../ui/Button";
import {
    HiArrowDownTray,
    HiArrowPath,
    HiArrowUturnLeft,
    HiMinusCircle,
    HiPlusCircle,
} from "react-icons/hi2";
import ButtonIcon from "../../ui/ButtonIcon";
import { useUpdateMatch } from "./useUpdateMatch";
import { useEndMatch } from "./useEndMatch";
import toast from "react-hot-toast";
import SpinnerMini from "../../ui/SpinnerMini";
import { useState } from "react";
import Divider from "../../ui/Divider";
import {
    DEFAULT_AVATAR,
    MATCH_ACTIVE,
    MATCH_ENDED,
} from "../../utils/constants";
import DelayedButton from "../../ui/DelayedButton";
import { useNavigate } from "react-router-dom";
import Avatar from "../../ui/Avatar";

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
    font-size: x-large;
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
    min-width: 10rem;
    align-items: center;
    justify-content: center;
`;

const PlayerName = styled.span`
    display: flex;
    min-width: 8rem;
    gap: 2.4rem;
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

function MatchDetailMobile({ match, timer }) {
    const navigate = useNavigate();
    const { player1, player2, player3, player4, id: matchId } = match;
    const { endMatch, isLoading: isLoadingEndMatch } = useEndMatch();
    const [latestScorer, setLatestScorer] = useState(null);

    const {
        scoreGoal,
        scoreOwnGoal,
        undoLastAction,
        isScoringGoal,
        isScoringOwnGoal,
        isUndoingLastAction,
    } = useUpdateMatch();

    const isActive = match.status === MATCH_ACTIVE;
    const isEnded = match.status === MATCH_ENDED;

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
                </GameInfoLabel>

                <GameInfoText>
                    <span>{match.gamemode}</span>
                    <span>{match.status}</span>
                </GameInfoText>
            </GameInfoContainer>
            <TimerContainer>{timer}</TimerContainer>

            <ActionsContainer>
                <Team1Container>
                    <Watermark>Team 1</Watermark>
                    <Player>
                        {isActive && (
                            <ButtonIcon
                                $size="large"
                                onClick={() => handleOwnGoal(player1)}
                                disabled={isDisabled}
                            >
                                {isScoringOwnGoal &&
                                latestScorer === player1 ? (
                                    <SpinnerMini />
                                ) : (
                                    <HiMinusCircle />
                                )}
                            </ButtonIcon>
                        )}
                        <PlayerName>
                            <Avatar
                                $size="xs"
                                src={player1.avatar || DEFAULT_AVATAR}
                            />
                            {player1.name}
                        </PlayerName>
                        {isActive && (
                            <ButtonIcon
                                $size="large"
                                onClick={() => handleGoal(player1)}
                                disabled={isDisabled}
                            >
                                {isScoringGoal && latestScorer === player1 ? (
                                    <SpinnerMini />
                                ) : (
                                    <HiPlusCircle />
                                )}
                            </ButtonIcon>
                        )}
                    </Player>
                    {player3 && (
                        <Player>
                            {isActive && (
                                <ButtonIcon
                                    $size="large"
                                    onClick={() => handleOwnGoal(player3)}
                                    disabled={isDisabled}
                                >
                                    {isScoringOwnGoal &&
                                    latestScorer === player3 ? (
                                        <SpinnerMini />
                                    ) : (
                                        <HiMinusCircle />
                                    )}
                                </ButtonIcon>
                            )}
                            <PlayerName>
                                <Avatar
                                    $size="xs"
                                    src={player3.avatar || DEFAULT_AVATAR}
                                />
                                {player3.name}
                            </PlayerName>
                            {isActive && (
                                <ButtonIcon
                                    $size="large"
                                    onClick={() => handleGoal(player3)}
                                    disabled={isDisabled}
                                >
                                    {isScoringGoal &&
                                    latestScorer === player3 ? (
                                        <SpinnerMini />
                                    ) : (
                                        <HiPlusCircle />
                                    )}
                                </ButtonIcon>
                            )}
                        </Player>
                    )}
                </Team1Container>

                <Score>{match.scoreTeam1}</Score>

                <Divider $variation="horizontal" />

                <Score>{match.scoreTeam2}</Score>

                <Team2Container>
                    <Watermark>Team 2</Watermark>
                    <Player>
                        {isActive && (
                            <ButtonIcon
                                $size="large"
                                onClick={() => handleOwnGoal(player2)}
                                disabled={isDisabled}
                            >
                                {isScoringOwnGoal &&
                                latestScorer === player2 ? (
                                    <SpinnerMini />
                                ) : (
                                    <HiMinusCircle />
                                )}
                            </ButtonIcon>
                        )}
                        <PlayerName>
                            <Avatar
                                $size="xs"
                                src={player2.avatar || DEFAULT_AVATAR}
                            />
                            {player2.name}
                        </PlayerName>
                        {isActive && (
                            <ButtonIcon
                                $size="large"
                                onClick={() => handleGoal(player2)}
                                disabled={isDisabled}
                            >
                                {isScoringGoal && latestScorer === player2 ? (
                                    <SpinnerMini />
                                ) : (
                                    <HiPlusCircle />
                                )}
                            </ButtonIcon>
                        )}
                    </Player>
                    {player4 && (
                        <Player>
                            {isActive && (
                                <ButtonIcon
                                    $size="large"
                                    onClick={() => handleOwnGoal(player4)}
                                    disabled={isDisabled}
                                >
                                    {isScoringOwnGoal &&
                                    latestScorer === player4 ? (
                                        <SpinnerMini />
                                    ) : (
                                        <HiMinusCircle />
                                    )}
                                </ButtonIcon>
                            )}
                            <PlayerName>
                                <Avatar
                                    $size="xs"
                                    src={player4.avatar || DEFAULT_AVATAR}
                                />
                                {player4.name}
                            </PlayerName>
                            {isActive && (
                                <ButtonIcon
                                    $size="large"
                                    onClick={() => handleGoal(player4)}
                                    disabled={isDisabled}
                                >
                                    {isScoringGoal &&
                                    latestScorer === player4 ? (
                                        <SpinnerMini />
                                    ) : (
                                        <HiPlusCircle />
                                    )}
                                </ButtonIcon>
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

            {/* <SingleButtonRow>
                <ButtonsContainer>
                    {isActive && (
                        <Button onClick={handleEndMatch} disabled={isDisabled}>
                            {isLoadingEndMatch ? (
                                <SpinnerMini />
                            ) : (
                                <>
                                    <HiArrowDownTray /> End match
                                </>
                            )}
                        </Button>
                    )}
                    {isEnded && (
                        <label>
                            <i>Match ended. Winner: {winner}</i>
                        </label>
                    )}
                </ButtonsContainer>
            </SingleButtonRow> */}

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
                                    Rematch
                                    <HiArrowPath />
                                </Button>
                            </SingleButtonRow>
                        </>
                    )}
                </ButtonsContainer>
            </SingleButtonRow>
        </StyledMatchDetailMobile>
    );
}

export default MatchDetailMobile;
