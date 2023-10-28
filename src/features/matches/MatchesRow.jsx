import styled from "styled-components";
import Table from "../../ui/Table";
import { format } from "date-fns";
import Avatar from "../../ui/Avatar";

const Rank = styled.div`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-grey-600);
`;

const Name = styled.div`
    display: flex;
    gap: 0.8rem;
    font-size: 1.6rem;
    font-weight: 400;
`;

const Stat = styled.div`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 500;
    text-align: center;
`;

const ScoreContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.2rem;
`;

const Score = styled.div`
    font-weight: 600;
`;

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;

    & div {
        justify-content: ${(props) =>
            props.$team === "1" ? "flex-end" : "flex-start"};
        color: ${(props) => (props.$won ? "green" : "red")};
    }
`;

const GameModeCeontainer = styled.div`
    display: flex;
    justify-content: center;
`;

const StartTimeContainer = styled.div`
    display: flex;
    justify-content: center;
`;

const DurationContainer = styled.div`
    display: flex;
`;

function MatchesRow({ match }) {
    const { player1, player2, player3, player4 } = match;

    const gameMode =
        !player3 && !player4
            ? "1 on 1"
            : !player3
            ? "1 on 2"
            : !player4
            ? "2 on 1"
            : "2 on 2";

    const team1Won = match.scoreTeam1 > match.scoreTeam2;

    return (
        <Table.Row>
            <Rank>{match.id}</Rank>

            <TeamContainer $won={team1Won} $team="1">
                <Name>
                    <span>{player1.name}</span>
                    <Avatar $size="xs" src={player1.avatar} />
                </Name>
                {player3 && (
                    <Name>
                        <span>{player3?.name}</span>
                        <Avatar $size="xs" src={player3.avatar} />
                    </Name>
                )}
            </TeamContainer>

            <ScoreContainer>
                <Score>{match.scoreTeam1}</Score>
                &mdash;
                <Score>{match.scoreTeam2}</Score>
            </ScoreContainer>

            <TeamContainer $won={!team1Won} $team="2">
                <Name>
                    <Avatar $size="xs" src={player2.avatar} />
                    <span>{player2.name}</span>
                </Name>
                {player4 && (
                    <Name>
                        <Avatar $size="xs" src={player4?.avatar} />
                        <span>{player4.name}</span>
                    </Name>
                )}
            </TeamContainer>

            <GameModeCeontainer>
                <span>{gameMode}</span>
            </GameModeCeontainer>

            <StartTimeContainer>
                <span>
                    {format(
                        new Date(match.created_at),
                        "dd.MM.yyyy - hh:mm:ss"
                    )}
                </span>
            </StartTimeContainer>

            <DurationContainer>
                {match.end_time && (
                    <span>
                        {format(
                            new Date(match.end_time) -
                                new Date(match.created_at),
                            "mm:ss"
                        )}
                    </span>
                )}
                {match.status === "active" && <span>Is active</span>}
            </DurationContainer>
        </Table.Row>
    );
}

export default MatchesRow;
