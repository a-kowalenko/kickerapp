import styled from "styled-components";
import UserDataForm from "../authentication/UserDataForm";
import UpdatePasswordForm from "../authentication/UpdatePasswordForm";
import { media } from "../../utils/constants";

const StyledProfileSettings = styled.div`
    display: flex;
    flex-direction: column;
    gap: 3rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }
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
