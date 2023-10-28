import { useParams } from "react-router-dom";
import UserDataForm from "../features/authentication/UserDataForm";
import { useUser } from "../features/authentication/useUser";

function User() {
    const { userId } = useParams();
    const {
        user: {
            email,
            user_metadata: { username, avatar },
        },
    } = useUser();

    const ownAccount = userId === username;
    return <div>{ownAccount ? <UserDataForm /> : <div>Gucki</div>}</div>;
}

export default User;
