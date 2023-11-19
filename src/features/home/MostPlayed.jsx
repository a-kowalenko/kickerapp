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
`;

function MostPlayed() {
    const { mostPlayed, isLoading } = useMostPlayed();

    return (
        <StyledMostPlayed>
            <Row type="horizontal">
                <Heading as="h2">Most played</Heading>
            </Row>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                        <Pie
                            data={mostPlayed}
                            nameKey="name"
                            dataKey="match_count"
                            innerRadius={70}
                            outerRadius={100}
                            cx="40%"
                            cy="50%"
                            paddingAngle={3}
                            label
                            labelLine
                        >
                            {mostPlayed.map((entry, index) => (
                                <Cell
                                    fill={
                                        colorsLight[index % mostPlayed.length]
                                    }
                                    stroke={
                                        colorsLight[index % mostPlayed.length]
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
