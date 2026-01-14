import styled from "styled-components";
import { useState } from "react";
import Button from "../../../ui/Button";
import {
    useCreateAdminTeamStatus,
    useUpdateAdminTeamStatus,
    useDeleteAdminTeamStatus,
} from "./useStatusAdmin";
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
            : props.$variant === "warning"
            ? "var(--color-yellow-100)"
            : props.$variant === "info"
            ? "var(--color-brand-100)"
            : props.$variant === "bounty"
            ? "var(--color-purple-100)"
            : "var(--color-grey-100)"};
    color: ${(props) =>
        props.$variant === "success"
            ? "var(--color-green-700)"
            : props.$variant === "warning"
            ? "var(--color-yellow-700)"
            : props.$variant === "info"
            ? "var(--color-brand-700)"
            : props.$variant === "bounty"
            ? "var(--color-purple-700)"
            : "var(--color-grey-700)"};
`;

const TagInput = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    padding: 0.8rem;
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    background-color: var(--primary-input-background-color);
    min-height: 4.4rem;
    align-items: center;

    &:focus-within {
        border-color: var(--color-brand-500);
        box-shadow: 0 0 0 3px var(--color-brand-100);
    }
`;

const Tag = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    background-color: var(--color-yellow-100);
    color: var(--color-yellow-700);
    border-radius: var(--border-radius-sm);
    font-size: 1.2rem;

    button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        color: var(--color-yellow-700);
        display: flex;
        align-items: center;

        &:hover {
            color: var(--color-red-500);
        }
    }
`;

const TagInputField = styled.input`
    border: none;
    outline: none;
    background: transparent;
    flex: 1;
    min-width: 10rem;
    font-size: 1.4rem;
    color: var(--primary-text-color);

    &::placeholder {
        color: var(--tertiary-text-color);
    }
`;

const StatusesList = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
`;

/* ----------------------------------------
   Helper function to get team display name
----------------------------------------- */
function getTeamDisplayName(team) {
    if (!team) return "Unknown Team";

    // Handle both flat structure from RPC and nested structure
    const player1Name = team.player1_name || team.player1?.name;
    const player2Name = team.player2_name || team.player2?.name;

    if (player1Name && player2Name) {
        return `${player1Name} & ${player2Name}`;
    }

    return team.name || `Team #${team.id}`;
}

