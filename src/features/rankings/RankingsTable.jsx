import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import Pagination from "../../ui/Pagination";
import Table from "../../ui/Table";
import RankingsRow from "./RankingsRow";
import { useRankings } from "./useRankings";
import LoadingSpinner from "../../ui/LoadingSpinner";
import useWindowWidth from "../../hooks/useWindowWidth";

const UnrankedDivider = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.2rem 2.4rem;
    background-color: var(--color-grey-100);
    border-top: 1px solid var(--color-grey-200);
    border-bottom: 1px solid var(--color-grey-200);
    color: var(--color-grey-500);
    font-size: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const DividerLine = styled.div`
    flex: 1;
    height: 1px;
    background-color: var(--color-grey-300);
`;

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

    // Separate ranked and unranked players
    const rankedPlayers = rankings?.filter((p) => !p.isUnranked) || [];
    const unrankedPlayers = rankings?.filter((p) => p.isUnranked) || [];

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
                <>
                    <Table.Body
                        noDataLabel={
                            unrankedPlayers.length > 0
                                ? null
                                : "No rankings available"
                        }
                        data={rankedPlayers}
                        render={(player) => (
                            <RankingsRow
                                key={player.id}
                                player={player}
                                gamemode={gamemode}
                            />
                        )}
                    />
                    {unrankedPlayers.length > 0 && (
                        <>
                            <UnrankedDivider>
                                <DividerLine />
                                <span>Unranked (min. 10 games required)</span>
                                <DividerLine />
                            </UnrankedDivider>
                            <Table.Body
                                data={unrankedPlayers}
                                render={(player) => (
                                    <RankingsRow
                                        key={player.id}
                                        player={player}
                                        gamemode={gamemode}
                                    />
                                )}
                            />
                        </>
                    )}
                    {rankedPlayers.length === 0 &&
                        unrankedPlayers.length === 0 && (
                            <Table.Body
                                noDataLabel="No rankings available"
                                data={[]}
                                render={() => null}
                            />
                        )}
                </>
            )}
            <Table.Footer>
                <Pagination numEntries={count} />
            </Table.Footer>
        </Table>
    );
}

export default RankingsTable;
