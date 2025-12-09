import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "./useUser";
import FormRow from "../../ui/FormRow";
import { useUpdateUser } from "./useUpdateUser";
import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Form from "../../ui/Form";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import LoadingSpinner from "../../ui/LoadingSpinner";
import SpinnerMini from "../../ui/SpinnerMini";
import { validateUsername } from "../../utils/helpers";

const StyledForm = styled(Form)`
    width: 100%;
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
        <StyledForm onSubmit={handleSubmit}>
            <FormRow label="Email address">
                <Input value={email} disabled />
            </FormRow>
            <FormRow label="Username">
                <Input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={isUpdating}
                />
            </FormRow>

            <FormRow>
                <Button
                    $size="large"
                    $variation="primary"
                    disabled={isUpdating || newUsername === userId}
                >
                    {isUpdating ? <SpinnerMini /> : "Update Profile"}
                </Button>
            </FormRow>
        </StyledForm>
    );
}

export default UserDataForm;