function TeamStatusModal({ item, viewMode, teams, onClose }) {
    const { createTeamStatus, isLoading: isCreating } =
        useCreateAdminTeamStatus();
    const { updateTeamStatus, isLoading: isUpdating } =
        useUpdateAdminTeamStatus();
    const { deleteTeamStatus, isLoading: isDeleting } =
        useDeleteAdminTeamStatus();

    const [isEditing, setIsEditing] = useState(!viewMode);
    const [statusInput, setStatusInput] = useState("");

    const [formData, setFormData] = useState({
        teamId: item?.team_id || "",
        currentStreak: item?.current_streak || 0,
        currentBounty: item?.current_bounty || 0,
        activeStatuses: item?.active_statuses || [],
        lastMatchId: item?.last_match_id || "",
    });

    const isNew = !item;
    const isLoading = isCreating || isUpdating;

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddStatus = (e) => {
        if (e.key === "Enter" && statusInput.trim()) {
            e.preventDefault();
            if (!formData.activeStatuses.includes(statusInput.trim())) {
                setFormData((prev) => ({
                    ...prev,
                    activeStatuses: [
                        ...prev.activeStatuses,
                        statusInput.trim(),
                    ],
                }));
            }
            setStatusInput("");
        }
    };

    const handleRemoveStatus = (statusToRemove) => {
        setFormData((prev) => ({
            ...prev,
            activeStatuses: prev.activeStatuses.filter(
                (status) => status !== statusToRemove
            ),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = {
            teamId: parseInt(formData.teamId, 10),
            currentStreak: parseInt(formData.currentStreak, 10),
            currentBounty: parseInt(formData.currentBounty, 10),
            activeStatuses: formData.activeStatuses,
            lastMatchId: formData.lastMatchId
                ? parseInt(formData.lastMatchId, 10)
                : null,
        };

        if (isNew) {
            createTeamStatus(data, {
                onSuccess: onClose,
            });
        } else {
            updateTeamStatus(
                { id: item.id, ...data },
                {
                    onSuccess: onClose,
                }
            );
        }
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this entry?")) {
            deleteTeamStatus(item.id, {
                onSuccess: onClose,
            });
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const selectedTeam = teams?.find(
        (t) => t.id === parseInt(formData.teamId, 10)
    );

    return (
        <>
            <Overlay onClick={onClose} />
            <Modal onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <Title>
                        <TitleIcon>👥</TitleIcon>
                        {isNew
                            ? "New Team Status"
                            : isEditing
                            ? "Edit Team Status"
                            : "Team Status Details"}
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
                        {/* Team Preview Card */}
                        {selectedTeam && (
                            <InfoCard>
                                <InfoIcon>👥</InfoIcon>
                                <InfoContent>
                                    <InfoTitle>
                                        {getTeamDisplayName(selectedTeam)}
                                    </InfoTitle>
                                    <InfoSubtitle>
                                        {formData.currentStreak !== 0 && (
                                            <Badge
                                                $variant={
                                                    formData.currentStreak > 0
                                                        ? "success"
                                                        : "warning"
                                                }
                                            >
                                                Streak:{" "}
                                                {formData.currentStreak > 0
                                                    ? `+${formData.currentStreak}`
                                                    : formData.currentStreak}
                                            </Badge>
                                        )}
                                        {formData.currentBounty > 0 && (
                                            <Badge
                                                $variant="bounty"
                                                style={{ marginLeft: "0.8rem" }}
                                            >
                                                Bounty: {formData.currentBounty}{" "}
                                                pts
                                            </Badge>
                                        )}
                                    </InfoSubtitle>
                                </InfoContent>
                            </InfoCard>
                        )}

                        <FormSection>
                            <SectionTitle>Main Information</SectionTitle>
                            <FormGrid>
                                <FormRow className="full-width">
                                    <Label>
                                        Team <span className="required">*</span>
                                    </Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.teamId}
                                            onChange={(e) =>
                                                handleChange(
                                                    "teamId",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            disabled={isLoading}
                                        >
                                            <option value="">
                                                Select team...
                                            </option>
                                            {teams?.map((team) => (
                                                <option
                                                    key={team.id}
                                                    value={team.id}
                                                >
                                                    {getTeamDisplayName(team)}
                                                </option>
                                            ))}
                                        </Select>
                                    ) : (
                                        <ViewField>
                                            {getTeamDisplayName(selectedTeam)}
                                        </ViewField>
                                    )}
                                </FormRow>
                            </FormGrid>
                        </FormSection>

                        <FormSection>
                            <SectionTitle>Status Values</SectionTitle>
                            <FormGrid>
                                <FormRow>
                                    <Label>Current Streak</Label>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={formData.currentStreak}
                                            onChange={(e) =>
                                                handleChange(
                                                    "currentStreak",
                                                    e.target.value
                                                )
                                            }
                                            disabled={isLoading}
                                        />
                                    ) : (
                                        <ViewField>
                                            {formData.currentStreak > 0
                                                ? `+${formData.currentStreak}`
                                                : formData.currentStreak}
                                        </ViewField>
                                    )}
                                </FormRow>

                                <FormRow>
                                    <Label>Current Bounty</Label>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={formData.currentBounty}
                                            onChange={(e) =>
                                                handleChange(
                                                    "currentBounty",
                                                    e.target.value
                                                )
                                            }
                                            min="0"
                                            disabled={isLoading}
                                        />
                                    ) : (
                                        <ViewField>
                                            {formData.currentBounty > 0
                                                ? `${formData.currentBounty} pts`
                                                : "—"}
                                        </ViewField>
                                    )}
                                </FormRow>

                                <FormRow>
                                    <Label>Last Match ID</Label>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={formData.lastMatchId}
                                            onChange={(e) =>
                                                handleChange(
                                                    "lastMatchId",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Optional"
                                            disabled={isLoading}
                                        />
                                    ) : (
                                        <ViewField>
                                            {formData.lastMatchId
                                                ? `#${formData.lastMatchId}`
                                                : "—"}
                                        </ViewField>
                                    )}
                                </FormRow>
                            </FormGrid>
                        </FormSection>

                        <FormSection>
                            <SectionTitle>Active Statuses</SectionTitle>
                            <FormRow className="full-width">
                                <Label>
                                    Statuses{" "}
                                    <span
                                        style={{
                                            fontSize: "1.1rem",
                                            fontWeight: "normal",
                                        }}
                                    >
                                        (press Enter to add)
                                    </span>
                                </Label>
                                {isEditing ? (
                                    <TagInput>
                                        {formData.activeStatuses.map(
                                            (status, idx) => (
                                                <Tag key={idx}>
                                                    {status}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveStatus(
                                                                status
                                                            )
                                                        }
                                                    >
                                                        <HiXMark />
                                                    </button>
                                                </Tag>
                                            )
                                        )}
                                        <TagInputField
                                            type="text"
                                            value={statusInput}
                                            onChange={(e) =>
                                                setStatusInput(e.target.value)
                                            }
                                            onKeyDown={handleAddStatus}
                                            placeholder="Type status and press Enter..."
                                            disabled={isLoading}
                                        />
                                    </TagInput>
                                ) : (
                                    <ViewField>
                                        {formData.activeStatuses.length > 0 ? (
                                            <StatusesList>
                                                {formData.activeStatuses.map(
                                                    (status, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            $variant="warning"
                                                        >
                                                            {status}
                                                        </Badge>
                                                    )
                                                )}
                                            </StatusesList>
                                        ) : (
                                            "No active statuses"
                                        )}
                                    </ViewField>
                                )}
                            </FormRow>
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

export default TeamStatusModal;
