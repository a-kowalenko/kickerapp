import { useForm } from "react-hook-form";
import FormRow from "../../ui/FormRow";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Form from "../../ui/Form";
import { useUpdatePassword } from "./useUpdatePassword";

function UpdatePasswordForm() {
    const { register, handleSubmit, formState, getValues, reset } = useForm();
    const { errors } = formState;

    const { updatePassword, isLoading } = useUpdatePassword();

    function onSubmit({ password }) {
        updatePassword(
            { password },
            {
                onSuccess: () => reset(),
                onError: () => reset(),
            }
        );
    }

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <FormRow
                label="New password"
                error={errors?.password?.message || true}
            >
                <Input
                    type="password"
                    id="password"
                    disabled={isLoading}
                    {...register("password", {
                        required: "This field is required",
                        minLength: {
                            value: 8,
                            message: "Password needs a minimum of 8 characters",
                        },
                    })}
                />
            </FormRow>
            <FormRow
                label="Confirm password"
                error={errors?.passwordConfirm?.message || true}
            >
                <Input
                    type="password"
                    id="passwordConfirm"
                    disabled={isLoading}
                    {...register("passwordConfirm", {
                        required: "This field is required",
                        validate: (value) =>
                            getValues().password === value ||
                            "Passwords need to match",
                    })}
                />
            </FormRow>

            <FormRow>
                <Button $size="large" $variation="primary" disabled={isLoading}>
                    Update password
                </Button>
            </FormRow>
        </Form>
    );
}

export default UpdatePasswordForm;
