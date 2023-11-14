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
import InputFile from "../../ui/InputFile";
import Avatar from "../../ui/Avatar";
import { DEFAULT_AVATAR } from "../../utils/constants";

const UserFormContainer = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 12rem;
`;

function UserDataForm() {
    const { userId } = useParams();
    const {
        user: {
            email,
            user_metadata: { avatar },
        },
    } = useUser();

    const [newUsername, setNewUsername] = useState(userId);
    const [newAvatar, setNewAvatar] = useState(null);
    const [avatarSrc, setAvatarSrc] = useState(avatar);

    const { updateUser, isUpdating } = useUpdateUser();

    function handleSubmit(e) {
        e.preventDefault();

        if (!newUsername) {
            return toast.error("Username must be provided");
        }

        updateUser({ username: newUsername, avatar: newAvatar });
    }

    let test = "";

    function handleAvatarChange(e) {
        const [file] = e.target.files;
        if (file) {
            test = URL.createObjectURL(file);
            setAvatarSrc(test);
        }

        setNewAvatar(e.target.files[0]);
    }

    return (
        <UserFormContainer>
            <Form onSubmit={handleSubmit}>
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

                <FormRow label="Avatar">
                    <InputFile
                        id="avatar"
                        type="file"
                        disabled={isUpdating}
                        onChange={handleAvatarChange}
                    />
                </FormRow>

                <FormRow>
                    <Button
                        $size="large"
                        $variation="primary"
                        disabled={isUpdating}
                    >
                        Update
                    </Button>
                </FormRow>
            </Form>
            <Avatar src={avatarSrc || DEFAULT_AVATAR} $size="huge" />
        </UserFormContainer>
    );
}

export default UserDataForm;
