import styled from "styled-components";
import Heading from "../../ui/Heading";
import ContentBox from "../../ui/ContentBox";
import Dropdown from "../../ui/Dropdown";
import SpinnerMini from "../../ui/SpinnerMini";
import Button from "../../ui/Button";
import { HiArrowsUpDown, HiPlus, HiScale } from "react-icons/hi2";
import { useChoosePlayers } from "../../contexts/ChoosePlayerContext";
import Ruleset from "./Ruleset";
import ClearPlayers from "../../ui/CustomIcons/ClearPlayers";

const StyledChoosePlayersMobile = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0rem 2.4rem;
    gap: 2.4rem;
`;

const TeamContainer = styled(ContentBox)``;

const SubmitContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    & button {
        width: 100%;
    }
`;

const MidButtonsContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2.4rem;
`;

const MidButton = styled(Button)`
    height: fit-content;
    padding: 1.4rem;
    align-self: center;
    margin: -1.2rem 0;

    & svg {
        font-size: 2.6rem;
    }
`;

const BalanceButton = styled(MidButton)`
    ${(props) =>
        props.$isBalanced &&
        `
        background: linear-gradient(135deg, #ffd700, #ffec8b, #ffd700);
        background-size: 200% 200%;
        animation: shimmer 2s ease-in-out infinite;
        color: #5c4a00;
        border: 2px solid #ffd700;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3);
        cursor: pointer;
        
        &:hover {
            background: linear-gradient(135deg, #ffec8b, #ffd700, #ffec8b);
            background-size: 200% 200%;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.4);
        }
        
        @keyframes shimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
    `}
`;

function ChoosePlayersMobile() {
    const {
        isLoading,
        startCountdown,
        isStarting,
        timer,
        cancelTimer,
        selectPlayer,
        activatePlayer,
        isPlayer3Active,
        isPlayer4Active,
        filteredPlayers,
        filteredForPlayer3And4,
        switchTeams,
        clearAllPlayers,
        balanceTeams,
        canBalanceTeams,
        isAlreadyBalanced,
        selectedPlayers: [player1, player2, player3, player4],
    } = useChoosePlayers();

    // Calculate team MMR display
    function getTeamMmrDisplay(mainPlayer, secondPlayer, hasSecondPlayer) {
        if (!mainPlayer) return null;

        // Check if it's a 1v1 (no player3 AND no player4 selected)
        const is1v1 = !player3 && !player4;

        if (is1v1) {
            // 1v1: show individual mmr
            return Math.round(mainPlayer.mmr);
        }

        // 2v2 or 2v1: use mmr2on2
        if (hasSecondPlayer && secondPlayer) {
            // Team has 2 players - show average
            return Math.round((mainPlayer.mmr2on2 + secondPlayer.mmr2on2) / 2);
        }

        // Team has 1 player in a 2v1/2v2 context
        return Math.round(mainPlayer.mmr2on2);
    }

    const team1Mmr = getTeamMmrDisplay(player1, player3, isPlayer3Active);
    const team2Mmr = getTeamMmrDisplay(player2, player4, isPlayer4Active);

    if (isLoading) {
        return <SpinnerMini />;
    }

    return (
        <StyledChoosePlayersMobile>
            <TeamContainer>
                <Heading as="h3">
                    Team 1{team1Mmr !== null && ` (MMR ${team1Mmr})`}
                </Heading>
                <Dropdown
                    options={filteredPlayers}
                    onSelect={(playerId) => selectPlayer(playerId, 1)}
                    initSelected={{
                        text: player1?.name,
                        value: player1?.id,
                    }}
                />
                {isPlayer3Active ? (
                    <Dropdown
                        options={filteredForPlayer3And4}
                        onSelect={(playerId) => selectPlayer(playerId, 3)}
                        initSelected={{
                            text: player3?.name,
                            value: player3?.id,
                        }}
                    />
                ) : (
                    <Button onClick={() => activatePlayer(3)}>
                        <HiPlus />
                        <span>Add player</span>
                    </Button>
                )}
            </TeamContainer>

            <MidButtonsContainer>
                {canBalanceTeams && (
                    <BalanceButton
                        onClick={balanceTeams}
                        disabled={isStarting}
                        $isBalanced={isAlreadyBalanced}
                        title={
                            isAlreadyBalanced
                                ? "Restore original teams"
                                : "Balance Teams by MMR"
                        }
                    >
                        <HiScale />
                    </BalanceButton>
                )}
                <MidButton onClick={switchTeams}>
                    <HiArrowsUpDown />
                </MidButton>
                <MidButton
                    onClick={clearAllPlayers}
                    disabled={isStarting}
                    title="Clear Players"
                >
                    <ClearPlayers />
                </MidButton>
            </MidButtonsContainer>

            <TeamContainer>
                <Heading as="h3">
                    Team 2{team2Mmr !== null && ` (MMR ${team2Mmr})`}
                </Heading>
                <Dropdown
                    options={filteredPlayers}
                    onSelect={(playerId) => selectPlayer(playerId, 2)}
                    initSelected={{
                        text: player2?.name,
                        value: player2?.id,
                    }}
                />
                {isPlayer4Active ? (
                    <Dropdown
                        options={filteredForPlayer3And4}
                        onSelect={(playerId) => selectPlayer(playerId, 4)}
                        initSelected={{
                            text: player4?.name,
                            value: player4?.id,
                        }}
                    />
                ) : (
                    <Button onClick={() => activatePlayer(4)}>
                        <HiPlus />
                        <span>Add player</span>
                    </Button>
                )}
            </TeamContainer>
            <SubmitContainer>
                {timer <= 0 ? (
                    "Good luck have fun!"
                ) : (
                    <Button
                        $size="large"
                        $variation={isStarting ? "secondary" : "primary"}
                        onClick={isStarting ? cancelTimer : startCountdown}
                    >
                        {isStarting ? `Cancel ${timer}` : "Start match"}
                    </Button>
                )}
            </SubmitContainer>
            <Ruleset />
        </StyledChoosePlayersMobile>
    );
}

export default ChoosePlayersMobile;
