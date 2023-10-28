import styled from "styled-components";
import Table from "../../ui/Table";

const Rank = styled.div`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-grey-600);
`;

const Name = styled.div`
    font-size: 1.6rem;
    font-weight: 400;
    color: var(--color-grey-600);
`;

const Stat = styled.div`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 500;
    text-align: center;
`;

function RankingsRow({ player }) {
    const totalGames = player.wins + player.losses;
    const winrate =
        totalGames > 0 ? ((player.wins / totalGames) * 100).toFixed(1) : 0;
    return (
        <Table.Row>
            <Rank>{player.rank}</Rank>

            <Name>
                <span>{player.name}</span>
            </Name>

            <Stat>
                <span>{player.wins}</span>
            </Stat>

            <Stat>
                <span>{player.losses}</span>
            </Stat>

            <Stat>
                <span>{totalGames}</span>
            </Stat>

            <Stat>
                <span>{winrate}%</span>
            </Stat>

            <Stat>
                <span>{player.mmr}</span>
            </Stat>
        </Table.Row>
    );
}

export default RankingsRow;
