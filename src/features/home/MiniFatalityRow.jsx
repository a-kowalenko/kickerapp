import { format } from "date-fns";
import MiniTable from "../../ui/MiniTable";
import PlayerName from "../../ui/PlayerName";
import { useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import { GAMEMODE_TEAM, media } from "../../utils/constants";

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

const TeamLink = styled(Link)`
    font-weight: 500;
    color: var(--primary-text-color);
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

function MiniFatalityRow({ fatality }) {
    const { player1, player2, player3, player4, team1, team2 } = fatality;
    const isTeam1Winner = fatality.scoreTeam1 !== 0;
    const isTeamMatch = fatality.gamemode === GAMEMODE_TEAM && team1 && team2;
    const navigate = useNavigate();

    function handleClickRow(e) {
        e.stopPropagation();
        navigate(`/matches/${fatality.id}`);
    }

    // Team match display
    if (isTeamMatch) {
        const loserTeam = isTeam1Winner ? team2 : team1;
        const winnerTeam = isTeam1Winner ? team1 : team2;

        return (
            <MiniTable.Row onClick={handleClickRow}>
                <Player>
                    <TeamLink
                        to={`/team/${loserTeam.id}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {loserTeam.name}
                    </TeamLink>
                </Player>
                <Player>
                    <TeamLink
                        to={`/team/${winnerTeam.id}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {winnerTeam.name}
                    </TeamLink>
                </Player>
                <Duration>
                    {format(new Date(fatality.end_time), "dd.")}
                </Duration>
            </MiniTable.Row>
        );
    }

    // Regular match display (1on1, 2on2, 2on1)
    const playerTeam1 = [player1, player3];
    const playerTeam2 = [player2, player4];
    const winnerTeam = isTeam1Winner ? playerTeam1 : playerTeam2;
    const loserTeam = isTeam1Winner ? playerTeam2 : playerTeam1;

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
            <Duration>{format(new Date(fatality.end_time), "dd.")}</Duration>
        </MiniTable.Row>
    );
}

export default MiniFatalityRow;
