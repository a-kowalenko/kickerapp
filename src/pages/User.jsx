import { useParams } from "react-router-dom";
import UserDataForm from "../features/authentication/UserDataForm";
import { useUser } from "../features/authentication/useUser";
import styled from "styled-components";
import Avatar from "../ui/Avatar";
import Profile from "../features/players/Profile";
import Row from "../ui/Row";
import Heading from "../ui/Heading";

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
        <>
            <Row type="horizontal">
                <Heading as="h1" $uppercase>
                    Profile of {userId}
                </Heading>
            </Row>
            <StyledUser>
                {ownAccount ? (
                    <>
                        <UserDataForm />
                        <Avatar src={avatar} $size="huge" />
                    </>
                ) : (
                    <Profile username={userId} />
                )}
            </StyledUser>
        </>
    );
}

export default User;
