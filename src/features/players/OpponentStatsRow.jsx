import styled from "styled-components";
import PlayerName from "../../ui/PlayerName";
import Table from "../../ui/Table";
import { media } from "../../utils/constants";

const CenteredColumnInMobile = styled.div`
    ${media.tablet} {
        display: flex;
        justify-content: center;
    }
`;

function OpponentStatsRow({ stats }) {
    const { name, wins, losses, total, winrate, goals, ownGoals } = stats;

    return (
        <Table.Row>
            <PlayerName to={`/user/${name}/profile`}>
                <span>{name}</span>
            </PlayerName>
            <CenteredColumnInMobile>
                <span>{wins}</span>
            </CenteredColumnInMobile>
            <CenteredColumnInMobile>
                <span>{losses}</span>
            </CenteredColumnInMobile>
            <CenteredColumnInMobile>
                <span>{total}</span>
            </CenteredColumnInMobile>
            <CenteredColumnInMobile>
                <span>{(winrate * 100).toFixed(1)}</span>%
            </CenteredColumnInMobile>
            <CenteredColumnInMobile>
                <span>{goals}</span>
            </CenteredColumnInMobile>
            <CenteredColumnInMobile>
                <span>{ownGoals}</span>
            </CenteredColumnInMobile>
        </Table.Row>
    );
}

export default OpponentStatsRow;
