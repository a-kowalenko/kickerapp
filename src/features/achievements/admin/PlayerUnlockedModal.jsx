import styled from "styled-components";
import { useState } from "react";
import Button from "../../../ui/Button";
import {
    useCreateAdminPlayerAchievement,
    useUpdateAdminPlayerAchievement,
    useDeleteAdminPlayerAchievement,
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

const InfoCard = styled.div`
    background: linear-gradient(
        135deg,
        var(--primary-background-color) 0%,
        var(--color-brand-900) 100%
    );
    border: 1px solid var(--color-brand-100);
    border-radius: var(--border-radius-md);
    padding: 1.6rem;
    display: flex;
    gap: 1.2rem;
    align-items: flex-start;
`;

const InfoIcon = styled.span`
    font-size: 2.4rem;
`;

const InfoContent = styled.div`
    flex: 1;
`;

const InfoTitle = styled.div`
    font-weight: 600;
    font-size: 1.5rem;
    color: var(--primary-text-color);
    margin-bottom: 0.4rem;
`;

const InfoSubtitle = styled.div`
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

function PlayerUnlockedModal({
    item,
    viewMode,
    players,
    achievements,
    seasons,
    onClose,
}) {
    const { createPlayerAchievement, isLoading: isCreating } =
        useCreateAdminPlayerAchievement();
    const { updatePlayerAchievement, isLoading: isUpdating } =
        useUpdateAdminPlayerAchievement();
    const { deletePlayerAchievement, isLoading: isDeleting } =
        useDeleteAdminPlayerAchievement();

    const [isEditing, setIsEditing] = useState(!viewMode);

    const [formData, setFormData] = useState({
        playerId: item?.player_id || "",
        achievementId: item?.achievement_id || "",
        seasonId: item?.season_id || "",
        matchId: item?.match_id || "",
        timesCompleted: item?.times_completed || 1,
        unlockedAt: item?.unlocked_at
            ? new Date(item.unlocked_at).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
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
            matchId: formData.matchId ? parseInt(formData.matchId, 10) : null,
            timesCompleted: parseInt(formData.timesCompleted, 10),
            unlockedAt: new Date(formData.unlockedAt).toISOString(),
        };

        if (isNew) {
            createPlayerAchievement(data, {
                onSuccess: onClose,
            });
        } else {
            updatePlayerAchievement(
                { id: item.id, ...data },
                {
                    onSuccess: onClose,
                }
            );
        }
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this entry?")) {
            deletePlayerAchievement(item.id, {
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

    return (
        <>
            <Overlay onClick={onClose} />
            <Modal onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <Title>
                        <TitleIcon>🏆</TitleIcon>
                        {isNew
                            ? "New Entry"
                            : isEditing
                            ? "Edit Entry"
                            : "Achievement Details"}
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
                        {/* Achievement Preview Card */}
                        {(selectedAchievement || selectedPlayer) && (
                            <InfoCard>
                                <InfoIcon>
                                    {selectedAchievement?.icon || "🏆"}
                                </InfoIcon>
                                <InfoContent>
                                    <InfoTitle>
                                        {selectedAchievement?.name ||
                                            "Select Achievement"}
                                    </InfoTitle>
                                    <InfoSubtitle>
                                        {selectedPlayer?.name || "Player"} •{" "}
                                        {selectedSeason?.name || "Global"} •{" "}
                                        {formData.timesCompleted}x unlocked
                                        {selectedAchievement?.points && (
                                            <Badge
                                                $variant="info"
                                                style={{ marginLeft: "0.8rem" }}
                                            >
                                                +{selectedAchievement.points}{" "}
                                                points
                                            </Badge>
                                        )}
                                    </InfoSubtitle>
                                </InfoContent>
                            </InfoCard>
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
                                                        {achievement.name}
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
                                    <Label>Match ID</Label>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={formData.matchId}
                                            onChange={(e) =>
                                                handleChange(
                                                    "matchId",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Optional"
                                            disabled={isLoading}
                                        />
                                    ) : (
                                        <ViewField>
                                            {formData.matchId
                                                ? `#${formData.matchId}`
                                                : "—"}
                                        </ViewField>
                                    )}
                                </FormRow>
                            </FormGrid>
                        </FormSection>

                        <FormSection>
                            <SectionTitle>Details</SectionTitle>
                            <FormGrid>
                                <FormRow>
                                    <Label>Times Completed</Label>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={formData.timesCompleted}
                                            onChange={(e) =>
                                                handleChange(
                                                    "timesCompleted",
                                                    e.target.value
                                                )
                                            }
                                            min="1"
                                            required
                                            disabled={isLoading}
                                        />
                                    ) : (
                                        <ViewField>
                                            <Badge $variant="success">
                                                {formData.timesCompleted}x
                                            </Badge>
                                        </ViewField>
                                    )}
                                </FormRow>

                                <FormRow>
                                    <Label>Unlocked At</Label>
                                    {isEditing ? (
                                        <Input
                                            type="datetime-local"
                                            value={formData.unlockedAt}
                                            onChange={(e) =>
                                                handleChange(
                                                    "unlockedAt",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            disabled={isLoading}
                                        />
                                    ) : (
                                        <ViewField>
                                            {new Date(
                                                formData.unlockedAt
                                            ).toLocaleString("en-US")}
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

export default PlayerUnlockedModal;
