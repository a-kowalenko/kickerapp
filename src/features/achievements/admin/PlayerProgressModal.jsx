import styled from "styled-components";
import { useState } from "react";
import Button from "../../../ui/Button";
import {
    useCreateAdminPlayerProgress,
    useUpdateAdminPlayerProgress,
    useDeleteAdminPlayerProgress,
} from "./usePlayerAchievementsAdmin";
import { HiOutlineTrash, HiOutlinePencil, HiXMark } from "react-icons/hi2";

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    backdrop-filter: blur(2px);
`;

const Modal = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-lg);
    padding: 0;
    z-index: 1001;
    width: 90%;
    max-width: 55rem;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.6rem 2.4rem;
    border-bottom: 1px solid var(--secondary-border-color);
    background-color: var(--color-grey-50);
`;

const Title = styled.h2`
    font-size: 1.8rem;
    margin: 0;
    color: var(--primary-text-color);
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const TitleIcon = styled.span`
    font-size: 2.2rem;
`;

const HeaderActions = styled.div`
    display: flex;
    gap: 0.8rem;
    align-items: center;
`;

const IconButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.6rem;
    border-radius: var(--border-radius-sm);
    color: var(--secondary-text-color);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background-color: var(--color-grey-100);
        color: var(--primary-text-color);
    }

    &:hover.delete {
        background-color: var(--color-red-100);
        color: var(--color-red-700);
    }

    & svg {
        width: 2rem;
        height: 2rem;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ModalBody = styled.div`
    padding: 2.4rem;
    overflow-y: auto;
    flex: 1;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const FormSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
`;

const SectionTitle = styled.h3`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--color-grey-100);
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.6rem;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

const FormRow = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    &.full-width {
        grid-column: 1 / -1;
    }
`;

const Label = styled.label`
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--secondary-text-color);
    display: flex;
    align-items: center;
    gap: 0.4rem;

    .required {
        color: var(--color-red-500);
    }
`;

const Input = styled.input`
    padding: 1rem 1.2rem;
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.4rem;
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);
    transition: all 0.2s;

    &:hover:not(:disabled) {
        border-color: var(--color-grey-400);
    }

    &:focus {
        outline: none;
        border-color: var(--color-brand-500);
        box-shadow: 0 0 0 3px var(--color-brand-100);
    }

    &:disabled {
        background-color: var(--color-grey-100);
        cursor: not-allowed;
    }

    &::placeholder {
        color: var(--tertiary-text-color);
    }
`;

const Select = styled.select`
    padding: 1rem 1.2rem;
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.4rem;
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);
    transition: all 0.2s;
    cursor: pointer;

    &:hover:not(:disabled) {
        border-color: var(--color-grey-400);
    }

    &:focus {
        outline: none;
        border-color: var(--color-brand-500);
        box-shadow: 0 0 0 3px var(--color-brand-100);
    }

    &:disabled {
        background-color: var(--color-grey-100);
        cursor: not-allowed;
    }

    option {
        background-color: var(--dropdown-list-background-color);
        color: var(--primary-text-color);
    }
`;

const ViewField = styled.div`
    padding: 1rem 1.2rem;
    background-color: var(--color-grey-50);
    border: 1px solid var(--color-grey-200);
    border-radius: var(--border-radius-sm);
    font-size: 1.4rem;
    color: var(--primary-text-color);
    display: flex;
    align-items: center;
    gap: 0.6rem;
`;

const ModalFooter = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 1.2rem;
    padding: 1.6rem 2.4rem;
    border-top: 1px solid var(--secondary-border-color);
    background-color: var(--color-grey-50);
`;

const ProgressCard = styled.div`
    background: linear-gradient(
        135deg,
        ${(props) =>
                props.$complete
                    ? "var(--color-green-50)"
                    : "var(--primary-background-color)"}
            0%,
        var(--color-brand-900) 100%
    );

    border: 1px solid
        ${(props) =>
            props.$complete
                ? "var(--color-green-200)"
                : "var(--color-brand-100)"};
    border-radius: var(--border-radius-md);
    padding: 1.6rem;
`;

const ProgressHeader = styled.div`
    display: flex;
    gap: 1.2rem;
    align-items: flex-start;
    margin-bottom: 1.2rem;
`;

const ProgressIcon = styled.span`
    font-size: 2.4rem;
`;

const ProgressContent = styled.div`
    flex: 1;
`;

const ProgressTitle = styled.div`
    font-weight: 600;
    font-size: 1.5rem;
    color: var(--primary-text-color);
    margin-bottom: 0.4rem;
`;

const ProgressSubtitle = styled.div`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
`;

const ProgressBarContainer = styled.div`
    margin-top: 1.2rem;
`;

const ProgressBarWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
`;

const ProgressBar = styled.div`
    flex: 1;
    height: 1.2rem;
    background-color: var(--color-grey-200);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
