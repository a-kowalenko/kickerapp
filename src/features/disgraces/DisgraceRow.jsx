import styled from "styled-components";
import Table from "../../ui/Table";
import { format } from "date-fns";
import Avatar from "../../ui/Avatar";
import { DEFAULT_AVATAR } from "../../utils/constants";
import PlayerName from "../../ui/PlayerName";
import { useNavigate } from "react-router-dom";

const Stat = styled.div`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 500;
`;

function DisgraceRow({ disgrace }) {
    const navigate = useNavigate();
    const { player1, player2, player3, player4 } = disgrace;
    const isTeam1Winner = disgrace.scoreTeam1 !== 0;
    const team1 = [player1, player3];
    const team2 = [player2, player4];
    const winnerTeam = isTeam1Winner ? team1 : team2;
    const loserTeam = isTeam1Winner ? team2 : team1;

    function handleClickRow(e) {
        e.stopPropagation();
        navigate(`/matches/${disgrace.id}`);
    }

    return (
        <Table.Row onClick={handleClickRow}>
            <div>
                {loserTeam.map(
                    (loser) =>
                        loser && (
                            <PlayerName
                                to={`/user/${loser.name}/profile`}
                                key={loser.id}
                                onClick={handleClickRow}
                            >
                                <Avatar
                                    $size="xs"
                                    src={loser.avatar || DEFAULT_AVATAR}
                                />
                                <span>{loser.name}</span>
                            </PlayerName>
                        )
                )}
            </div>

            <div>
                {winnerTeam.map(
                    (winner) =>
                        winner && (
                            <PlayerName
                                to={`/user/${winner.name}/profile`}
                                key={winner.id}
                                onClick={handleClickRow}
                            >
                                <Avatar
                                    $size="xs"
                                    src={winner.avatar || DEFAULT_AVATAR}
                                />
                                <span>{winner.name}</span>
                            </PlayerName>
                        )
                )}
            </div>

            <Stat>
                <span>{format(new Date(disgrace.end_time), "dd.MM.yyyy")}</span>
            </Stat>
        </Table.Row>
    );
}

export default DisgraceRow;
