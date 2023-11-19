import styled from "styled-components";
import Heading from "../../ui/Heading";
import Divider from "../../ui/Divider";
import ContentBox from "../../ui/ContentBox";
import Dropdown from "../../ui/Dropdown";
import SpinnerMini from "../../ui/SpinnerMini";
import Button from "../../ui/Button";
import { HiPlus } from "react-icons/hi2";
import { useChoosePlayers } from "../../contexts/ChoosePlayerContext";

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

function ChoosePlayersMobile() {
    const {
        isLoading,
        startCountdown,
        isStarting,
        timer,
        cancelTimer,
        handleSelect,
        activatePlayer,
        isPlayer3Active,
        isPlayer4Active,
        filteredPlayers,
        filteredForPlayer3And4,
    } = useChoosePlayers();

    if (isLoading) {
        return <SpinnerMini />;
    }

    return (
        <StyledChoosePlayersMobile>
            <Heading as="h1">Choose players</Heading>

            <TeamContainer>
                <Heading as="h3">Team 1</Heading>
                <Dropdown
                    options={filteredPlayers}
                    onSelect={(playerId) => handleSelect(playerId, 0)}
                />
                {isPlayer3Active ? (
                    <Dropdown
                        options={filteredForPlayer3And4}
                        onSelect={(playerId) => handleSelect(playerId, 2)}
                    />
                ) : (
                    <Button onClick={() => activatePlayer(3)}>
                        <HiPlus />
                        <span>Add player</span>
                    </Button>
                )}
            </TeamContainer>
            <Divider />

            <TeamContainer>
                <Heading as="h3">Team 2</Heading>
                <Dropdown
                    options={filteredPlayers}
                    onSelect={(playerId) => handleSelect(playerId, 1)}
                />
                {isPlayer4Active ? (
                    <Dropdown
                        options={filteredForPlayer3And4}
                        onSelect={(playerId) => handleSelect(playerId, 3)}
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
        </StyledChoosePlayersMobile>
    );
}

export default ChoosePlayersMobile;
