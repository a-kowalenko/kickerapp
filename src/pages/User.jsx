import { useParams } from "react-router-dom";
import UserDataForm from "../features/authentication/UserDataForm";
import { useUser } from "../features/authentication/useUser";
import styled from "styled-components";

const StyledUser = styled.div`
    display: flex;
`;

function User() {
    const { userId } = useParams();
    const {
        user: {
            email,
            user_metadata: { username, avatar },
        },
    } = useUser();

    const ownAccount = userId === username;
    return (
        <StyledUser>
            {ownAccount ? <UserDataForm /> : <div>Gucki</div>}
        </StyledUser>
    );
}

export default User;
