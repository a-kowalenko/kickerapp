import { HiOutlineClipboardDocument } from "react-icons/hi2";
import { useKickerInfo } from "../hooks/useKickerInfo";
import FormRow from "../ui/FormRow";
import Input from "../ui/Input";
import styled from "styled-components";
import ButtonIcon from "../ui/ButtonIcon";
import toast from "react-hot-toast";
import Heading from "../ui/Heading";
import SpinnerMini from "../ui/SpinnerMini";
import { media } from "../utils/constants";
import useWindowWidth from "../hooks/useWindowWidth";

const StyledSettings = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }
`;

const SettingsContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const DescriptionText = styled.p`
    color: var(--primary-text-color);
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    gap: 2.4rem;

    & input {
        width: 100%;
    }
`;

function Settings() {
    const { data: kickerData, isLoading: isLoadingKickerData } =
        useKickerInfo();
    const { isDesktop, isTablet, isMobile } = useWindowWidth();

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
            <Heading as="h1" type="page" hasBackBtn={true}>
                Settings
            </Heading>
            <SettingsContent>
                <DescriptionText>
                    Use this access token to allow other players to join your
                    kicker. Simply share this token with the players you want to
                    invite. This enables them to easily and securely add
                    themselves to your kicker.
                </DescriptionText>
                <FormRow
                    label={"Access Token"}
                    buttonPosition="start"
                    fill={true}
                    error={true}
                >
                    {isLoadingKickerData ? (
                        <SpinnerMini />
                    ) : (
                        <>
                            {isDesktop && (
                                <>
                                    <Input
                                        value={kickerData.access_token}
                                        readOnly={true}
                                    />
                                    <div>{CopyButton}</div>
                                </>
                            )}
                            {(isMobile || isTablet) && (
                                <Row>
                                    <Input
                                        value={kickerData.access_token}
                                        readOnly={true}
                                    />
                                    {CopyButton}
                                </Row>
                            )}
                        </>
                    )}
                </FormRow>
            </SettingsContent>
        </StyledSettings>
    );
}

export default Settings;
