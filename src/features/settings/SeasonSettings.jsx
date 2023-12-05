import styled from "styled-components";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import LoadingSpinner from "../../ui/LoadingSpinner";
import FormRow from "../../ui/FormRow";
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
import { addDays, addMonths, format } from "date-fns";
import { useUpdateSeason } from "./useUpdateSeason";
import { useCreateSeason } from "./useCreateSeason";
import Input from "../../ui/Input";
import { useDeleteSeason } from "./useDeleteSeason";

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
    const { createNewSeason, isCreatingNewSeason } = useCreateSeason();
    const { updateSeasonConfig, isUpdatingSeasonConfig } =
        useUpdateSeasonConfig();
    const { updateSeason, isUpdatingSeason } = useUpdateSeason();
    const { cancelSeason, isCancelingSeason } = useDeleteSeason();
    const [startDate, setStartDate] = useState(new Date());
    const [seasonName, setSeasonName] = useState("");

    useEffect(() => {
        if (currentSeason) {
            setStartDate(new Date(currentSeason.start_date));
        }
    }, [currentSeason]);

    if (isLoadingKickerData) {
        return <LoadingSpinner />;
    }

    const seasonData = kickerData.season_config;
    const { frequency, season_mode, auto_renew } = seasonData;

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
        if (season_mode && currentSeason) {
            if (
                !confirm(
                    "Turning off season mode will cancel the currently pending season. Do you want to proceed?"
                )
            ) {
                return;
            }
        }
        const newSeasonData = {
            season_mode: !season_mode,
        };
        updateSeasonConfig(newSeasonData);
    }

    function handleSwitchAutoRenew() {
        const newSeasonData = {
            auto_renew: !auto_renew,
        };
        updateSeasonConfig(newSeasonData);
    }

    function handleSelectSeasonLength(option) {
        const newSeasonData = {
            frequency: option,
        };
        updateSeasonConfig(newSeasonData);
    }

    function handleCreateSeason(e) {
        e.preventDefault();
        const seasonData = {
            start_date: startDate,
            name: seasonName,
        };

        createNewSeason(seasonData);
    }

    function handleCancelSeason(e) {
        e.preventDefault();
        if (
            confirm(
                "Do you really want to cancel this season? The data will be lost."
            )
        ) {
            cancelSeason();
        }
    }

    const isLoading =
        isLoadingKickerData || isUpdatingSeasonConfig || isLoadingCurrentSeason;
    return (
        <StyledSeasonSettings>
            <FormRow>
                <Label>Season Mode</Label>
                <SwitchButton
                    value={season_mode}
                    label={season_mode ? "On" : "Off"}
                    onChange={handleSwitchSeasonMode}
                ></SwitchButton>
            </FormRow>
            {season_mode && (
                <>
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
                            <FormRow label="Start Date" fill={true}>
                                {currentSeason.status === "pending" ? (
                                    <DatePicker
                                        selected={
                                            new Date(currentSeason.start_date)
                                        }
                                        onChange={(date) =>
                                            updateSeason({
                                                start_date: date,
                                                id: currentSeason.id,
                                            })
                                        }
                                        minDate={
                                            new Date(currentSeason.start_date)
                                        }
                                        disabled={isUpdatingSeason}
                                    />
                                ) : (
                                    format(
                                        new Date(currentSeason.start_date),
                                        "dd.MM.yyyy"
                                    )
                                )}
                            </FormRow>
                            <FormRow label="End Date" fill={true}>
                                {currentSeason.status === "pending" ? (
                                    <DatePicker
                                        selected={
                                            new Date(currentSeason.end_date)
                                        }
                                        onChange={(date) =>
                                            updateSeason({
                                                end_date: date,
                                                id: currentSeason.id,
                                            })
                                        }
                                        minDate={
                                            new Date(currentSeason.start_date)
                                        }
                                        disabled={isUpdatingSeason}
                                    />
                                ) : (
                                    format(
                                        new Date(currentSeason.end_date),
                                        "dd.MM.yyyy"
                                    )
                                )}
                            </FormRow>

                            {currentSeason && (
                                <FormRow>
                                    <Button
                                        $variation="danger"
                                        $size="large"
                                        onClick={handleCancelSeason}
                                        disabled={isCancelingSeason}
                                    >
                                        {isCancelingSeason ? (
                                            <SpinnerMini />
                                        ) : (
                                            "Cancel Season"
                                        )}
                                    </Button>
                                </FormRow>
                            )}
                        </Form>
                    )}
                    <Form>
                        <FormRow>
                            <Label>Auto-Renew</Label>
                            <SwitchButton
                                value={auto_renew}
                                label={auto_renew ? "On" : "Off"}
                                onChange={handleSwitchAutoRenew}
                            ></SwitchButton>
                        </FormRow>

                        <FormRow label="Season Length">
                            <Dropdown
                                options={seasonLengthOptions}
                                onSelect={handleSelectSeasonLength}
                                initSelected={seasonLengthOptions.find(
                                    (option) => option.value === frequency
                                )}
                                isLoading={isLoading}
                            />
                        </FormRow>
                        {currentSeason && auto_renew && (
                            <FormRow label="Next season">
                                {format(
                                    new Date(currentSeason.end_date).setDate(
                                        new Date(
                                            currentSeason.end_date
                                        ).getDate() + 1
                                    ),
                                    "dd.MM.yyyy"
                                )}{" "}
                                &mdash;{" "}
                                {format(
                                    addDays(
                                        addMonths(
                                            new Date(
                                                currentSeason.end_date
                                            ).setDate(
                                                new Date(
                                                    currentSeason.end_date
                                                ).getDate() + 1
                                            ),
                                            frequency === "monthly"
                                                ? 1
                                                : frequency === "quarterly"
                                                ? 3
                                                : frequency === "halfYearly"
                                                ? 6
                                                : frequency === "yearly"
                                                ? 12
                                                : 3
                                        ),
                                        -1
                                    ),
                                    "dd.MM.yyyy"
                                )}
                            </FormRow>
                        )}
                        {!currentSeason && (
                            <>
                                <FormRow label="Start day" fill={true}>
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date) => setStartDate(date)}
                                        minDate={startDate}
                                    />
                                </FormRow>
                                <FormRow label="Season Name">
                                    <Input
                                        value={seasonName}
                                        onChange={(e) =>
                                            setSeasonName(e.target.value)
                                        }
                                    />
                                </FormRow>
                                <FormRow>
                                    <Button
                                        $size="large"
                                        $variation="primary"
                                        disabled={isLoading}
                                        onClick={handleCreateSeason}
                                    >
                                        {isCreatingNewSeason ? (
                                            <SpinnerMini />
                                        ) : (
                                            "Create Season"
                                        )}
                                    </Button>
                                </FormRow>
                            </>
                        )}
                    </Form>
                </>
            )}
        </StyledSeasonSettings>
    );
}

export default SeasonSettings;