`;

const ProgressFill = styled.div`
    height: 100%;
    background: ${(props) =>
        props.$percent >= 100
            ? "linear-gradient(90deg, var(--color-green-400), var(--color-green-500))"
            : "linear-gradient(90deg, var(--color-brand-400), var(--color-brand-500))"};
    width: ${(props) => Math.min(100, props.$percent)}%;
    transition: width 0.3s ease;
    border-radius: var(--border-radius-lg);
`;

const ProgressPercent = styled.span`
    font-size: 1.4rem;
    font-weight: 600;
    min-width: 5rem;
    text-align: right;
    color: ${(props) =>
        props.$percent >= 100
            ? "var(--color-green-600)"
            : "var(--color-brand-600)"};
`;

const ProgressStats = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 0.8rem;
    font-size: 1.2rem;
    color: var(--secondary-text-color);
`;

const Badge = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.8rem;
    font-size: 1.1rem;
    font-weight: 500;
    border-radius: var(--border-radius-sm);
    background-color: ${(props) =>
        props.$variant === "success"
            ? "var(--color-green-100)"
            : props.$variant === "info"
            ? "var(--color-brand-100)"
            : "var(--color-grey-100)"};
    color: ${(props) =>
        props.$variant === "success"
            ? "var(--color-green-700)"
            : props.$variant === "info"
            ? "var(--color-brand-700)"
            : "var(--color-grey-700)"};
