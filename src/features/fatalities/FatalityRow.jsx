import styled from "styled-components";
import Table from "../../ui/Table";
import { format } from "date-fns";
import Avatar from "../../ui/Avatar";
import { DEFAULT_AVATAR, GAMEMODE_TEAM } from "../../utils/constants";
import PlayerName from "../../ui/PlayerName";
import { useNavigate, Link } from "react-router-dom";

const Stat = styled.div`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 500;
`;

const TeamLink = styled(Link)`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

function FatalityRow({ fatality }) {
    const navigate = useNavigate();
    const { player1, player2, player3, player4, team1, team2 } = fatality;
    const isTeam1Winner = fatality.scoreTeam1 !== 0;
    const isTeamMatch = fatality.gamemode === GAMEMODE_TEAM && team1 && team2;

    function handleClickRow(e) {
        e.stopPropagation();
        navigate(`/matches/${fatality.id}`);
    }

    // Team match display
    if (isTeamMatch) {
        const loserTeam = isTeam1Winner ? team2 : team1;
        const winnerTeam = isTeam1Winner ? team1 : team2;

        return (
            <Table.Row onClick={handleClickRow}>
                <div>
                    <TeamLink
                        to={`/team/${loserTeam.id}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {loserTeam.name}
                    </TeamLink>
                </div>

                <div>
                    <TeamLink
                        to={`/team/${winnerTeam.id}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {winnerTeam.name}
                    </TeamLink>
                </div>

                <Stat>
                    <span>
                        {format(new Date(fatality.end_time), "dd.MM.yyyy")}
                    </span>
                </Stat>
            </Table.Row>
        );
    }

    // Regular match display (1on1, 2on2, 2on1)
    const playerTeam1 = [player1, player3];
    const playerTeam2 = [player2, player4];
    const winnerTeam = isTeam1Winner ? playerTeam1 : playerTeam2;
    const loserTeam = isTeam1Winner ? playerTeam2 : playerTeam1;

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
                <span>{format(new Date(fatality.end_time), "dd.MM.yyyy")}</span>
            </Stat>
        </Table.Row>
    );
}

export default FatalityRow;
