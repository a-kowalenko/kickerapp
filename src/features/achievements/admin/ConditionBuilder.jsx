import styled from "styled-components";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const Row = styled.div`
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 12rem;
`;

const Label = styled.label`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
`;

const Select = styled.select`
    padding: 0.8rem;
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.3rem;
    background-color: var(--color-grey-0);

    &:focus {
        outline: none;
        border-color: var(--color-brand-500);
    }
`;

const Input = styled.input`
    padding: 0.8rem;
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.3rem;
    width: 8rem;

    &:focus {
        outline: none;
        border-color: var(--color-brand-500);
    }
`;

const FilterSection = styled.div`
    border: 1px dashed var(--color-grey-300);
    border-radius: var(--border-radius-sm);
    padding: 1.2rem;
    margin-top: 0.8rem;
`;

const FilterTitle = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--secondary-text-color);
`;

const FilterRow = styled.div`
    display: flex;
    gap: 0.8rem;
    align-items: center;
    margin-bottom: 0.8rem;
    flex-wrap: wrap;
`;

const IconButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.4rem;
    color: var(--secondary-text-color);
    display: flex;
    align-items: center;

    &:hover {
        color: var(--primary-text-color);
    }

    &:hover.delete {
        color: var(--color-red-700);
    }

    & svg {
        width: 1.6rem;
        height: 1.6rem;
    }
`;

const AddButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    background-color: var(--color-grey-100);
    border: 1px dashed var(--color-grey-300);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 1.2rem;
    color: var(--secondary-text-color);

    &:hover {
        background-color: var(--color-grey-200);
    }

    & svg {
        width: 1.4rem;
        height: 1.4rem;
    }
