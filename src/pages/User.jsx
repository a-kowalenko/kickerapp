import { useParams } from "react-router-dom";
import UserDataForm from "../features/authentication/UserDataForm";
import { useUser } from "../features/authentication/useUser";
import styled from "styled-components";
import Avatar from "../ui/Avatar";

const StyledUser = styled.div`
    display: flex;
    gap: 12rem;
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
            <Avatar src={avatar} $size="huge" />
        </StyledUser>
    );
}

export default User;
