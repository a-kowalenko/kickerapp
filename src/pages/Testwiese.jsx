import Button from "../ui/Button";
import Dropdown from "../ui/Dropdown";
import FormRow from "../ui/FormRow";
import Input from "../ui/Input";

const fakeOptions = [
    { text: "Element 1", value: 1 },
    { text: "Element 2", value: 2 },
    { text: "Element 3", value: 3 },
    { text: "Element 4", value: 4 },
    { text: "Element 5", value: 5 },
];

function Testwiese() {
    const isDisabled = false;

    return (
        <form>
            <FormRow>
                <Input placeholder="Default" />
                <Input placeholder="Default disabled" disabled />
            </FormRow>
            <FormRow>
                <Input placeholder="Error" $variation="error" />
                <Input placeholder="Error disabled" disabled />
            </FormRow>
            <FormRow>
                <Dropdown options={fakeOptions} />
                <Dropdown options={fakeOptions} disabled={true} />
            </FormRow>
            <FormRow>
                <Button
                    $size="small"
                    $variation="primary"
                    disabled={isDisabled}
                >
                    Primary
                </Button>
                <Button
                    $size="small"
                    $variation="secondary"
                    disabled={isDisabled}
                >
                    Secondary
                </Button>
                <Button $size="small" $variation="danger" disabled={isDisabled}>
                    Danger
                </Button>
            </FormRow>
            <FormRow>
                <Button
                    $size="medium"
                    $variation="primary"
                    disabled={isDisabled}
                >
                    Primary
                </Button>
                <Button
                    $size="medium"
                    $variation="secondary"
                    disabled={isDisabled}
                >
                    Secondary
                </Button>
                <Button
                    $size="medium"
                    $variation="danger"
                    disabled={isDisabled}
                >
                    Danger
                </Button>
            </FormRow>
            <FormRow>
                <Button
                    $size="large"
                    $variation="primary"
                    disabled={isDisabled}
                >
                    Primary
                </Button>
                <Button
                    $size="large"
                    $variation="secondary"
                    disabled={isDisabled}
                >
                    Secondary
                </Button>
                <Button $size="large" $variation="danger" disabled={isDisabled}>
                    Danger
                </Button>
            </FormRow>
        </form>
    );
}

export default Testwiese;
