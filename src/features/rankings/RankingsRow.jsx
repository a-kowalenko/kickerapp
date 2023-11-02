import styled from "styled-components";
import Table from "../../ui/Table";
import Avatar from "../../ui/Avatar";
import { Link } from "react-router-dom";
import { DEFAULT_AVATAR } from "../../utils/constants";

const Rank = styled.div`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-grey-600);
`;

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
    text-align: center;
`;

function RankingsRow({ player, gamemode }) {
    const wins = gamemode === "1on1" ? player.wins : player.wins2on2;
    const losses = gamemode === "1on1" ? player.losses : player.losses2on2;
    const mmr = gamemode === "1on1" ? player.mmr : player.mmr2on2;

    const totalGames = wins + losses;
    const winrate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
    return (
        <Table.Row>
            <Rank>{player.rank}</Rank>

            <Name to={`/user/${player.name}/profile`}>
                <Avatar $size="xs" src={player.avatar || DEFAULT_AVATAR} />
                <span>{player.name}</span>
            </Name>

            <Stat>
                <span>{wins}</span>
            </Stat>

            <Stat>
                <span>{losses}</span>
            </Stat>

            <Stat>
                <span>{totalGames}</span>
            </Stat>

            <Stat>
                <span>{winrate}%</span>
            </Stat>

            <Stat>
                <span>{mmr}</span>
            </Stat>
        </Table.Row>
    );
}

export default RankingsRow;
