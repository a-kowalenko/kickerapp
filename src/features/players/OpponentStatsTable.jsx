import styled from "styled-components";
import useWindowWidth from "../../hooks/useWindowWidth";
import LoadingSpinner from "../../ui/LoadingSpinner";
import Table from "../../ui/Table";
import { media } from "../../utils/constants";
import OpponentStatsRow from "./OpponentStatsRow";
import { useOpponentStats } from "./useOpponentStats";

const CenteredColumnInMobile = styled.div`
    ${media.tablet} {
        display: flex;
        justify-content: center;
        text-align: center;
    }
`;

function OpponentStatsTable() {
    const { data, isLoading } = useOpponentStats();
    const { isDesktop, isTablet, isMobile } = useWindowWidth();

    const columns = isDesktop
        ? "1fr 1fr 1fr 1fr 1fr 1fr 1fr"
        : isTablet
        ? "1fr 1fr 1fr 1fr 1fr 1fr 1fr"
        : "1fr 0.3fr 0.3fr 0.3fr 1fr 0.5fr 0.7fr";

    return (
        <Table columns={columns}>
            <Table.Header>
                <div>Opponent</div>
                <CenteredColumnInMobile>
                    {isMobile ? "W" : "Wins"}
                </CenteredColumnInMobile>
                <CenteredColumnInMobile>
                    {isMobile ? "L" : "Losses"}
                </CenteredColumnInMobile>
                <CenteredColumnInMobile>
                    {isMobile ? "T" : "Total games"}
                </CenteredColumnInMobile>
                <CenteredColumnInMobile>Winrate</CenteredColumnInMobile>
                <CenteredColumnInMobile>Goals</CenteredColumnInMobile>
                <CenteredColumnInMobile>Own Goals</CenteredColumnInMobile>
            </Table.Header>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <Table.Body
                    noDataLabel="No stats available"
                    data={data}
                    render={(stats) => (
                        <OpponentStatsRow key={stats.name} stats={stats} />
                    )}
                />
            )}
        </Table>
    );
}

export default OpponentStatsTable;
