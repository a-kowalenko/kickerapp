import styled from "styled-components";
import UserDataForm from "../authentication/UserDataForm";
import UpdatePasswordForm from "../authentication/UpdatePasswordForm";
import AvatarUpload from "../authentication/AvatarUpload";
import { media } from "../../utils/constants";
import { HiOutlineUser, HiOutlineLockClosed } from "react-icons/hi2";

const StyledProfileSettings = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }

    ${media.mobile} {
        padding: 0;
        gap: 1.6rem;
    }
`;

const Card = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    ${media.tablet} {
        border-radius: var(--border-radius-sm);
    }

    ${media.mobile} {
        border-radius: 0;
        border-left: none;
        border-right: none;
    }
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 2rem 2.4rem;
    background-color: var(--color-grey-50);
    border-bottom: 1px solid var(--secondary-border-color);

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background-color: var(--primary-button-color);
    color: var(--primary-button-color-text);

    svg {
        width: 2rem;
        height: 2rem;
    }

    ${media.mobile} {
        width: 3.2rem;
        height: 3.2rem;

        svg {
            width: 1.6rem;
            height: 1.6rem;
        }
    }
`;

const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const CardTitle = styled.span`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--color-grey-800);

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const CardDescription = styled.span`
    font-size: 1.4rem;
    color: var(--color-grey-500);

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const CardBody = styled.div`
    padding: 2.4rem;

    ${media.mobile} {
        padding: 1.2rem;
    }
`;

const ProfileCard = styled(Card)`
    display: flex;
    flex-direction: column;
`;

const ProfileContent = styled.div`
    display: flex;
    gap: 4rem;
    padding: 2.4rem;

    ${media.tablet} {
        flex-direction: column;
        align-items: center;
        gap: 2.4rem;
    }

    ${media.mobile} {
        padding: 1.2rem;
        gap: 1.6rem;
    }
`;

const AvatarSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6rem;
    min-width: 20rem;

    ${media.tablet} {
        min-width: unset;
        width: 100%;
    }
`;

const FormSection = styled.div`
    flex: 1;
    min-width: 0;
`;

function ProfileSettings() {
    return (
        <StyledProfileSettings>
            <ProfileCard>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlineUser />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                            Update your profile details and avatar
                        </CardDescription>
                    </HeaderContent>
                </CardHeader>
                <ProfileContent>
                    <AvatarSection>
                        <AvatarUpload />
                    </AvatarSection>
                    <FormSection>
                        <UserDataForm />
                    </FormSection>
                </ProfileContent>
            </ProfileCard>

            <Card>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlineLockClosed />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>
                            Update your password to keep your account secure
                        </CardDescription>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
                    <UpdatePasswordForm />
                </CardBody>
            </Card>
        </StyledProfileSettings>
    );
}

export default ProfileSettings;
