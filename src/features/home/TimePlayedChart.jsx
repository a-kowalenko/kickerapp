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
import { enUS } from "date-fns/locale";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { format } from "date-fns";
import { usePlayers } from "../../hooks/usePlayers";
import { daysInMonth, hasPlayerWonMatch } from "../../utils/helpers";
import ContentBox from "../../ui/ContentBox";
import styled from "styled-components";
import {
    GAMEMODE_1ON1,
    GAMEMODE_2ON1,
    GAMEMODE_2ON2,
    MATCH_ACTIVE,
    colorsLight,
    media,
} from "../../utils/constants";
import { useState } from "react";
import Dropdown from "../../ui/Dropdown";
import Row from "../../ui/Row";
import Heading from "../../ui/Heading";
import useWindowWidth from "../../hooks/useWindowWidth";
import { usePlayerHistory } from "./usePlayerHistory";
import SpinnerMini from "../../ui/SpinnerMini";
import { useTodayStats } from "./useTodayStats";
import SwitchButton from "../../ui/SwitchButton";

const StyledTimePlayedChart = styled(ContentBox)`
    grid-area: 4 / 1 / 7 / 5;

    @media (max-width: 1350px) {
        grid-area: 6 / 1 / 7 / 3;
    }
`;

const TooltipEntry = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.2rem;
    color: ${(props) => props.$color};
`;

const TooltipText = styled.div``;

const TooltipValue = styled.div`
    text-align: right;
    white-space: pre-wrap;
`;
const TooltipDurationValue = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
`;

const FilterRow = styled.div`
    display: flex;
    align-items: center;
    gap: 2.4rem;

    flex-wrap: wrap;

    ${media.mobile} {
        padding: 0 1rem;
        gap: 1rem;
        justify-content: space-between;

        & div div {
            padding: 1rem;
        }

        & ul div {
            padding: 0.6rem;
        }
    }
`;

