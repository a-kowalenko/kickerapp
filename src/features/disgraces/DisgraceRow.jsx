import styled from "styled-components";
import Table from "../../ui/Table";
import { format } from "date-fns";
import Avatar from "../../ui/Avatar";
import { Link } from "react-router-dom";
import { DEFAULT_AVATAR } from "../../utils/constants";

const Name = styled(Link)`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-size: 1.6rem;
    font-weight: 400;
    color: var(--color-grey-600);
    width: fit-content;
`;

const Stat = styled.div`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 500;
`;

function DisgraceRow({ disgrace }) {
    const { player1, player2, player3, player4 } = disgrace;
    const isTeam1Winner = disgrace.scoreTeam1 !== 0;
    const team1 = [player1, player3];
    const team2 = [player2, player4];
    const winnerTeam = isTeam1Winner ? team1 : team2;
    const loserTeam = isTeam1Winner ? team2 : team1;

    return (
        <Table.Row>
            <div>
                {loserTeam.map(
                    (loser) =>
                        loser && (
                            <Name
                                to={`/user/${loser.name}/profile`}
                                key={loser.id}
                            >
                                <Avatar
                                    $size="xs"
                                    src={loser.avatar || DEFAULT_AVATAR}
                                />
                                <span>{loser.name}</span>
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
                                <Avatar
                                    $size="xs"
                                    src={winner.avatar || DEFAULT_AVATAR}
                                />
                                <span>{winner.name}</span>
                            </Name>
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
