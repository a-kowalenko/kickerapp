import styled from "styled-components";
import { useState, useEffect } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import Button from "../../ui/Button";
import { useUpdateAdminMatch } from "./useMatchesAdmin";
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
    max-width: 70rem;
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
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
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

    &:disabled {
        background-color: var(--color-grey-100);
        cursor: not-allowed;
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

const InfoText = styled.p`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    margin: 0;
`;

/* ----------------------------------------
   Main Component
----------------------------------------- */

function MatchModal({ match, isViewMode, onClose, players, seasons }) {
    const { updateMatch, isLoading: isUpdating } = useUpdateAdminMatch();

    const [formData, setFormData] = useState({
        player1: "",
        player2: "",
        player3: "",
        player4: "",
        scoreTeam1: 0,
        scoreTeam2: 0,
        status: "active",
        gamemode: "1on1",
        seasonId: "",
        mmrChangeTeam1: 0,
        mmrChangeTeam2: 0,
        mmrPlayer1: 0,
        mmrPlayer2: 0,
        mmrPlayer3: 0,
        mmrPlayer4: 0,
        bountyTeam1: 0,
        bountyTeam2: 0,
    });

    useEffect(() => {
        if (match) {
            setFormData({
                player1: match.player1 || "",
                player2: match.player2 || "",
                player3: match.player3 || "",
                player4: match.player4 || "",
                scoreTeam1: match.scoreTeam1 || 0,
                scoreTeam2: match.scoreTeam2 || 0,
                status: match.status || "active",
                gamemode: match.gamemode || "1on1",
                seasonId: match.season_id || "",
                mmrChangeTeam1: match.mmrChangeTeam1 || 0,
                mmrChangeTeam2: match.mmrChangeTeam2 || 0,
                mmrPlayer1: match.mmrPlayer1 || 0,
                mmrPlayer2: match.mmrPlayer2 || 0,
                mmrPlayer3: match.mmrPlayer3 || 0,
                mmrPlayer4: match.mmrPlayer4 || 0,
                bountyTeam1: match.bounty_team1 || 0,
                bountyTeam2: match.bounty_team2 || 0,
            });
        }
    }, [match]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? parseInt(value) || 0 : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isViewMode) return;

        updateMatch(
            {
                id: match.id,
                player1: parseInt(formData.player1) || null,
                player2: parseInt(formData.player2) || null,
                player3: parseInt(formData.player3) || null,
                player4: parseInt(formData.player4) || null,
                scoreTeam1: formData.scoreTeam1,
                scoreTeam2: formData.scoreTeam2,
                status: formData.status,
                gamemode: formData.gamemode,
                seasonId: parseInt(formData.seasonId) || null,
                mmrChangeTeam1: formData.mmrChangeTeam1,
                mmrChangeTeam2: formData.mmrChangeTeam2,
                mmrPlayer1: formData.mmrPlayer1,
                mmrPlayer2: formData.mmrPlayer2,
                mmrPlayer3: formData.mmrPlayer3,
                mmrPlayer4: formData.mmrPlayer4,
                bountyTeam1: formData.bountyTeam1,
                bountyTeam2: formData.bountyTeam2,
            },
            {
                onSuccess: () => onClose(),
            }
        );
    };

    const is2on2 = formData.gamemode === "2on2";

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>
                        {isViewMode
                            ? `Match #${match?.nr || match?.id}`
                            : `Edit Match #${match?.nr || match?.id}`}
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
                                <Label>Status</Label>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={isViewMode}
                                >
                                    <option value="active">Active</option>
                                    <option value="finished">Finished</option>
                                    <option value="cancelled">Cancelled</option>
                                </Select>
                            </FormGroup>
                            <FormGroup>
                                <Label>Gamemode</Label>
                                <Select
                                    name="gamemode"
                                    value={formData.gamemode}
                                    onChange={handleChange}
                                    disabled={isViewMode}
                                >
                                    <option value="1on1">1on1</option>
                                    <option value="2on2">2on2</option>
                                </Select>
                            </FormGroup>
                            <FormGroup>
                                <Label>Season</Label>
                                <Select
                                    name="seasonId"
                                    value={formData.seasonId}
                                    onChange={handleChange}
                                    disabled={isViewMode}
                                >
                                    <option value="">No Season</option>
                                    {seasons?.map((season) => (
                                        <option
                                            key={season.id}
                                            value={season.id}
                                        >
                                            {season.name ||
                                                `Season ${season.season_number}`}
                                        </option>
                                    ))}
                                </Select>
                            </FormGroup>
                        </FormRow>
                    </FormSection>

                    {/* Team 1 */}
                    <FormSection>
                        <SectionLabel>Team 1</SectionLabel>
                        <FormRow>
                            <FormGroup>
                                <Label>Player 1</Label>
                                <Select
                                    name="player1"
                                    value={formData.player1}
                                    onChange={handleChange}
                                    disabled={isViewMode}
                                >
                                    <option value="">Select Player</option>
                                    {players?.map((player) => (
                                        <option
                                            key={player.id}
                                            value={player.id}
                                        >
                                            {player.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormGroup>
                            {is2on2 && (
                                <FormGroup>
                                    <Label>Player 3</Label>
                                    <Select
                                        name="player3"
                                        value={formData.player3}
                                        onChange={handleChange}
                                        disabled={isViewMode}
                                    >
                                        <option value="">Select Player</option>
                                        {players?.map((player) => (
                                            <option
                                                key={player.id}
                                                value={player.id}
                                            >
                                                {player.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormGroup>
                            )}
                            <FormGroup>
                                <Label>Score</Label>
                                <Input
                                    type="number"
                                    name="scoreTeam1"
                                    value={formData.scoreTeam1}
                                    onChange={handleChange}
                                    min="0"
                                    disabled={isViewMode}
                                />
                            </FormGroup>
                        </FormRow>
                    </FormSection>

                    {/* Team 2 */}
                    <FormSection>
                        <SectionLabel>Team 2</SectionLabel>
                        <FormRow>
                            <FormGroup>
                                <Label>Player 2</Label>
                                <Select
                                    name="player2"
                                    value={formData.player2}
                                    onChange={handleChange}
                                    disabled={isViewMode}
                                >
                                    <option value="">Select Player</option>
                                    {players?.map((player) => (
                                        <option
                                            key={player.id}
                                            value={player.id}
                                        >
                                            {player.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormGroup>
                            {is2on2 && (
                                <FormGroup>
                                    <Label>Player 4</Label>
                                    <Select
                                        name="player4"
                                        value={formData.player4}
                                        onChange={handleChange}
                                        disabled={isViewMode}
                                    >
                                        <option value="">Select Player</option>
                                        {players?.map((player) => (
                                            <option
                                                key={player.id}
                                                value={player.id}
                                            >
                                                {player.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormGroup>
                            )}
                            <FormGroup>
                                <Label>Score</Label>
                                <Input
                                    type="number"
                                    name="scoreTeam2"
                                    value={formData.scoreTeam2}
                                    onChange={handleChange}
                                    min="0"
                                    disabled={isViewMode}
                                />
                            </FormGroup>
                        </FormRow>
                    </FormSection>

                    {/* MMR Changes */}
                    <FormSection>
                        <SectionLabel>MMR Changes</SectionLabel>
                        <FormRow>
                            <FormGroup>
                                <Label>Team 1 MMR Change</Label>
                                <Input
                                    type="number"
                                    name="mmrChangeTeam1"
                                    value={formData.mmrChangeTeam1}
                                    onChange={handleChange}
                                    disabled={isViewMode}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>Team 2 MMR Change</Label>
                                <Input
                                    type="number"
                                    name="mmrChangeTeam2"
                                    value={formData.mmrChangeTeam2}
                                    onChange={handleChange}
                                    disabled={isViewMode}
                                />
                            </FormGroup>
                        </FormRow>
                        <FormRow>
                            <FormGroup>
                                <Label>Player 1 MMR</Label>
                                <Input
                                    type="number"
                                    name="mmrPlayer1"
                                    value={formData.mmrPlayer1}
                                    onChange={handleChange}
                                    disabled={isViewMode}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>Player 2 MMR</Label>
                                <Input
                                    type="number"
                                    name="mmrPlayer2"
                                    value={formData.mmrPlayer2}
                                    onChange={handleChange}
                                    disabled={isViewMode}
                                />
                            </FormGroup>
                            {is2on2 && (
                                <>
                                    <FormGroup>
                                        <Label>Player 3 MMR</Label>
                                        <Input
                                            type="number"
                                            name="mmrPlayer3"
                                            value={formData.mmrPlayer3}
                                            onChange={handleChange}
                                            disabled={isViewMode}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Player 4 MMR</Label>
                                        <Input
                                            type="number"
                                            name="mmrPlayer4"
                                            value={formData.mmrPlayer4}
                                            onChange={handleChange}
                                            disabled={isViewMode}
                                        />
                                    </FormGroup>
                                </>
                            )}
                        </FormRow>
                    </FormSection>

                    {/* Bounty */}
                    <FormSection>
                        <SectionLabel>Bounty</SectionLabel>
                        <FormRow>
                            <FormGroup>
                                <Label>Team 1 Bounty</Label>
                                <Input
                                    type="number"
                                    name="bountyTeam1"
                                    value={formData.bountyTeam1}
                                    onChange={handleChange}
                                    min="0"
                                    disabled={isViewMode}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>Team 2 Bounty</Label>
                                <Input
                                    type="number"
                                    name="bountyTeam2"
                                    value={formData.bountyTeam2}
                                    onChange={handleChange}
                                    min="0"
                                    disabled={isViewMode}
                                />
                            </FormGroup>
                        </FormRow>
                    </FormSection>

                    {/* Info for view mode */}
                    {isViewMode && match && (
                        <FormSection>
                            <SectionLabel>Additional Info</SectionLabel>
                            <InfoText>
                                Created:{" "}
                                {new Date(match.created_at).toLocaleString(
                                    "de-DE"
                                )}
                            </InfoText>
                            {match.start_time && (
                                <InfoText>
                                    Started:{" "}
                                    {new Date(match.start_time).toLocaleString(
                                        "de-DE"
                                    )}
                                </InfoText>
                            )}
                            {match.end_time && (
                                <InfoText>
                                    Ended:{" "}
                                    {new Date(match.end_time).toLocaleString(
                                        "de-DE"
                                    )}
                                </InfoText>
                            )}
                        </FormSection>
                    )}

                    <ButtonRow>
                        <Button
                            type="button"
                            $variation="secondary"
                            onClick={onClose}
                        >
                            {isViewMode ? "Close" : "Cancel"}
                        </Button>
                        {!isViewMode && (
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? "Saving..." : "Save Changes"}
                            </Button>
                        )}
                    </ButtonRow>
                </Form>
            </Modal>
        </Overlay>
    );
}

export default MatchModal;
