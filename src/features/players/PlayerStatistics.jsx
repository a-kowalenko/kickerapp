import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import styled from "styled-components";
import RankingsFilterRow from "../rankings/RankingsFilterRow";
import { useMmrHistory } from "./useMmrHistory";
import OpponentStatsTable from "./OpponentStatsTable";
import LoadingSpinner from "../../ui/LoadingSpinner";
import ContentBox from "../../ui/ContentBox";
import Row from "../../ui/Row";
import Heading from "../../ui/Heading";
import { useSearchParams } from "react-router-dom";

const StyledStatistics = styled.div`
    display: flex;
    flex-direction: column;
`;

const StatisticsContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
`;

function PlayerStatistics() {
    const { data, isLoading } = useMmrHistory();
    const [searchParams] = useSearchParams();
    const filteredGamemode = searchParams.get("gamemode")
        ? searchParams.get("gamemode")
        : "1on1";

    return (
        <StyledStatistics>
            <RankingsFilterRow />
            <StatisticsContent>
                <OpponentStatsTable />
                <ContentBox>
                    <Row type="horizontal">
                        <Heading as="h2">
                            MMR Timeline &mdash; {filteredGamemode}
                        </Heading>
                    </Row>
                    <ResponsiveContainer width="100%" height={350}>
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <LineChart
                                width={600}
                                height={300}
                                data={data}
                                margin={{
                                    top: 5,
                                    right: 20,
                                    bottom: 20,
                                    left: 20,
                                }}
                            >
                                <Line
                                    type="monotone"
                                    dataKey="mmr"
                                    stroke="var(--chart-line-color)"
                                    activeDot={{ r: 4 }}
                                    strokeWidth={2}
                                />
                                <CartesianGrid
                                    stroke="var(--color-grey-300)"
                                    strokeDasharray="5 5"
                                />
                                <XAxis
                                    dataKey="date"
                                    label={{
                                        value: "Date",
                                        position: "insideBottom",
                                        dy: 20,
                                    }}
                                    dy={5}
                                    padding={{ left: 30, right: 30 }}
                                />
                                <YAxis
                                    label={{
                                        value: "MMR",
                                        angle: -90,
                                        position: "insideLeft",
                                    }}
                                    domain={["auto", "auto"]}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor:
                                            "var(--tertiary-background-color)",
                                    }}
                                />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </ContentBox>
            </StatisticsContent>
        </StyledStatistics>
    );
}

export default PlayerStatistics;
