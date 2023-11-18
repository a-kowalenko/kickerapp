import styled from "styled-components";
import Button from "../../ui/Button";
import {
    HiArrowDownTray,
    HiArrowUturnLeft,
    HiMinus,
    HiMinusCircle,
    HiPlus,
    HiPlusCircle,
} from "react-icons/hi2";
import ButtonIcon from "../../ui/ButtonIcon";
import { useUpdateMatch } from "./useUpdateMatch";
import { useEndMatch } from "./useEndMatch";
import toast from "react-hot-toast";
import SpinnerMini from "../../ui/SpinnerMini";
import { useState } from "react";

const Heading = styled.h1`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const StyledMatchDetailMobile = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
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
    justify-content: space-between;
`;

const PlayerName = styled.span`
    display: flex;
    min-width: 10rem;
    justify-content: center;
`;

const ActionsContainer = styled.div`
    display: flex;
    gap: 2.4rem;

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

const Divider = styled.div`
    ${(props) =>
        props.$variation === "vertical"
            ? "width: 1px;"
            : "height: 1px; width: 100%;"}
    background-color: var(--primary-border-color);
`;

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.4rem;
    min-width: 15rem;
`;

const Team1Container = styled(TeamContainer)`
    align-items: end;
`;
const Team2Container = styled(TeamContainer)`
    align-items: start;
`;

const TimerContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

function MatchDetailMobile({ match, timer }) {
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

    const isActive = match.status === "active";
    const isEnded = match.status === "ended";

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

    return (
        <StyledMatchDetailMobile>
            <Heading>Active match {match.gamemode}</Heading>
            <TimerContainer>{timer}</TimerContainer>
            <ScoreContainer>
                <ScoreTeam1>{match.scoreTeam1}</ScoreTeam1>
                <span>&mdash;</span>
                <ScoreTeam2>{match.scoreTeam2}</ScoreTeam2>
            </ScoreContainer>

            <ActionsContainer>
                <Team1Container>
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
                        <PlayerName>{player1.name}</PlayerName>
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
                            <PlayerName>{player3.name}</PlayerName>
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

                <Divider $variation="vertical" />

                <Team2Container>
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
                        <PlayerName>{player2.name}</PlayerName>
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
                            <PlayerName>{player4.name}</PlayerName>
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

            <SingleButtonRow>
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
            </SingleButtonRow>
        </StyledMatchDetailMobile>
    );
}

export default MatchDetailMobile;