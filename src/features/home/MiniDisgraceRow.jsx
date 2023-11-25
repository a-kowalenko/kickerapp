import { format } from "date-fns";
import MiniTable from "../../ui/MiniTable";
import PlayerName from "../../ui/PlayerName";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { media } from "../../utils/constants";

const Column = styled.div`
    display: flex;
    align-items: center;
    ${media.mobile} {
        justify-content: center;
    }
`;

const Player = styled(Column)`
    gap: 1rem;
`;

const Duration = styled(Column)``;

function MiniDisgraceRow({ disgrace }) {
    const { player1, player2, player3, player4 } = disgrace;
    const isTeam1Winner = disgrace.scoreTeam1 !== 0;
    const team1 = [player1, player3];
    const team2 = [player2, player4];
    const winnerTeam = isTeam1Winner ? team1 : team2;
    const loserTeam = isTeam1Winner ? team2 : team1;
    const navigate = useNavigate();

    function handleClickRow(e) {
        e.stopPropagation();
        navigate(`/matches/${disgrace.id}`);
    }

    return (
        <MiniTable.Row onClick={handleClickRow}>
            <Player>
                {loserTeam.map(
                    (loser) =>
                        loser && (
                            <PlayerName
                                to={`/user/${loser.name}/profile`}
                                key={loser.id}
                                onClick={handleClickRow}
                            >
                                {loser.name}
                            </PlayerName>
                        )
                )}
            </Player>
            <Player>
                {winnerTeam.map(
                    (winner) =>
                        winner && (
                            <PlayerName
                                to={`/user/${winner.name}/profile`}
                                key={winner.id}
                                onClick={handleClickRow}
                            >
                                {winner.name}
                            </PlayerName>
                        )
                )}
            </Player>
            <Duration>{format(new Date(disgrace.end_time), "dd.")}</Duration>
        </MiniTable.Row>
    );
}

export default MiniDisgraceRow;
