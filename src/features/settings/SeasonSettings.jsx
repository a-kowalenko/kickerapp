import styled from "styled-components";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { useForm } from "react-hook-form";
import FormRow from "../../ui/FormRow";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import SpinnerMini from "../../ui/SpinnerMini";
import { useUpdateSeasonConfig } from "./useUpdateSeasonConfig";
import Form from "../../ui/Form";
import Dropdown from "../../ui/Dropdown";
import { useEffect, useState } from "react";
import DatePicker from "../../ui/DatePicker";
import Label from "../../ui/Label";
import SwitchButton from "../../ui/SwitchButton";
import { useCurrentSeason } from "../../hooks/useCurrentSeason";
import { format, subDays } from "date-fns";
import { useUpdateSeason } from "./useUpdateSeason";

const StyledSeasonSettings = styled.div`
    display: flex;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;
`;

function SeasonSettings() {
    const { data: kickerData, isLoading: isLoadingKickerData } =
        useKickerInfo();
    const { currentSeason, isLoadingCurrentSeason } = useCurrentSeason();
    const { updateSeasonConfig, isUpdatingSeasonConfig } =
        useUpdateSeasonConfig();
    const { updateSeason, isUpdatingSeason } = useUpdateSeason();
    const [startDate, setStartDate] = useState(null);

    const [seasonLength, setSeasonLength] = useState("quarterly");

    useEffect(() => {
        if (currentSeason) {
            setStartDate(new Date(currentSeason.start_date));
        }
    }, [currentSeason]);

    if (isLoadingKickerData) {
        return <LoadingSpinner />;
    }

    const seasonData = kickerData.season_config;
    const { frequency, season_mode } = seasonData;

    const seasonLengthOptions = [
        { text: "Monthly", value: "monthly" },
        { text: "Quarterly", value: "quarterly" },
        { text: "Half Yearly", value: "halfYearly" },
        { text: "Yearly", value: "yearly" },
    ];

    const startDayOptions = [...Array(28).keys()].map((_, i) => ({
        text: i + 1,
        value: i + 1,
    }));

    function handleSwitchSeasonMode() {
        const newSeasonData = {
            season_mode: !season_mode,
        };
        updateSeasonConfig(newSeasonData);
    }

    function handleSelectStartDate(option) {
        const newSeasonData = {
            season_mode: !season_mode,
        };
        updateSeasonConfig(newSeasonData);
    }

    const isLoading =
        isLoadingKickerData || isUpdatingSeasonConfig || isLoadingCurrentSeason;
    return (
        <StyledSeasonSettings>
            {currentSeason && (
                <Form>
                    <FormRow label="Season">
                        <span>
                            Nr: {currentSeason.nr}{" "}
                            {currentSeason.name
                                ? `(${currentSeason.name})`
                                : null}
                        </span>
                    </FormRow>
                    <FormRow label="Status">
                        <i>{currentSeason.status}</i>
                    </FormRow>
                    <FormRow label="Start Date">
                        {currentSeason.status === "pending" ? (
                            <DatePicker
                                selected={new Date(currentSeason.start_date)}
                                onChange={(date) =>
                                    updateSeason({
                                        start_date: date,
                                        id: currentSeason.id,
                                    })
                                }
                                minDate={new Date(currentSeason.start_date)}
                            />
                        ) : (
                            format(
                                new Date(currentSeason.start_date),
                                "dd.MM.yyyy"
                            )
                        )}
                    </FormRow>
                    <FormRow label="End Date">
                        {currentSeason.status === "pending" ? (
                            <DatePicker
                                selected={new Date(currentSeason.end_date)}
                                onChange={(date) =>
                                    updateSeason({
                                        end_date: date,
                                        id: currentSeason.id,
                                    })
                                }
                                minDate={new Date(currentSeason.start_date)}
                            />
                        ) : (
                            format(
                                new Date(currentSeason.end_date),
                                "dd.MM.yyyy"
                            )
                        )}
                    </FormRow>
                    {season_mode && (
                        <FormRow label="Next season start">
                            {format(
                                new Date(currentSeason.end_date).setDate(
                                    new Date(currentSeason.end_date).getDate() +
                                        1
                                ),
                                "dd.MM.yyyy"
                            )}
                        </FormRow>
                    )}
                    {currentSeason && (
                        <FormRow>
                            <Button
                                $size="large"
                                $variation="primary"
                                disabled={isLoading}
                            >
                                {isLoading ? <SpinnerMini /> : "Update"}
                            </Button>
                            <Button $variation="danger" $size="large">
                                Cancel Season
                            </Button>
                        </FormRow>
                    )}
                </Form>
            )}

            <Form>
                <FormRow>
                    <Label>Auto-Renew</Label>
                    <SwitchButton
                        value={season_mode}
                        label={season_mode ? "On" : "Off"}
                        onChange={handleSwitchSeasonMode}
                    ></SwitchButton>
                </FormRow>
                {season_mode && (
                    <>
                        <FormRow label="Season Length">
                            <Dropdown
                                options={seasonLengthOptions}
                                onSelect={(option) => setSeasonLength(option)}
                                initSelected={seasonLengthOptions.find(
                                    (option) => option.value === seasonLength
                                )}
                            />
                        </FormRow>
                        {!currentSeason && (
                            <FormRow label="Start day">
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    minDate={startDate}
                                />
                            </FormRow>
                        )}

                        <FormRow>
                            <Button
                                $size="large"
                                $variation="primary"
                                disabled={isLoading}
                            >
                                {isLoading ? <SpinnerMini /> : "Update"}
                            </Button>
                        </FormRow>
                    </>
                )}
            </Form>
        </StyledSeasonSettings>
    );
}

export default SeasonSettings;
