import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { de } from "date-fns/locale";
import { useMonthlyMatches } from "./useMonthlyMatches";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { format } from "date-fns";
import { usePlayers } from "../../hooks/usePlayers";
import {
    getPlayersNumberFromMatchById,
    hasPlayerWonMatch,
} from "../../utils/helpers";
import ContentBox from "../../ui/ContentBox";
import styled from "styled-components";
import { colorsLight, media } from "../../utils/constants";
import { useEffect, useState } from "react";
import Dropdown from "../../ui/Dropdown";
import Row from "../../ui/Row";
import Heading from "../../ui/Heading";
import useWindowWidth from "../../hooks/useWindowWidth";
import { useSearchParams } from "react-router-dom";

const StyledTimePlayedChart = styled(ContentBox)`
    grid-area: 4 / 1 / 7 / 5;

    @media (max-width: 1350px) {
        grid-area: 6 / 1 / 7 / 3;
    }
`;

const TooltipEntry = styled.p`
    color: ${(props) => props.$color};
`;

const FilterRow = styled.div`
    display: flex;
    align-items: center;
    gap: 2.4rem;

    ${media.mobile} {
        gap: 0.4rem;
        justify-content: space-evenly;

        & div div {
            padding: 1rem;
        }

        & ul div {
            padding: 0.6rem;
        }
    }
`;