`;

function PlayerProgressModal({
    item,
    viewMode,
    players,
    achievements,
    seasons,
    onClose,
}) {
    const { createPlayerProgress, isLoading: isCreating } =
        useCreateAdminPlayerProgress();
    const { updatePlayerProgress, isLoading: isUpdating } =
        useUpdateAdminPlayerProgress();
    const { deletePlayerProgress, isLoading: isDeleting } =
        useDeleteAdminPlayerProgress();

    const [isEditing, setIsEditing] = useState(!viewMode);

    const [formData, setFormData] = useState({
        playerId: item?.player_id || "",
        achievementId: item?.achievement_id || "",
        seasonId: item?.season_id || "",
        currentProgress: item?.current_progress || 0,
    });

    const isNew = !item;
    const isLoading = isCreating || isUpdating;

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = {
            playerId: parseInt(formData.playerId, 10),
            achievementId: parseInt(formData.achievementId, 10),
            seasonId: formData.seasonId
                ? parseInt(formData.seasonId, 10)
                : null,
            currentProgress: parseInt(formData.currentProgress, 10),
        };

        if (isNew) {
            createPlayerProgress(data, {
                onSuccess: onClose,
            });
        } else {
            updatePlayerProgress(
                { id: item.id, ...data },
                {
                    onSuccess: onClose,
                }
            );
        }
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this entry?")) {
            deletePlayerProgress(item.id, {
                onSuccess: onClose,
            });
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const selectedAchievement = achievements?.find(
        (a) => a.id === parseInt(formData.achievementId, 10)
    );
    const selectedPlayer = players?.find(
        (p) => p.id === parseInt(formData.playerId, 10)
    );
    const selectedSeason = seasons?.find(
        (s) => s.id === parseInt(formData.seasonId, 10)
    );

    const maxProgress = selectedAchievement?.max_progress || 1;
    const currentProgress = parseInt(formData.currentProgress, 10) || 0;
    const progressPercent = Math.round((currentProgress / maxProgress) * 100);
    const isComplete = progressPercent >= 100;

    return (
        <>
            <Overlay onClick={onClose} />
            <Modal onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <Title>
                        <TitleIcon>📊</TitleIcon>
                        {isNew
                            ? "New Progress Entry"
                            : isEditing
                            ? "Edit Progress"
                            : "Progress Details"}
                    </Title>
                    <HeaderActions>
                        {!isNew && !isEditing && (
                            <>
                                <IconButton onClick={handleEdit} title="Edit">
                                    <HiOutlinePencil />
                                </IconButton>
                                <IconButton
                                    className="delete"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    title="Delete"
                                >
                                    <HiOutlineTrash />
                                </IconButton>
                            </>
                        )}
                        <IconButton onClick={onClose} title="Close">
                            <HiXMark />
                        </IconButton>
                    </HeaderActions>
                </ModalHeader>

                <ModalBody>
                    <Form onSubmit={handleSubmit}>
                        {/* Progress Preview Card */}
                        {selectedAchievement && (
                            <ProgressCard $complete={isComplete}>
                                <ProgressHeader>
                                    <ProgressIcon>
                                        {selectedAchievement?.icon || "🏆"}
                                    </ProgressIcon>
                                    <ProgressContent>
                                        <ProgressTitle>
                                            {selectedAchievement?.name ||
                                                "Select Achievement"}
                                            {isComplete && (
                                                <Badge
                                                    $variant="success"
                                                    style={{
                                                        marginLeft: "0.8rem",
                                                    }}
                                                >
                                                    ✓ Complete
                                                </Badge>
                                            )}
                                        </ProgressTitle>
                                        <ProgressSubtitle>
                                            {selectedPlayer?.name || "Player"} •{" "}
                                            {selectedSeason?.name || "Global"}
                                        </ProgressSubtitle>
                                    </ProgressContent>
                                </ProgressHeader>

                                <ProgressBarContainer>
                                    <ProgressBarWrapper>
                                        <ProgressBar>
                                            <ProgressFill
                                                $percent={progressPercent}
                                            />
                                        </ProgressBar>
                                        <ProgressPercent
                                            $percent={progressPercent}
                                        >
                                            {progressPercent}%
                                        </ProgressPercent>
                                    </ProgressBarWrapper>
                                    <ProgressStats>
                                        <span>Current: {currentProgress}</span>
                                        <span>Target: {maxProgress}</span>
                                    </ProgressStats>
                                </ProgressBarContainer>
                            </ProgressCard>
                        )}

                        <FormSection>
                            <SectionTitle>Main Information</SectionTitle>
                            <FormGrid>
                                <FormRow>
                                    <Label>
                                        Player{" "}
                                        <span className="required">*</span>
                                    </Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.playerId}
                                            onChange={(e) =>
                                                handleChange(
                                                    "playerId",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            disabled={isLoading}
                                        >
                                            <option value="">
                                                Select player...
                                            </option>
                                            {players?.map((player) => (
                                                <option
                                                    key={player.id}
                                                    value={player.id}
                                                >
                                                    {player.name}
                                                </option>
                                            ))}
                                        </Select>
                                    ) : (
                                        <ViewField>
                                            {selectedPlayer?.name || "—"}
                                        </ViewField>
                                    )}
                                </FormRow>

                                <FormRow>
                                    <Label>
                                        Achievement{" "}
                                        <span className="required">*</span>
                                    </Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.achievementId}
                                            onChange={(e) =>
                                                handleChange(
                                                    "achievementId",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            disabled={isLoading}
                                        >
                                            <option value="">
                                                Select achievement...
                                            </option>
                                            {achievements?.map(
                                                (achievement) => (
                                                    <option
                                                        key={achievement.id}
                                                        value={achievement.id}
                                                    >
                                                        {achievement.icon ||
                                                            "🏆"}{" "}
                                                        {achievement.name}{" "}
                                                        (Target:{" "}
                                                        {
                                                            achievement.max_progress
                                                        }
                                                        )
                                                    </option>
                                                )
                                            )}
                                        </Select>
                                    ) : (
                                        <ViewField>
                                            {selectedAchievement?.icon || "🏆"}
                                            {selectedAchievement?.name || "—"}
                                        </ViewField>
                                    )}
                                </FormRow>

                                <FormRow>
                                    <Label>Season</Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.seasonId}
                                            onChange={(e) =>
                                                handleChange(
                                                    "seasonId",
                                                    e.target.value
                                                )
                                            }
                                            disabled={isLoading}
                                        >
                                            <option value="">
                                                Global (no season)
                                            </option>
                                            {seasons?.map((season) => (
                                                <option
                                                    key={season.id}
                                                    value={season.id}
                                                >
                                                    {season.name}
                                                </option>
                                            ))}
                                        </Select>
                                    ) : (
                                        <ViewField>
                                            {selectedSeason?.name || "Global"}
                                        </ViewField>
                                    )}
                                </FormRow>

                                <FormRow>
                                    <Label>
                                        Current Progress
                                        {selectedAchievement && (
                                            <span
                                                style={{
                                                    fontWeight: "normal",
                                                    color: "var(--tertiary-text-color)",
                                                }}
                                            >
                                                {" "}
                                                (max:{" "}
                                                {
                                                    selectedAchievement.max_progress
                                                }
                                                )
                                            </span>
                                        )}
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={formData.currentProgress}
                                            onChange={(e) =>
                                                handleChange(
                                                    "currentProgress",
                                                    e.target.value
                                                )
                                            }
                                            min="0"
                                            max={maxProgress}
                                            required
                                            disabled={isLoading}
                                        />
                                    ) : (
                                        <ViewField>
                                            {currentProgress} / {maxProgress}
                                        </ViewField>
                                    )}
                                </FormRow>
                            </FormGrid>
                        </FormSection>
                    </Form>
                </ModalBody>

                <ModalFooter>
                    <Button
                        type="button"
                        $variation="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {isEditing ? "Cancel" : "Close"}
                    </Button>
                    {isEditing && (
                        <Button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Saving..."
                                : isNew
                                ? "Create"
                                : "Save"}
                        </Button>
                    )}
                </ModalFooter>
            </Modal>
        </>
    );
}

export default PlayerProgressModal;
