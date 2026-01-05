import styled, { keyframes } from "styled-components";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { HiXMark, HiOutlineUserGroup } from "react-icons/hi2";
import Button from "../../ui/Button";
import Avatar from "../../ui/Avatar";
import SpinnerMini from "../../ui/SpinnerMini";
import { DEFAULT_AVATAR, media } from "../../utils/constants";
import { usePlayers } from "../../hooks/usePlayers";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { useCreateTeam } from "./useTeams";

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const scaleIn = keyframes`
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9999;
    animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-lg);
    padding: 0;
    z-index: 10000;
    animation: ${scaleIn} 0.25s ease-out forwards;
    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.4);
    width: 100%;
    max-width: 44rem;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    ${media.mobile} {
        max-width: 95vw;
    }
`;

const ModalHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.6rem 2rem;
    border-bottom: 1px solid var(--primary-border-color);
    background-color: var(--tertiary-background-color);
`;

const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
`;

const HeaderIcon = styled.div`
    width: 3.6rem;
    height: 3.6rem;
    border-radius: var(--border-radius-sm);
    background-color: var(--primary-button-color);
    display: flex;
    align-items: center;
    justify-content: center;

    & svg {
        width: 2rem;
        height: 2rem;
        color: white;
    }
`;

const Title = styled.h2`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: var(--secondary-text-color);
    padding: 0.6rem;
    border-radius: var(--border-radius-sm);
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background-color: var(--tertiary-background-color);
        color: var(--primary-text-color);
    }

    & svg {
        width: 2rem;
        height: 2rem;
    }
`;

const ModalBody = styled.div`
    padding: 2rem;
    overflow-y: auto;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
`;

const Label = styled.label`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--secondary-text-color);
`;

const Input = styled.input`
    padding: 1rem 1.4rem;
    font-size: 1.4rem;
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);
    transition: all 0.15s ease;

    &:hover:not(:disabled) {
        background-color: var(--primary-input-background-color-hover);
    }

    &:focus {
        outline: none;
        border-color: var(--primary-input-border-color-active);
    }

    &::placeholder {
        color: var(--tertiary-text-color);
    }
`;

const ErrorMessage = styled.span`
    font-size: 1.2rem;
    color: var(--color-red-700);
`;

const PlayerList = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 18rem;
    overflow-y: auto;
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-sm);
    background-color: var(--primary-background-color);
`;

const PlayerOption = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.2rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
    border-bottom: 1px solid var(--primary-border-color);

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background-color: var(--tertiary-background-color);
    }
`;

const PlayerName = styled.span`
    font-size: 1.4rem;
    color: var(--primary-text-color);
`;

const SelectedPartner = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.2rem;
    background-color: var(--tertiary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-sm);
`;

const SelectedPartnerInfo = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.2rem;
`;

const SelectedPartnerName = styled.span`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const SelectedPartnerHint = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
`;

const RemoveButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: var(--secondary-text-color);
    padding: 0.4rem;
    border-radius: var(--border-radius-sm);
    transition: all 0.15s ease;

    &:hover {
        color: var(--color-red-700);
        background-color: rgba(239, 68, 68, 0.1);
    }

    & svg {
        width: 1.6rem;
        height: 1.6rem;
    }
`;

const InfoText = styled.p`
    font-size: 1.3rem;
    color: var(--tertiary-text-color);
    text-align: center;
    padding: 1rem 0;
`;

const ModalFooter = styled.div`
    display: flex;
    gap: 1rem;
    padding: 1.6rem 2rem;
    border-top: 1px solid var(--primary-border-color);
    background-color: var(--tertiary-background-color);

    & > button {
        flex: 1;
    }
`;

const LoadingState = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
`;

