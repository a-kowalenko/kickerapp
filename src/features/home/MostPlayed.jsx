import ContentBox from "../../ui/ContentBox";
import Heading from "../../ui/Heading";
import Row from "../../ui/Row";
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { useMostPlayed } from "./useMostPlayed";
import LoadingSpinner from "../../ui/LoadingSpinner";
import styled from "styled-components";
import { media } from "../../utils/constants";

const colorsLight = [
    "#84cc16",
    "#ef4444",
    "#3b82f6",
    "#eab308",
    "#22c55e",
    "#f97316",
    "#14b8a6",
    "#a855f7",
];

const colorsDark = [
    "#b91c1c",
    "#c2410c",
    "#a16207",
    "#4d7c0f",
    "#15803d",
    "#0f766e",
    "#1d4ed8",
    "#7e22ce",
];

const StyledMostPlayed = styled(ContentBox)`
    grid-area: 2 / 3 / 3 / 5;

    @media (max-width: 1350px) {
        grid-area: 4 / 1 / 5 / 3;
    }

    ${media.tablet} {
        display: none;
    }
`;

function MostPlayed() {
    const { mostPlayed, isLoading } = useMostPlayed();

    // Filter out players with 0 matches
    const filteredData =
        mostPlayed?.filter((entry) => entry.match_count > 0) || [];

    return (
        <StyledMostPlayed>
            <Row type="horizontal">
                <Heading as="h2">Most played</Heading>
            </Row>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <PieChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <Pie
                            data={filteredData}
                            nameKey="name"
                            dataKey="match_count"
                            innerRadius={60}
                            outerRadius={88}
                            cx="35%"
                            cy="50%"
                            paddingAngle={3}
                            label
                            labelLine
                        >
                            {filteredData.map((entry, index) => (
                                <Cell
                                    fill={
                                        colorsLight[index % filteredData.length]
                                    }
                                    stroke={
                                        colorsLight[index % filteredData.length]
                                    }
                                    key={entry.name}
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                            verticalAlign="middle"
                            align="right"
                            width="25%"
                            layout="vertical"
                            iconSize={15}
                            iconType="circle"
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </StyledMostPlayed>
    );
}

export default MostPlayed;
