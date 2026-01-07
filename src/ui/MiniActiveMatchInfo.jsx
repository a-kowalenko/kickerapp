import styled from "styled-components";
import { useMatchContext } from "../contexts/MatchContext";

const ActiveMatchContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--tertiary-background-color);
    color: var(--primary-text-color);
    padding: 0.3rem 0.5rem;
    border-radius: 0.5rem;
    gap: 2rem;
    font-size: 1.4rem;
    min-width: 25rem;
    max-width: calc(100vw - 2rem);
    box-shadow: 1px 0 5px var(--pulse-color-heavily-transparent),
        0 1px 5px var(--pulse-color-heavily-transparent),
        -1px 0 5px var(--pulse-color-heavily-transparent),
        0 -1px 5px var(--pulse-color-heavily-transparent);
`;

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const PlayerInfo = styled.div`
    display: flex;
    align-items: center;
`;

const ScoreDisplay = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 2rem;
    min-width: 6rem;
`;

function MiniActiveMatchInfo() {
    const { activeMatch } = useMatchContext();
    const { player1, player2, player3, player4 } = activeMatch
        ? activeMatch
        : { player1: null, player2: null, player3: null, player4: null };

    if (!activeMatch) {
        return null;
    }

    return (
        <ActiveMatchContainer>
            <TeamContainer>
                <PlayerInfo>
                    <span>{player1.name}</span>
                </PlayerInfo>
                {player3 && (
                    <PlayerInfo>
                        <span>{player3.name}</span>
                    </PlayerInfo>
                )}
            </TeamContainer>
            <ScoreDisplay>
                {activeMatch.scoreTeam1} - {activeMatch.scoreTeam2}
            </ScoreDisplay>
            <TeamContainer>
                <PlayerInfo>
                    <span>{player2.name}</span>
                </PlayerInfo>
                {player4 && (
                    <PlayerInfo>
                        <span>{player4.name}</span>
                    </PlayerInfo>
                )}
            </TeamContainer>
        </ActiveMatchContainer>
    );
}

export default MiniActiveMatchInfo;
