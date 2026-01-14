import styled from "styled-components";
import { useState, useEffect } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import Button from "../../ui/Button";
import {
    useCreateAdminTeamRanking,
    useUpdateAdminTeamRanking,
} from "./useRankingsAdmin";
import { media } from "../../utils/constants";

/* ----------------------------------------
   Styled Components
----------------------------------------- */

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 2rem;
`;

const Modal = styled.div`
    background-color: var(--color-grey-0);
    border-radius: var(--border-radius-lg);
    padding: 2.4rem;
    max-width: 50rem;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;

    ${media.mobile} {
        padding: 1.6rem;
        max-height: 95vh;
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
`;

const ModalTitle = styled.h2`
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.4rem;
    color: var(--secondary-text-color);

    &:hover {
        color: var(--primary-text-color);
    }

    & svg {
        width: 2.4rem;
        height: 2.4rem;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const FormSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const SectionLabel = styled.h3`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    margin: 0;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--color-grey-200);
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 1.6rem;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
`;

const Label = styled.label`
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--secondary-text-color);
`;

const Input = styled.input`
    padding: 0.8rem 1.2rem;
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.4rem;
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);

    &:focus {
        outline: none;
        border-color: var(--primary-input-border-color-active);
    }

    &:disabled {
        background-color: var(--color-grey-100);
        cursor: not-allowed;
    }
`;

const Select = styled.select`
    padding: 0.8rem 1.2rem;
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.4rem;
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);

    &:focus {
        outline: none;
        border-color: var(--primary-input-border-color-active);
    }

    option {
        background-color: var(--dropdown-list-background-color);
        color: var(--primary-text-color);
    }
`;

const ButtonRow = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 1.2rem;
    margin-top: 1rem;
`;

const ErrorText = styled.span`
    color: var(--color-red-700);
    font-size: 1.2rem;
`;

/* ----------------------------------------
   Main Component
----------------------------------------- */

function TeamRankingsModal({ ranking, onClose, teams, seasons }) {
    const { createTeamRanking, isLoading: isCreating } =
        useCreateAdminTeamRanking();
    const { updateTeamRanking, isLoading: isUpdating } =
        useUpdateAdminTeamRanking();

    const isEditing = !!ranking;

    const [formData, setFormData] = useState({
        teamId: "",
        seasonId: "",
        wins: 0,
        losses: 0,
        mmr: 1000,
        bountyClaimed: 0,
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (ranking) {
            setFormData({
                teamId: ranking.team_id || "",
                seasonId: ranking.season_id || "",
                wins: ranking.wins || 0,
                losses: ranking.losses || 0,
                mmr: ranking.mmr || 1000,
                bountyClaimed: ranking.bounty_claimed || 0,
            });
        }
    }, [ranking]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? parseInt(value) || 0 : value,
        }));
        // Clear error when field is changed
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.teamId) {
            newErrors.teamId = "Team is required";
        }
        if (!formData.seasonId) {
            newErrors.seasonId = "Season is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validate()) return;

        const data = {
            teamId: parseInt(formData.teamId),
            seasonId: parseInt(formData.seasonId),
            wins: formData.wins,
            losses: formData.losses,
            mmr: formData.mmr,
            bountyClaimed: formData.bountyClaimed,
        };

        if (isEditing) {
            updateTeamRanking(
                { id: ranking.id, ...data },
                { onSuccess: () => onClose() }
            );
        } else {
            createTeamRanking(data, { onSuccess: () => onClose() });
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>
                        {isEditing
                            ? "Edit Team Ranking"
                            : "Create Team Ranking"}
                    </ModalTitle>
                    <CloseButton onClick={onClose}>
                        <HiOutlineXMark />
                    </CloseButton>
                </ModalHeader>

                <Form onSubmit={handleSubmit}>
                    {/* Basic Info */}
                    <FormSection>
                        <SectionLabel>Basic Information</SectionLabel>
                        <FormRow>
                            <FormGroup>
                                <Label>Team *</Label>
                                <Select
                                    name="teamId"
                                    value={formData.teamId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Team</option>
                                    {teams?.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </Select>
                                {errors.teamId && (
                                    <ErrorText>{errors.teamId}</ErrorText>
                                )}
                            </FormGroup>
                            <FormGroup>
                                <Label>Season *</Label>
                                <Select
                                    name="seasonId"
                                    value={formData.seasonId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Season</option>
                                    {seasons?.map((season) => (
                                        <option
                                            key={season.id}
                                            value={season.id}
                                        >
                                            {season.name ||
                                                `Season ${season.season_number}`}
                                            {season.is_active
                                                ? " (Active)"
                                                : ""}
                                        </option>
                                    ))}
                                </Select>
                                {errors.seasonId && (
                                    <ErrorText>{errors.seasonId}</ErrorText>
                                )}
                            </FormGroup>
                        </FormRow>
                    </FormSection>

                    {/* Stats */}
                    <FormSection>
                        <SectionLabel>Statistics</SectionLabel>
                        <FormRow>
                            <FormGroup>
                                <Label>Wins</Label>
                                <Input
                                    type="number"
                                    name="wins"
                                    value={formData.wins}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>Losses</Label>
                                <Input
                                    type="number"
                                    name="losses"
                                    value={formData.losses}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>MMR</Label>
                                <Input
                                    type="number"
                                    name="mmr"
                                    value={formData.mmr}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>Bounty Claimed</Label>
                                <Input
                                    type="number"
                                    name="bountyClaimed"
                                    value={formData.bountyClaimed}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </FormGroup>
                        </FormRow>
                    </FormSection>

                    <ButtonRow>
                        <Button
                            type="button"
                            $variation="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? "Saving..."
                                : isEditing
                                ? "Save Changes"
                                : "Create"}
                        </Button>
                    </ButtonRow>
                </Form>
            </Modal>
        </Overlay>
    );
}

export default TeamRankingsModal;
