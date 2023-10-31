import { format } from "date-fns";
import MiniTable from "../../ui/MiniTable";
import styled from "styled-components";
import { Link } from "react-router-dom";

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;

    align-items: ${(props) =>
        props.$team === "1" ? "flex-end" : "flex-start"};

    & a {
        color: ${(props) => (props.$won ? "green" : "red")};
    }
`;

const Name = styled(Link)`
    display: flex;
    gap: 0.8rem;
    font-size: 1.6rem;
    font-weight: 400;
    width: fit-content;
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

function MiniMatchRow({ match }) {
    const { player1, player2, player3, player4 } = match;

    const team1Won = match.scoreTeam1 > match.scoreTeam2;

    return (
        <MiniTable.Row>
            <div>{match.id}</div>
            <TeamContainer $won={team1Won} $team="1">
                <Name to={`/user/${player1.name}/profile`}>
                    <span>{player1.name}</span>
                </Name>
                {player3 && (
                    <Name to={`/user/${player3.name}/profile`}>
                        <span>{player3?.name}</span>
                    </Name>
                )}
            </TeamContainer>

            <ScoreContainer>
                <Score>{match.scoreTeam1}</Score>
                &mdash;
                <Score>{match.scoreTeam2}</Score>
            </ScoreContainer>

            <TeamContainer $won={!team1Won} $team="2">
                <Name to={`/user/${player2.name}/profile`}>
                    <span>{player2.name}</span>
                </Name>
                {player4 && (
                    <Name to={`/user/${player4.name}/profile`}>
                        <span>{player4.name}</span>
                    </Name>
                )}
            </TeamContainer>
            <div>
                {format(new Date(match.created_at), "dd.MM.yyyy - hh:mm:ss")}
            </div>
            <div>
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
            </div>
        </MiniTable.Row>
    );
}

export default MiniMatchRow;
