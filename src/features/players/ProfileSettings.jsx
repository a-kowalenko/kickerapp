import styled from "styled-components";
import UserDataForm from "../authentication/UserDataForm";

const StyledProfileSettings = styled.div`
    display: flex;
    gap: 12rem;
`;

function ProfileSettings() {
    return (
        <StyledProfileSettings>
            <UserDataForm />
        </StyledProfileSettings>
    );
}

export default ProfileSettings;
