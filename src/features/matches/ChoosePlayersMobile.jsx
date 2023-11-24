import styled from "styled-components";
import Heading from "../../ui/Heading";
import ContentBox from "../../ui/ContentBox";
import Dropdown from "../../ui/Dropdown";
import SpinnerMini from "../../ui/SpinnerMini";
import Button from "../../ui/Button";
import { HiArrowsUpDown, HiPlus } from "react-icons/hi2";
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
        selectedPlayers: [player1, player2, player3, player4],
    } = useChoosePlayers();

    if (isLoading) {
        return <SpinnerMini />;
    }

    return (
        <StyledChoosePlayersMobile>
            <TeamContainer>
                <Heading as="h3">Team 1</Heading>
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
                <Heading as="h3">Team 2</Heading>
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