function TimePlayedChart() {
    const [type, setType] = useState("duration");
    const { data: matches, isLoading: isLoadingMatches } = useMonthlyMatches();
    const { players, isLoading: isLoadingPlayers } = usePlayers();
    const data = [];
    const { isMobile } = useWindowWidth();
    const currentMonth = format(new Date(), "LLLL", { locale: de });
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (type === "mmr") {
            const currentGamemodeFilter = searchParams.get("gamemode");
            if (["all", "2on1"].includes(currentGamemodeFilter)) {
                searchParams.set("gamemode", "1on1");
                setSearchParams(searchParams);
            }
        }
    }, [type, searchParams, setSearchParams]);

    if (isLoadingPlayers) {
        return <LoadingSpinner />;
    }

    const playersObject = {};
    if (!isLoadingMatches) {
        matches.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        for (const [i, player] of players
            .sort((a, b) => a.id - b.id)
            .entries()) {
            playersObject[player.id] = {
                playername: player.name,
                duration: 0,
                matchesPlayed: 0,
                wins: 0,
                losses: 0,
                mmr: null,
                color: colorsLight[i % players.length],
            };
        }

        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            const deepCopy = JSON.parse(JSON.stringify(playersObject));
            data.push({
                date: new Date(year, month, i),
                ...deepCopy,
            });
        }
        for (const match of matches) {
            const dayOfMatch = new Date(match.created_at).getDate();
            const durationPlayed =
                new Date(match.end_time) - new Date(match.start_time);
            const { player1, player2, player3, player4 } = match;
            const playersInMatch = [player1, player2, player3, player4].filter(
                (player) => player !== null
            );

            for (const player of playersInMatch) {
                const playerNumber = getPlayersNumberFromMatchById(
                    player.id,
                    match
                );
                const team = playerNumber === 1 || playerNumber === 3 ? 1 : 2;
                const curPlayerData = data[dayOfMatch - 1][player.id];
                curPlayerData.duration += durationPlayed;
                curPlayerData.matchesPlayed += 1;
                curPlayerData.wins += hasPlayerWonMatch(player.id, match)
                    ? 1
                    : 0;
                curPlayerData.losses += !hasPlayerWonMatch(player.id, match)
                    ? 1
                    : 0;
                curPlayerData.mmr = match[`mmrPlayer${playerNumber}`];
                if (match[`mmrChangeTeam${team}`] !== null) {
                    curPlayerData.mmr += match[`mmrChangeTeam${team}`];
                }
            }
        }

        for (let i = 1; i < data.length; i++) {
            const yesterdaysData = data[i - 1];
            for (const player of players) {
                if (data[i][player.id].mmr === null) {
                    data[i][player.id].mmr = yesterdaysData[player.id].mmr;
                }
                if (data[i].date.getDate() <= date.getDate()) {
                    data[i][player.id].duration +=
                        yesterdaysData[player.id].duration;
                    data[i][player.id].matchesPlayed +=
                        yesterdaysData[player.id].matchesPlayed;
                    data[i][player.id].wins += yesterdaysData[player.id].wins;
                    data[i][player.id].losses +=
                        yesterdaysData[player.id].losses;
                    player.cumulatedDuration = data[i][player.id].duration;
                    player.cumulatedMatchesPlayed =
                        data[i][player.id].matchesPlayed;
                    player.cumulatedWins = data[i][player.id].wins;
                    player.cumulatedLosses = data[i][player.id].losses;
                    player.cumulatedMmr = data[i][player.id].mmr;
                } else {
                    data[i][player.id].duration = null;
                    data[i][player.id].matchesPlayed = null;
                    data[i][player.id].wins = null;
                    data[i][player.id].losses = null;
                    data[i][player.id].mmr = null;
                }
            }
        }

        for (const o of data) {
            o.date = format(o.date, "dd.MM.yyyy");
        }
    }

    const options = [
        { text: "Duration", value: "duration" },
        { text: "MMR", value: "mmr" },
        { text: "Matches played", value: "matchesPlayed" },
        { text: "Wins", value: "wins" },
        { text: "Losses", value: "losses" },
    ];

    const gamemodeOptions =
        type === "mmr"
            ? [
                  { text: "1on1", value: "1on1" },
                  { text: "2on2", value: "2on2" },
              ]
            : [
                  { text: "all", value: "all" },
                  { text: "1on1", value: "1on1" },
                  { text: "2on2", value: "2on2" },
                  { text: "2on1", value: "2on1" },
              ];

    let sortBy = "cumulatedDuration";
    if (type === "duration") {
        sortBy = "cumulatedDuration";
    } else if (type === "matchesPlayed") {
        sortBy = "cumulatedMatchesPlayed";
    } else if (type === "mmr") {
        sortBy = "cumulatedMmr";
    } else if (type === "wins") {
        sortBy = "cumulatedWins";
    } else if (type === "losses") {
        sortBy = "cumulatedLosses";
    }

    function handleGamemodeFilter(option) {
        searchParams.set("gamemode", option);
        setSearchParams(searchParams);
    }

    return (
        <StyledTimePlayedChart>
            <Row type="horizontal">
                <Heading as="h2">Kicker Statistics - {currentMonth}</Heading>
            </Row>
            <FilterRow>
                <Dropdown
                    minWidth={isMobile ? "20rem" : "25rem"}
                    options={options}
                    onSelect={(option) => setType(option)}
                    initSelected={options.find(
                        (option) => option.value === type
                    )}
                />
                <Dropdown
                    minWidth={isMobile ? "12rem" : "14rem"}
                    options={gamemodeOptions}
                    onSelect={(option) => handleGamemodeFilter(option)}
                    initSelected={{
                        text: searchParams.get("gamemode") || "1on1",
                        value: searchParams.get("gamemode") || "1on1",
                    }}
                />
            </FilterRow>
            {isLoadingMatches ? (
                <LoadingSpinner />
            ) : (
                <ResponsiveContainer width="100%" height={isMobile ? 400 : 500}>
                    <LineChart
                        width={600}
                        height={300}
                        data={data}
                        margin={{ top: 5, right: 5, bottom: 0, left: 10 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-grey-300)"
                        />
                        <XAxis
                            dataKey="date"
                            dy={5}
                            interval={"preserveStartEnd"}
                        />
                        <YAxis
                            domain={["auto", "auto"]}
                            tick={<CustomizedAxisTick type={type} />}
                        />
                        <Tooltip
                            content={
                                <CustomTooltip
                                    type={type}
                                    playersObject={playersObject}
                                />
                            }
                        />
                        <Legend formatter={renderLegendText} />
                        {players
                            .sort((a, b) => b[sortBy] - a[sortBy])
                            .map((player) => (
                                <Line
                                    type="monotone"
                                    name={player.name}
                                    dataKey={`${player.id}.${type}`}
                                    key={player.id}
                                    stroke={playersObject[player.id].color}
                                    activeDot={{ r: 4 }}
                                    strokeWidth={2}
                                />
                            ))}
                    </LineChart>
                </ResponsiveContainer>
            )}
        </StyledTimePlayedChart>
    );
}

function formatDuration(milliseconds) {
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}

function CustomizedAxisTick({ x, y, payload, type }) {
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={0}
                textAnchor="end"
                fill="var(--primary-text-color)"
            >
                {type === "duration"
                    ? formatDuration(payload.value)
                    : payload.value}
            </text>
        </g>
    );
}

function CustomTooltip({ active, payload, label, type, playersObject }) {
    if (active && payload && payload.length) {
        return (
            <div
                className="custom-tooltip"
                style={{
                    backgroundColor: "var(--tertiary-background-color)",
                    padding: "10px",
                    border: "1px solid var(--primary-text-color)",
                }}
            >
                <p className="label">{`Date: ${label}`}</p>
                {payload
                    .sort((a, b) => b.value - a.value)
                    .map((entry, index) => (
                        <TooltipEntry
                            key={index}
                            $color={
                                playersObject[entry.dataKey.split(".")[0]].color
                            }
                            $index={index}
                            $length={payload.length}
                        >{`${entry.name}: ${
                            type === "duration"
                                ? formatDuration(entry.value)
                                : entry.value
                        }`}</TooltipEntry>
                    ))}
            </div>
        );
    }

    return null;
}

function renderLegendText(value) {
    return <span>{value.split(".")[0]}</span>;
}

export default TimePlayedChart;
