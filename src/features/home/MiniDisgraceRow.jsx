import { format } from "date-fns";
import MiniTable from "../../ui/MiniTable";
import styled from "styled-components";
import { Link } from "react-router-dom";

const Name = styled(Link)`
    display: flex;
    gap: 0.8rem;
    font-size: 1.6rem;
    font-weight: 400;
    width: fit-content;
`;

function MiniDisgraceRow({ disgrace }) {
    const { player1, player2, player3, player4 } = disgrace;
    const isTeam1Winner = disgrace.scoreTeam1 !== 0;
    const team1 = [player1, player3];
    const team2 = [player2, player4];
    const winnerTeam = isTeam1Winner ? team1 : team2;
    const loserTeam = isTeam1Winner ? team2 : team1;

    return (
        <MiniTable.Row>
            <div>
                {loserTeam.map(
                    (loser) =>
                        loser && (
                            <Name
                                to={`/user/${loser.name}/profile`}
                                key={loser.id}
                            >
                                {loser.name}
                            </Name>
                        )
                )}
            </div>
            <div>
                {winnerTeam.map(
                    (winner) =>
                        winner && (
                            <Name
                                to={`/user/${winner.name}/profile`}
                                key={winner.id}
                            >
                                {winner.name}
                            </Name>
                        )
                )}
            </div>
            <div>{format(new Date(disgrace.end_time), "dd.")}</div>
        </MiniTable.Row>
    );
}

export default MiniDisgraceRow;
