import UpdatePasswordForm from "../features/authentication/UpdatePasswordForm";
import Heading from "../ui/Heading";

function UpdatePassword() {
    return (
        <>
            <Heading as="h1" type="page">
                Reset password
            </Heading>
            <UpdatePasswordForm />
        </>
    );
}

export default UpdatePassword;