function TimePlayedChart() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [type, setType] = useState("duration");
    const [isCumulated, setIsCumulated] = useState(true);
    const [gamemode, setGamemode] = useState("all");
    const { players, isLoading: isLoadingPlayers } = usePlayers();
    const { isMobile } = useWindowWidth();
    const currentMonthText = format(new Date(), "LLLL", { locale: enUS });
    const { history, isLoadingHistory } = usePlayerHistory({
        month,
        year,
    });
    const { matches, isLoading: isLoadingMatches } = useTodayStats();

    const maxDays = daysInMonth(month + 1, new Date().getFullYear());

    let data = [];

    if (!isLoadingMatches && !isLoadingHistory && !isLoadingPlayers) {
        let todaysDataObject = {};
        for (const player of players) {
            todaysDataObject[player.name] = {
                player_name: player.name,
                player_id: player.id,
                user_id: player.user_id,
                kicker_id: player.kicker_id,
                mmr: player.mmr,
                mmr2on2: player.mmr2on2,
                wins: 0,
                wins2on2: 0,
                wins2on1: 0,
                losses: 0,
                losses2on2: 0,
                losses2on1: 0,
                duration: 0,
                duration2on2: 0,
                duration2on1: 0,
                created_at: new Date().toISOString(),
            };
        }

        todaysDataObject = matches
            ?.filter((m) => m.status !== MATCH_ACTIVE)
            .reduce((acc, cur) => {
                const mode = cur.gamemode;
                const { player1, player2, player3, player4 } = cur;
                const playersList = [player1, player2, player3, player4].filter(
                    (p) => p !== null
                );

                for (const player of playersList) {
                    if (mode === GAMEMODE_1ON1) {
                        if (hasPlayerWonMatch(player.id, cur)) {
                            acc[player.name].wins += 1;
                        } else {
                            acc[player.name].losses += 1;
                        }
                        acc[player.name].duration +=
                            (new Date(cur.end_time) -
                                new Date(cur.start_time)) /
                            1000;
                    }
                    if (mode === GAMEMODE_2ON2) {
                        if (hasPlayerWonMatch(player.id, cur)) {
                            acc[player.name].wins2on2 += 1;
                        } else {
                            acc[player.name].losses2on2 += 1;
                        }
                        acc[player.name].duration2on2 +=
                            new Date(cur.end_time) - new Date(cur.start_time);
                    }
                    if (mode === GAMEMODE_2ON1) {
                        if (hasPlayerWonMatch(player.id, cur)) {
                            acc[player.name].wins2on1 += 1;
                        } else {
                            acc[player.name].losses2on1 += 1;
                        }
                        acc[player.name].duration2on1 +=
                            new Date(cur.end_time) - new Date(cur.start_time);
                    }
                }

                return acc;
            }, todaysDataObject);

        const todaysDataArray = Object.values(todaysDataObject);

        data = [...history, ...todaysDataArray]?.reduce((acc, cur) => {
            const currentIndex = acc.length - 1;
            const date = format(new Date(cur.created_at), "dd.MM.yyyy");

            const newCur = {
                ...cur,
                matchesPlayedall:
                    cur.wins +
                    cur.losses +
                    cur.wins2on2 +
                    cur.losses2on2 +
                    cur.wins2on1 +
                    cur.losses2on1,
                matchesPlayed: cur.wins + cur.losses,
                matchesPlayed2on2: cur.wins2on2 + cur.losses2on2,
                matchesPlayed2on1: cur.wins2on1 + cur.losses2on1,
                winsall: cur.wins + cur.wins2on2 + cur.wins2on1,
                lossesall: cur.losses + cur.losses2on2 + cur.losses2on1,
                durationall: cur.duration + cur.duration2on2 + cur.duration2on1,
            };

            if (acc.length === 0) {
                return [
                    {
                        date,
                        [cur.player_name]: newCur,
                    },
                ];
            }

            if (date === acc[currentIndex].date) {
                acc[currentIndex][cur.player_name] = newCur;
            } else {
                acc = [
                    ...acc,
                    {
                        date,
                        [cur.player_name]: newCur,
                    },
                ];
            }

            if (isCumulated && acc.length > 1) {
                newCur.matchesPlayedall +=
                    acc[acc.length - 2][newCur.player_name].matchesPlayedall;
                newCur.matchesPlayed +=
                    acc[acc.length - 2][newCur.player_name].matchesPlayed;
                newCur.matchesPlayed2on2 +=
                    acc[acc.length - 2][newCur.player_name].matchesPlayed2on2;
                newCur.matchesPlayed2on1 +=
                    acc[acc.length - 2][newCur.player_name].matchesPlayed2on1;
                newCur.winsall +=
                    acc[acc.length - 2][newCur.player_name].winsall;
                newCur.lossesall +=
                    acc[acc.length - 2][newCur.player_name].lossesall;
                newCur.durationall +=
                    acc[acc.length - 2][newCur.player_name].durationall;
                newCur.duration +=
                    acc[acc.length - 2][newCur.player_name].duration;
                newCur.duration2on2 +=
                    acc[acc.length - 2][newCur.player_name].duration2on2;
                newCur.duration2on1 +=
                    acc[acc.length - 2][newCur.player_name].duration2on1;
                newCur.wins += acc[acc.length - 2][newCur.player_name].wins;
                newCur.wins2on2 +=
                    acc[acc.length - 2][newCur.player_name].wins2on2;
                newCur.wins2on1 +=
                    acc[acc.length - 2][newCur.player_name].wins2on1;
                newCur.losses += acc[acc.length - 2][newCur.player_name].losses;
                newCur.losses2on2 +=
                    acc[acc.length - 2][newCur.player_name].losses2on2;
                newCur.losses2on1 +=
                    acc[acc.length - 2][newCur.player_name].losses2on1;
            }

            return acc;
        }, []);
    }

    const finalData = [];

    for (let i = 1; i <= maxDays; i++) {
        const dataset = data?.find(
            (item) =>
                item.date === format(new Date(2023, month, i), "dd.MM.yyyy")
        );
        if (dataset) {
            finalData.push(dataset);
        } else {
            finalData.push({});
        }
    }

    if (isLoadingPlayers) {
        return <LoadingSpinner />;
    }

    const playersObject = {};

    for (const [i, player] of players.sort((a, b) => a.id - b.id).entries()) {
        playersObject[player.id] = {
            color: colorsLight[i % players.length],
        };
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
                  { text: GAMEMODE_1ON1, value: GAMEMODE_1ON1 },
                  { text: GAMEMODE_2ON2, value: GAMEMODE_2ON2 },
              ]
            : [
                  { text: "all", value: "all" },
                  { text: GAMEMODE_1ON1, value: GAMEMODE_1ON1 },
                  { text: GAMEMODE_2ON2, value: GAMEMODE_2ON2 },
                  { text: GAMEMODE_2ON1, value: GAMEMODE_2ON1 },
              ];

    const monthOptions = [];
    for (let i = currentMonth; i >= 0; i--) {
        monthOptions.push({
            text: format(new Date().setMonth(i), "LLLL", { locale: enUS }),
            value: i,
        });
    }

    const yearOptions = [];
    for (let i = currentYear; i >= 2023; i--) {
        yearOptions.push({
            text: format(new Date().setFullYear(year), "yyyy", {
                locale: enUS,
            }),
            value: i,
        });
    }

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

    function handleTypeFilter(option) {
        setType(option);
        if (
            option === "mmr" &&
            ![GAMEMODE_1ON1, GAMEMODE_2ON2].includes(gamemode)
        ) {
            setGamemode(GAMEMODE_1ON1);
        }
    }

    function handleGamemodeFilter(option) {
        setGamemode(option);
    }

    let finalType;
    if (gamemode === GAMEMODE_1ON1) {
        finalType = type;
    } else {
        finalType = type + gamemode;
    }

    return (
        <StyledTimePlayedChart>
            <Row type="horizontal">
                <Heading as="h2">
                    Kicker Statistics - {currentMonthText}
                </Heading>
            </Row>
            <FilterRow>
                <Dropdown
                    minWidth={isMobile ? "20rem" : "25rem"}
                    options={options}
                    onSelect={(option) => handleTypeFilter(option)}
                    initSelected={options.find(
                        (option) => option.value === type
                    )}
                />
                <Dropdown
                    minWidth={isMobile ? "12rem" : "14rem"}
                    options={gamemodeOptions}
                    onSelect={(option) => handleGamemodeFilter(option)}
                    initSelected={{
                        text: gamemode,
                        value: gamemode,
                    }}
                />
                <Dropdown
                    minWidth={isMobile ? "20rem" : "25rem"}
                    options={monthOptions}
                    onSelect={(option) => setMonth(option)}
                    initSelected={{
                        text: format(new Date().setMonth(month), "LLLL", {
                            locale: enUS,
                        }),
                        value: month,
                    }}
                />
                <Dropdown
                    minWidth={isMobile ? "12rem" : "14rem"}
                    options={yearOptions}
                    onSelect={(option) => setYear(option)}
                    initSelected={{
                        text: format(new Date().setFullYear(year), "yyyy", {
                            locale: enUS,
                        }),
                        value: year,
                    }}
                />
                <SwitchButton
                    label="Cumulated"
                    value={isCumulated}
                    onChange={() => setIsCumulated((c) => !c)}
                />
                {isLoadingHistory ? <SpinnerMini /> : null}
            </FilterRow>

            <ResponsiveContainer width="100%" height={isMobile ? 400 : 500}>
                <LineChart
                    width={600}
                    height={300}
                    data={isLoadingHistory ? null : finalData}
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
                        tick={<CustomizedAxisTick type={finalType} />}
                    />
                    <Tooltip
                        content={
                            <CustomTooltip
                                type={finalType}
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
                                dataKey={`${player.name}.${finalType}`}
                                key={player.name}
                                stroke={playersObject[player.id].color}
                                activeDot={{ r: 4 }}
                                strokeWidth={2}
                            />
                        ))}
                </LineChart>
            </ResponsiveContainer>
        </StyledTimePlayedChart>
    );
}

function formatDuration(seconds) {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return (
        <TooltipDurationValue>
            <span>{hours}h</span>
            <span>{minutes}m</span>
        </TooltipDurationValue>
    );
}

function formatDurationToText(seconds) {
    const totalMinutes = Math.floor(seconds / 60);
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
                {type.includes("duration")
                    ? formatDurationToText(payload.value)
                    : payload.value}
            </text>
        </g>
    );
}

function CustomTooltip({ active, payload, label, type }) {
    if (active && payload && payload.length) {
        const finalPayload = [];
        for (const player of Object.values(payload)) {
            const actualPayload = player.payload[player.name];
            if (player.name) {
                finalPayload.push({
                    name: player.name,
                    value: actualPayload[type],
                    color: player.color,
                });
            }
        }

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
                {finalPayload
                    .sort((a, b) => b.value - a.value)
                    .map((entry, index) => (
                        <TooltipEntry
                            key={index}
                            $color={entry.color}
                            $index={index}
                            $length={finalPayload.length}
                        >
                            <TooltipText>{entry.name}:</TooltipText>
                            <TooltipValue>
                                {type.includes("duration")
                                    ? formatDuration(entry.value)
                                    : entry.value}
                            </TooltipValue>
                        </TooltipEntry>
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
