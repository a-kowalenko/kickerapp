import { useSearchParams } from "react-router-dom";
import Pagination from "../../ui/Pagination";
import Table from "../../ui/Table";
import RankingsRow from "./RankingsRow";
import { useRankings } from "./useRankings";
import LoadingSpinner from "../../ui/LoadingSpinner";
import useWindowWidth from "../../hooks/useWindowWidth";

function RankingsTable() {
    const { rankings, count, isLoadingRankings } = useRankings();
    const [searchParams] = useSearchParams();
    const gamemode = searchParams.get("gamemode")
        ? searchParams.get("gamemode")
        : "1on1";
    const { isTablet, isDesktop, isMobile } = useWindowWidth();

    const columns = isDesktop
        ? "0.3fr 2fr 1fr 1fr 1fr 1fr 1fr"
        : isTablet
        ? "0.3fr 2fr 1fr 1fr 1fr 1fr 1fr"
        : "0.5fr 1.6fr 0.4fr 0.4fr 0.4fr 1fr 0.8fr";

    return (
        <Table columns={columns}>
            <Table.Header>
                <div>Rank</div>
                <div>Player</div>
                <div style={{ textAlign: "center" }}>
                    {isMobile ? "W" : "Wins"}
                </div>
                <div style={{ textAlign: "center" }}>
                    {isMobile ? "L" : "Losses"}
                </div>
                <div style={{ textAlign: "center" }}>
                    {isMobile ? "T" : "Total"}
                </div>
                <div style={{ textAlign: "center" }}>Winrate</div>
                <div style={{ textAlign: "center" }}>MMR</div>
            </Table.Header>
            {isLoadingRankings ? (
                <LoadingSpinner />
            ) : (
                <Table.Body
                    noDataLabel="No rankings available"
                    data={rankings}
                    render={(player) => (
                        <RankingsRow
                            key={player.id}
                            player={player}
                            gamemode={gamemode}
                        />
                    )}
                />
            )}
            <Table.Footer>
                <Pagination numEntries={count} />
            </Table.Footer>
        </Table>
    );
}

export default RankingsTable;
