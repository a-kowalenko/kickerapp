import styled from "styled-components";
import UserDataForm from "../authentication/UserDataForm";
import UpdatePasswordForm from "../authentication/UpdatePasswordForm";

const StyledProfileSettings = styled.div`
    display: flex;
    flex-direction: column;
    gap: 3rem;
`;

function ProfileSettings() {
    return (
        <StyledProfileSettings>
            <UserDataForm />
            <UpdatePasswordForm />
        </StyledProfileSettings>
    );
}

export default ProfileSettings;
