import { HiOutlineClipboardDocument } from "react-icons/hi2";
import { useKickerInfo } from "../hooks/useKickerInfo";
import FormRow from "../ui/FormRow";
import Input from "../ui/Input";
import styled from "styled-components";
import ButtonIcon from "../ui/ButtonIcon";
import toast from "react-hot-toast";
import Heading from "../ui/Heading";
import SpinnerMini from "../ui/SpinnerMini";

const StyledSettings = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
`;

const SettingsContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const DescriptionText = styled.p`
    color: var(--primary-text-color);
`;

function Settings() {
    const { data: kickerData, isLoading: isLoadingKickerData } =
        useKickerInfo();

    function handleCopy() {
        navigator.clipboard.writeText(kickerData.access_token);
        toast.success("Access Token copied");
    }

    const CopyButton = (
        <ButtonIcon onClick={handleCopy}>
            <HiOutlineClipboardDocument />
        </ButtonIcon>
    );

    return (
        <StyledSettings>
            <Heading as="h1">Settings</Heading>
            <SettingsContent>
                <DescriptionText>
                    Use this access token to allow other players to join your
                    kicker. Simply share this token with the players you want to
                    invite. This enables them to easily and securely add
                    themselves to your kicker.
                </DescriptionText>
                <FormRow
                    label={"Access Token"}
                    element={CopyButton}
                    buttonPosition="start"
                    fill={true}
                    error={true}
                >
                    {isLoadingKickerData ? (
                        <SpinnerMini />
                    ) : (
                        <Input
                            value={kickerData.access_token}
                            readOnly={true}
                        />
                    )}
                </FormRow>
            </SettingsContent>
        </StyledSettings>
    );
}

export default Settings;
