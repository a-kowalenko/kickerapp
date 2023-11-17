import Button from "../ui/Button";
import SwitchButton from "../ui/SwitchButton";
import Dropdown from "../ui/Dropdown";
import FormRow from "../ui/FormRow";
import Input from "../ui/Input";
import ContentBox from "../ui/ContentBox";
import MiniTable from "../ui/MiniTable";
import { useMatches } from "../features/matches/useMatches";
import Row from "../ui/Row";
import Heading from "../ui/Heading";
import Filter from "../ui/Filter";
import Spinner from "../ui/Spinner";
import { useKickerInfo } from "../hooks/useKickerInfo";

const fakeOptions = [
    { text: "Element 1", value: 1 },
    { text: "Element 2", value: 2 },
    { text: "Element 3", value: 3 },
    { text: "Element 4", value: 4 },
    { text: "Element 5", value: 5 },
];

const fakeFilterOptions = [
    { value: "1on1" },
    { value: "2on2" },
    { value: "2on1" },
];

function Testwiese() {
    const { data: kickerData, isLoading: isLoadingKickerData } =
        useKickerInfo();

    const isDisabled = false;

    function handleCheckboxChange(value) {
        console.log("checkbox set to:", value);
    }

    const { matches } = useMatches();

    return (
        <>
            <FormRow label={"access token"}>
                <Input
                    placeholder="Default disabled"
                    disabled
                    value={kickerData.access_token}
                />
            </FormRow>
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
                <SwitchButton
                    label={"Switch label"}
                    value={true}
                    onChange={handleCheckboxChange}
                />
                <SwitchButton
                    label={"Switch label"}
                    onChange={handleCheckboxChange}
                    disabled={true}
                />
            </FormRow>
            <FormRow>
                <SwitchButton
                    label={"Switch label"}
                    onChange={handleCheckboxChange}
                />
                <SwitchButton
                    label={"Switch label"}
                    value={true}
                    disabled={true}
                    onChange={handleCheckboxChange}
                />
            </FormRow>
            <FormRow>
                <Filter options={fakeFilterOptions} field="gamemode" />
            </FormRow>
            <FormRow>
                <Spinner />
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

            <FormRow>
                <ContentBox>
                    <Row type="horizontal">
                        <Heading as="h2">Strich der Schande</Heading>
                    </Row>
                    <MiniTable columns="1fr 1fr 0.3fr">
                        <MiniTable.Header>
                            <div>Player</div>
                            <div>geschändet von</div>
                            <div>Date</div>
                        </MiniTable.Header>
                    </MiniTable>
                </ContentBox>
                <ContentBox>ContentBox</ContentBox>
            </FormRow>
        </>
    );
}

export default Testwiese;
