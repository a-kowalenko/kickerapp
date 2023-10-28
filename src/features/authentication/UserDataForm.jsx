import { useParams } from "react-router-dom";
import { useUser } from "./useUser";
import FormRow from "../../ui/FormRow";
import { useUpdateUser } from "./useUpdateUser";
import { useState } from "react";
import toast from "react-hot-toast";

function UserDataForm() {
    const { userId } = useParams();
    const {
        user: { email },
    } = useUser();

    const [newUsername, setNewUsername] = useState(userId);
    const [newAvatar, setNewAvatar] = useState(null);

    const { updateUser, isUpdating } = useUpdateUser();

    function handleSubmit(e) {
        e.preventDefault();

        if (!newUsername) {
            return toast.error("Username must be provided");
        }

        updateUser({ username: newUsername, avatar: newAvatar });
    }

    return (
        <form onSubmit={handleSubmit}>
            <FormRow label="Email address">
                <input value={email} disabled />
            </FormRow>
            <FormRow label="Username">
                <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={isUpdating}
                />
            </FormRow>

            <FormRow label="Avatar">
                <input
                    type="file"
                    disabled={isUpdating}
                    onChange={(e) => setNewAvatar(e.target.files[0])}
                />
            </FormRow>

            <FormRow>
                <button disabled={isUpdating}>Update</button>
            </FormRow>
        </form>
    );
}

export default UserDataForm;
