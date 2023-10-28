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
    justify-content: center;
    align-items: center;
    gap: 1.2rem;
`;

const ScoreInput = styled.input`
    padding: 1.4rem 2.8rem;
    border: none;
    border-radius: var(--border-radius-sm);
    width: 20%;
`;

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.8rem;
`;

const Player = styled.div`
    display: flex;
    justify-content: ${(props) =>
        props.$team === "1" ? "flex-start" : "flex-end"};
    gap: 1.2rem;
    align-items: center;
    font-weight: 500;
    font-size: 3.8rem;
    color: var(--color-grey-600);
`;

const Avatar = styled.img`
    display: block;
    width: 4rem;
    width: 12.6rem;
    aspect-ratio: 1;
    object-fit: cover;
    object-position: center;
    border-radius: 50%;
    outline: 2px solid var(--color-grey-100);
`;

const Timer = styled.label`
    font-size: large;
    padding: 1.4rem 2.8rem;
`;

const EndMatchButton = styled.button`
    padding: 1.4rem 2.8rem;
    border: none;
    border-radius: var(--border-radius-sm);
    background-color: var(--color-amber-100);

    &:hover {
        background-color: var(--color-amber-200);
    }

    &:active {
        background-color: var(--color-amber-300);
    }
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
                    <ScoreInput />
                    - <ScoreInput />
                </ScoreContainer>
                <TeamHeader>Team B</TeamHeader>
            </TopRow>
            <MainRow>
                <TeamContainer>
                    <Player $team="1">
                        <Avatar
                            src={"/default-user.jpg"}
                            alt={`Avatar of ${player1.name}`}
                        />
                        <span>{player1.name}</span>
                    </Player>
                    {player3 && (
                        <Player $team="1">
                            <Avatar
                                src={"/default-user.jpg"}
                                alt={`Avatar of ${player3.name}`}
                            />
                            <span>{player3.name}</span>
                        </Player>
                    )}
                </TeamContainer>
                <div>Image</div>
                <TeamContainer>
                    <Player $team="2">
                        <span>{player2.name}</span>
                        <Avatar
                            src={"/default-user.jpg"}
                            alt={`Avatar of ${player2.name}`}
                        />
                    </Player>
                    {player4 && (
                        <Player $team="2">
                            <span>{player4.name}</span>
                            <Avatar
                                src={"/default-user.jpg"}
                                alt={`Avatar of ${player4.name}`}
                            />
                        </Player>
                    )}
                </TeamContainer>
            </MainRow>
            <BottomRow>
                <Timer>Timer</Timer>
                <EndMatchButton>End match</EndMatchButton>
            </BottomRow>
        </>
    );
}

export default MatchDetail;
