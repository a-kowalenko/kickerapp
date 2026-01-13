import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "./useUser";
import { useUpdateUser } from "./useUpdateUser";
import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import LoadingSpinner from "../../ui/LoadingSpinner";
import SpinnerMini from "../../ui/SpinnerMini";
import { validateUsername } from "../../utils/helpers";

const SettingsForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 100%;
`;

const SettingsInputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const SettingsLabel = styled.label`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--primary-text-color);
`;

const SettingsInput = styled(Input)`
    padding: 1.2rem 1.4rem;
    font-size: 1.5rem;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-border-color);
    background: var(--primary-background-color);
    transition: all 0.2s ease;

    &:hover:not(:focus):not(:disabled) {
        border-color: var(--color-grey-400);
        background: var(--secondary-background-color);
    }

    &:focus {
        border-color: var(--primary-button-color);
        box-shadow: 0 0 0 3px rgba(7, 89, 133, 0.25);
    }

    &:disabled {
        background: var(--color-grey-100);
        color: var(--secondary-text-color);
        cursor: not-allowed;
    }
`;

const SettingsButton = styled(Button)`
    align-self: flex-start;
    padding: 1.2rem 2.4rem;
    font-size: 1.4rem;
`;

function UserDataForm() {
    const { userId } = useParams();
    const {
        user: { email },
    } = useUser();

    const { isLoading } = useOwnPlayer();

    const [newUsername, setNewUsername] = useState(userId);

    const { updateUser, isUpdating } = useUpdateUser();

    function handleSubmit(e) {
        e.preventDefault();

        const validation = validateUsername(newUsername);
        if (!validation.valid) {
            return toast.error(validation.error);
        }

        if (newUsername === userId) {
            return toast.error("Please enter a different username");
        }

        updateUser({ username: newUsername });
    }

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <SettingsForm onSubmit={handleSubmit}>
            <SettingsInputGroup>
                <SettingsLabel htmlFor="email">Email address</SettingsLabel>
                <SettingsInput id="email" value={email} disabled />
            </SettingsInputGroup>

            <SettingsInputGroup>
                <SettingsLabel htmlFor="username">Username</SettingsLabel>
                <SettingsInput
                    id="username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={isUpdating}
                />
            </SettingsInputGroup>

            <SettingsButton
                $variation="primary"
                disabled={isUpdating || newUsername === userId}
            >
                {isUpdating ? <SpinnerMini /> : "Update Profile"}
            </SettingsButton>
        </SettingsForm>
    );
}

export default UserDataForm;