function CreateTeamModal({ onClose }) {
    const [selectedPartner, setSelectedPartner] = useState(null);
    const { players, isLoading: isLoadingPlayers } = usePlayers();
    const { data: ownPlayer } = useOwnPlayer();
    const { createTeam, isLoading: isCreating } = useCreateTeam();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    // Filter out own player from partner list
    const availablePartners =
        players?.filter((player) => player.id !== ownPlayer?.id) || [];

    const onSubmit = (data) => {
        if (!selectedPartner) return;

        createTeam(
            { name: data.teamName, partnerPlayerId: selectedPartner.id },
            {
                onSuccess: (result) => {
                    if (result.success) {
                        onClose();
                    }
                },
            }
        );
    };

    return (
        <>
            <Overlay onClick={onClose} />
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <HeaderLeft>
                        <HeaderIcon>
                            <HiOutlineUserGroup />
                        </HeaderIcon>
                        <Title>Create Team</Title>
                    </HeaderLeft>
                    <CloseButton onClick={onClose}>
                        <HiXMark />
                    </CloseButton>
                </ModalHeader>

                <ModalBody>
                    <Form
                        id="create-team-form"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <FormGroup>
                            <Label htmlFor="teamName">Team Name</Label>
                            <Input
                                id="teamName"
                                type="text"
                                placeholder="Enter team name..."
                                {...register("teamName", {
                                    required: "Team name is required",
                                    minLength: {
                                        value: 2,
                                        message:
                                            "Name must be at least 2 characters",
                                    },
                                    maxLength: {
                                        value: 50,
                                        message:
                                            "Name cannot exceed 50 characters",
                                    },
                                })}
                            />
                            {errors.teamName && (
                                <ErrorMessage>
                                    {errors.teamName.message}
                                </ErrorMessage>
                            )}
                        </FormGroup>

                        <FormGroup>
                            <Label>Select Partner</Label>
                            {selectedPartner ? (
                                <SelectedPartner>
                                    <Avatar
                                        $size="small"
                                        src={
                                            selectedPartner.avatar ||
                                            DEFAULT_AVATAR
                                        }
                                    />
                                    <SelectedPartnerInfo>
                                        <SelectedPartnerName>
                                            {selectedPartner.name}
                                        </SelectedPartnerName>
                                        <SelectedPartnerHint>
                                            Will receive an invitation
                                        </SelectedPartnerHint>
                                    </SelectedPartnerInfo>
                                    <RemoveButton
                                        type="button"
                                        onClick={() => setSelectedPartner(null)}
                                    >
                                        <HiXMark />
                                    </RemoveButton>
                                </SelectedPartner>
                            ) : (
                                <PlayerList>
                                    {isLoadingPlayers ? (
                                        <LoadingState>
                                            <SpinnerMini />
                                        </LoadingState>
                                    ) : availablePartners.length === 0 ? (
                                        <InfoText>No players available</InfoText>
                                    ) : (
                                        availablePartners.map((player) => (
                                            <PlayerOption
                                                key={player.id}
                                                onClick={() =>
                                                    setSelectedPartner(player)
                                                }
                                            >
                                                <Avatar
                                                    $size="xs"
                                                    src={
                                                        player.avatar ||
                                                        DEFAULT_AVATAR
                                                    }
                                                />
                                                <PlayerName>
                                                    {player.name}
                                                </PlayerName>
                                            </PlayerOption>
                                        ))
                                    )}
                                </PlayerList>
                            )}
                            {!selectedPartner &&
                                !isLoadingPlayers &&
                                availablePartners.length > 0 && (
                                    <ErrorMessage>
                                        Please select a partner
                                    </ErrorMessage>
                                )}
                        </FormGroup>

                        <InfoText>
                            Your partner will need to accept the invitation
                            before the team becomes active.
                        </InfoText>
                    </Form>
                </ModalBody>

                <ModalFooter>
                    <Button
                        type="button"
                        $variation="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="create-team-form"
                        $variation="primary"
                        disabled={isCreating || !selectedPartner}
                    >
                        {isCreating ? <SpinnerMini /> : "Create Team"}
                    </Button>
                </ModalFooter>
            </ModalContainer>
        </>
    );
}

export default CreateTeamModal;
