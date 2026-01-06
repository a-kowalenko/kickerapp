import styled from "styled-components";
import { HiArrowsRightLeft, HiPlus, HiScale } from "react-icons/hi2";
import { PiShuffle } from "react-icons/pi";
import Button from "../../ui/Button";
import FormRow from "../../ui/FormRow";
import Heading from "../../ui/Heading";
import Row from "../../ui/Row";
import Dropdown from "../../ui/Dropdown";
import ContentBox from "../../ui/ContentBox";
import { useChoosePlayers } from "../../contexts/ChoosePlayerContext";
import Ruleset from "./Ruleset";
import ClearPlayers from "../../ui/CustomIcons/ClearPlayers";
import { DropdownProvider } from "../../contexts/DropdownContext";

const Container = styled.div`
    max-width: 120rem;
    margin: 0px auto;
    display: flex;
    flex-direction: column;
    gap: 3.2rem;
`;

const PlayersContainer = styled.div`
    margin-top: -3rem;
    display: flex;
    gap: 2.2rem;
    justify-items: space-evenly;
`;

const SubmitRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 2.4rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);
`;

const CheckboxContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const TeamContainer = styled(ContentBox)`
    min-height: 30rem;
    justify-content: space-between;
`;

const PlayerContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
`;

const AddButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: flex-end;

    & button {
        width: 100%;
    }
`;

const MidButtonsContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2.4rem;
`;

const MidButton = styled(Button)`
    height: fit-content;
    padding: 1.4rem;
    align-self: center;

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

function ChoosePlayers() {
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
        filteredForPlayer1,
        filteredForPlayer2,
        filteredForPlayer3And4,
        switchTeams,
        clearAllPlayers,
        balanceTeams,
        canBalanceTeams,
        isAlreadyBalanced,
        shufflePlayers,
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
            return Math.ceil((mainPlayer.mmr2on2 + secondPlayer.mmr2on2) / 2);
        }

        // Team has 1 player in a 2v1/2v2 context
        return Math.round(mainPlayer.mmr2on2);
    }

    const team1Mmr = getTeamMmrDisplay(player1, player3, isPlayer3Active);
    const team2Mmr = getTeamMmrDisplay(player2, player4, isPlayer4Active);

    return (
        <DropdownProvider>
            <Container>
                <Row type="horizontal">
                    <Heading as="h1">
                        Team 1{team1Mmr !== null && ` (MMR ${team1Mmr})`}
                    </Heading>
                    <Heading as="h1">
                        Team 2{team2Mmr !== null && ` (MMR ${team2Mmr})`}
                    </Heading>
                </Row>
                <PlayersContainer>
                    <TeamContainer>
                        <PlayerContainer>
                            <Heading as="h3">Player 1</Heading>
                            <Dropdown
                                initSelected={{
                                    text: player1?.name,
                                    value: player1?.id,
                                }}
                                options={filteredForPlayer1}
                                onSelect={(playerId) =>
                                    selectPlayer(playerId, 1)
                                }
                                isLoading={isLoading}
                            />
                        </PlayerContainer>
                        {isPlayer3Active ? (
                            <PlayerContainer>
                                <Heading as="h3">Player 3</Heading>
                                <Dropdown
                                    initSelected={{
                                        text: player3?.name,
                                        value: player3?.id,
                                    }}
                                    options={filteredForPlayer3And4}
                                    onSelect={(playerId) =>
                                        selectPlayer(playerId, 3)
                                    }
                                    isLoading={isLoading}
                                />
                            </PlayerContainer>
                        ) : (
                            <AddButtonContainer>
                                <Button onClick={() => activatePlayer(3)}>
                                    <HiPlus />
                                    <span>Add Player 3</span>
                                </Button>
                            </AddButtonContainer>
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
                        {canBalanceTeams && (
                            <MidButton
                                onClick={shufflePlayers}
                                disabled={isStarting}
                                title="Shuffle Players Randomly"
                            >
                                <PiShuffle />
                            </MidButton>
                        )}
                        <MidButton
                            onClick={switchTeams}
                            disabled={isStarting}
                            title="Switch Teams"
                        >
                            <HiArrowsRightLeft />
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
                        <PlayerContainer>
                            <Heading as="h3">Player 2</Heading>
                            <Dropdown
                                initSelected={{
                                    text: player2?.name,
                                    value: player2?.id,
                                }}
                                options={filteredForPlayer2}
                                onSelect={(playerId) =>
                                    selectPlayer(playerId, 2)
                                }
                                isLoading={isLoading}
                            />
                        </PlayerContainer>
                        {isPlayer4Active ? (
                            <PlayerContainer>
                                <Heading as="h3">Player 4</Heading>
                                <Dropdown
                                    initSelected={{
                                        text: player4?.name,
                                        value: player4?.id,
                                    }}
                                    options={filteredForPlayer3And4}
                                    onSelect={(playerId) =>
                                        selectPlayer(playerId, 4)
                                    }
                                    isLoading={isLoading}
                                />
                            </PlayerContainer>
                        ) : (
                            <AddButtonContainer>
                                <Button onClick={() => activatePlayer(4)}>
                                    <HiPlus />
                                    <span>Add Player 4</span>
                                </Button>
                            </AddButtonContainer>
                        )}
                    </TeamContainer>
                </PlayersContainer>
                <SubmitRow>
                    <CheckboxContainer>
                        {/* <div>
                        <SwitchButton
                            label="Random teams (noch nicht implementiert)"
                            id="random-teams"
                            type="checkbox"
                            disabled={true}
                        />
                    </div>
                    <div>
                        <SwitchButton
                            label="Random sides (noch nicht implementiert)"
                            id="random-sides"
                            type="checkbox"
                            disabled={true}
                        />
                    </div> */}
                    </CheckboxContainer>
                    {!isStarting && (
                        <FormRow>
                            <Button $size="large" onClick={startCountdown}>
                                Start match
                            </Button>
                        </FormRow>
                    )}
                    {isStarting && (
                        <FormRow
                            label={
                                timer <= 0
                                    ? "Good luck have fun!"
                                    : `Starting in ${timer}`
                            }
                        >
                            {timer > 0 && (
                                <Button
                                    $size="large"
                                    $variation="secondary"
                                    type="button"
                                    onClick={cancelTimer}
                                >
                                    Cancel match
                                </Button>
                            )}
                        </FormRow>
                    )}
                </SubmitRow>
                <Ruleset />
            </Container>
        </DropdownProvider>
    );
}

export default ChoosePlayers;
