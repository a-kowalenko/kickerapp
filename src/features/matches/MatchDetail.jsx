import styled from "styled-components";
import { useMatch } from "./useMatch";

const Row = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.4rem 0;
`;

const TopRow = styled(Row)``;

const MainRow = styled(Row)``;

const BottomRow = styled(Row)`
    justify-content: flex-end;
`;

const TeamHeader = styled.h1`
    background-color: var(--color-amber-100);
    width: 30%;
    border-radius: var(--border-radius-lg);
    color: var(--color-grey-700);
`;

const ScoreContainer = styled.div`
    display: flex;
`;

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const Player = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    align-items: center;
    font-weight: 500;
    font-size: 1.4rem;
    color: var(--color-grey-600);
`;

const Avatar = styled.img`
    display: block;
    width: 4rem;
    width: 3.6rem;
    aspect-ratio: 1;
    object-fit: cover;
    object-position: center;
    border-radius: 50%;
    outline: 2px solid var(--color-grey-100);
`;

function MatchDetail() {
    const { match, isLoading, error } = useMatch();
    console.log("match", match);

    if (!match || isLoading) {
        return null;
    }
    const { player1, player2, player3, player4 } = match;

    console.log("match", match);
    console.log("player1", player1);

    return (
        <>
            <TopRow>
                <TeamHeader>Team A</TeamHeader>
                <ScoreContainer>
                    <input />
                    - <input />
                </ScoreContainer>
                <TeamHeader>Team B</TeamHeader>
            </TopRow>
            <MainRow>
                <TeamContainer>
                    <Player>
                        <Avatar
                            src={"default-user.jpg"}
                            alt={`Avatar of ${player1.name}`}
                        />
                        <span>{player1.name}</span>
                    </Player>
                    <Player>Player 3</Player>
                </TeamContainer>
                <div>Image</div>
                <TeamContainer>
                    <Player>Player 2</Player>
                    <Player>Player 4</Player>
                </TeamContainer>
            </MainRow>
            <BottomRow>
                <div>Timer</div>
                <div>End match</div>
            </BottomRow>
        </>
    );
}

export default MatchDetail;