`;

const CONDITION_TYPES = [
    { value: "counter", label: "Counter" },
    { value: "threshold", label: "Threshold" },
    { value: "streak", label: "Streak" },
];

const METRICS = [
    { value: "wins", label: "Wins" },
    { value: "losses", label: "Losses" },
    { value: "matches", label: "Matches Played" },
    { value: "goals", label: "Goals Scored" },
    { value: "own_goals", label: "Own Goals" },
    { value: "fatalities", label: "Fatalities" },
    { value: "mmr", label: "MMR" },
];

const GAMEMODES = [
    { value: "", label: "Any" },
    { value: "1on1", label: "1on1" },
    { value: "2on2", label: "2on2" },
    { value: "2on1", label: "2on1" },
];

const RESULTS = [
    { value: "", label: "Any" },
    { value: "win", label: "Win" },
    { value: "loss", label: "Loss" },
];

const FILTER_TYPES = [
    { value: "gamemode", label: "Gamemode" },
    { value: "result", label: "Result" },
    { value: "score_diff", label: "Score Difference" },
    { value: "opponent_mmr", label: "Opponent MMR" },
    { value: "duration_seconds", label: "Duration (seconds)" },
];

function ConditionBuilder({ condition, onChange }) {
    const filters = condition.filters || {};

    const handleTypeChange = (e) => {
        const type = e.target.value;
        const newCondition = { ...condition, type };

        // Add streak-specific fields
        if (type === "streak" && !newCondition.streak_condition) {
            newCondition.streak_condition = { result: "win", min_streak: 3 };
        }

        onChange(newCondition);
    };

    const handleMetricChange = (e) => {
        onChange({ ...condition, metric: e.target.value });
    };

    const handleFilterChange = (filterKey, value) => {
        const newFilters = { ...filters };

        if (value === "" || value === null) {
            delete newFilters[filterKey];
        } else {
            newFilters[filterKey] = value;
        }

        onChange({ ...condition, filters: newFilters });
    };

    const handleRangeFilterChange = (filterKey, minOrMax, value) => {
        const currentFilter = filters[filterKey] || {};
        const newFilter = { ...currentFilter };

        if (value === "" || value === null) {
            delete newFilter[minOrMax];
        } else {
            newFilter[minOrMax] = Number(value);
        }

        // Remove filter entirely if empty
        if (Object.keys(newFilter).length === 0) {
            handleFilterChange(filterKey, null);
        } else {
            handleFilterChange(filterKey, newFilter);
        }
    };

    const handleStreakChange = (field, value) => {
        const streakCondition = condition.streak_condition || {};
        onChange({
            ...condition,
            streak_condition: {
                ...streakCondition,
                [field]: field === "min_streak" ? Number(value) : value,
            },
        });
    };

    const addFilter = (filterType) => {
        if (filterType === "gamemode") {
            handleFilterChange("gamemode", "1on1");
        } else if (filterType === "result") {
            handleFilterChange("result", "win");
        } else if (filterType === "score_diff") {
            handleFilterChange("score_diff", { min: 6 });
        } else if (filterType === "opponent_mmr") {
            handleFilterChange("opponent_mmr", { min: 1200 });
        } else if (filterType === "duration_seconds") {
            handleFilterChange("duration_seconds", { max: 300 });
        }
    };

    const removeFilter = (filterKey) => {
        handleFilterChange(filterKey, null);
    };

    const availableFilters = FILTER_TYPES.filter(
        (f) => !Object.keys(filters).includes(f.value)
    );

    return (
        <Container>
            <Row>
                <FormGroup>
                    <Label>Type</Label>
                    <Select
                        value={condition.type || "counter"}
                        onChange={handleTypeChange}
                    >
                        {CONDITION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </Select>
                </FormGroup>

                <FormGroup>
                    <Label>Metric</Label>
                    <Select
                        value={condition.metric || "wins"}
                        onChange={handleMetricChange}
                    >
                        {METRICS.map((metric) => (
                            <option key={metric.value} value={metric.value}>
                                {metric.label}
                            </option>
                        ))}
                    </Select>
                </FormGroup>
            </Row>

            {/* Streak-specific fields */}
            {condition.type === "streak" && (
                <Row>
                    <FormGroup>
                        <Label>Streak Result</Label>
                        <Select
                            value={condition.streak_condition?.result || "win"}
                            onChange={(e) =>
                                handleStreakChange("result", e.target.value)
                            }
                        >
                            <option value="win">Win</option>
                            <option value="loss">Loss</option>
                        </Select>
                    </FormGroup>
                    <FormGroup>
                        <Label>Min Streak</Label>
                        <Input
                            type="number"
                            min="2"
                            value={condition.streak_condition?.min_streak || 3}
                            onChange={(e) =>
                                handleStreakChange("min_streak", e.target.value)
                            }
                        />
                    </FormGroup>
                </Row>
            )}

            {/* Filters Section */}
            <FilterSection>
                <FilterTitle>
                    <span>Filters (optional)</span>
                </FilterTitle>

                {/* Existing filters */}
                {Object.entries(filters).map(([key, value]) => (
                    <FilterRow key={key}>
                        {key === "gamemode" && (
                            <>
                                <Label style={{ minWidth: "8rem" }}>
                                    Gamemode:
                                </Label>
                                <Select
                                    value={value}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "gamemode",
                                            e.target.value
                                        )
                                    }
                                >
                                    {GAMEMODES.filter((g) => g.value).map(
                                        (g) => (
                                            <option
                                                key={g.value}
                                                value={g.value}
                                            >
                                                {g.label}
                                            </option>
                                        )
                                    )}
                                </Select>
                            </>
                        )}

                        {key === "result" && (
                            <>
                                <Label style={{ minWidth: "8rem" }}>
                                    Result:
                                </Label>
                                <Select
                                    value={value}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "result",
                                            e.target.value
                                        )
                                    }
                                >
                                    {RESULTS.filter((r) => r.value).map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </Select>
                            </>
                        )}

                        {key === "score_diff" && (
                            <>
                                <Label style={{ minWidth: "8rem" }}>
                                    Score Diff:
                                </Label>
                                <Label>Min:</Label>
                                <Input
                                    type="number"
                                    value={value.min || ""}
                                    onChange={(e) =>
                                        handleRangeFilterChange(
                                            "score_diff",
                                            "min",
                                            e.target.value
                                        )
                                    }
                                />
                                <Label>Max:</Label>
                                <Input
                                    type="number"
                                    value={value.max || ""}
                                    onChange={(e) =>
                                        handleRangeFilterChange(
                                            "score_diff",
                                            "max",
                                            e.target.value
                                        )
                                    }
                                />
                            </>
                        )}

                        {key === "opponent_mmr" && (
                            <>
                                <Label style={{ minWidth: "8rem" }}>
                                    Opponent MMR:
                                </Label>
                                <Label>Min:</Label>
                                <Input
                                    type="number"
                                    value={value.min || ""}
                                    onChange={(e) =>
                                        handleRangeFilterChange(
                                            "opponent_mmr",
                                            "min",
                                            e.target.value
                                        )
                                    }
                                />
                                <Label>Max:</Label>
                                <Input
                                    type="number"
                                    value={value.max || ""}
                                    onChange={(e) =>
                                        handleRangeFilterChange(
                                            "opponent_mmr",
                                            "max",
                                            e.target.value
                                        )
                                    }
                                />
                            </>
                        )}

                        {key === "duration_seconds" && (
                            <>
                                <Label style={{ minWidth: "8rem" }}>
                                    Duration (s):
                                </Label>
                                <Label>Min:</Label>
                                <Input
                                    type="number"
                                    value={value.min || ""}
                                    onChange={(e) =>
                                        handleRangeFilterChange(
                                            "duration_seconds",
                                            "min",
                                            e.target.value
                                        )
                                    }
                                />
                                <Label>Max:</Label>
                                <Input
                                    type="number"
                                    value={value.max || ""}
                                    onChange={(e) =>
                                        handleRangeFilterChange(
                                            "duration_seconds",
                                            "max",
                                            e.target.value
                                        )
                                    }
                                />
                            </>
                        )}

                        <IconButton
                            type="button"
                            className="delete"
                            onClick={() => removeFilter(key)}
                        >
                            <HiOutlineTrash />
                        </IconButton>
                    </FilterRow>
                ))}

                {/* Add filter buttons */}
                {availableFilters.length > 0 && (
                    <Row style={{ marginTop: "0.8rem" }}>
                        {availableFilters.map((filter) => (
                            <AddButton
                                key={filter.value}
                                type="button"
                                onClick={() => addFilter(filter.value)}
                            >
                                <HiOutlinePlus /> {filter.label}
                            </AddButton>
                        ))}
                    </Row>
                )}
            </FilterSection>
        </Container>
    );
}

export default ConditionBuilder;
