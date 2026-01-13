import styled from "styled-components";
import UserDataForm from "../authentication/UserDataForm";
import UpdatePasswordForm from "../authentication/UpdatePasswordForm";
import AvatarUpload from "../authentication/AvatarUpload";
import { media } from "../../utils/constants";
import { HiOutlineUser, HiOutlineLockClosed } from "react-icons/hi2";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const SectionTitle = styled.h3`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const ProfileCard = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1.6rem;
    padding: 1.6rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);

    ${media.tablet} {
        flex-direction: column;
        align-items: center;
    }
`;

const ProfileIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.8rem;
    height: 4.8rem;
    border-radius: 50%;
    background-color: var(--tertiary-background-color);
    color: var(--primary-button-color);
    flex-shrink: 0;

    & svg {
        font-size: 2.4rem;
    }

    ${media.tablet} {
        display: none;
    }
`;

const ProfileContent = styled.div`
    flex: 1;
    display: flex;
    gap: 3.2rem;
    min-width: 0;

    ${media.tablet} {
        flex-direction: column;
        align-items: center;
        gap: 2.4rem;
        width: 100%;
    }
`;

const AvatarSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6rem;
    flex-shrink: 0;
`;

const FormSection = styled.div`
    flex: 1;
    min-width: 0;
    max-width: 40rem;

    ${media.tablet} {
        max-width: 100%;
        width: 100%;
    }
`;

const SecurityCard = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1.6rem;
    padding: 1.6rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);

    ${media.mobile} {
        flex-direction: column;
    }
`;

const SecurityIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.8rem;
    height: 4.8rem;
    border-radius: 50%;
    background-color: var(--tertiary-background-color);
    color: var(--primary-button-color);
    flex-shrink: 0;

    & svg {
        font-size: 2.4rem;
    }

    ${media.mobile} {
        display: none;
    }
`;

const SecurityContent = styled.div`
    flex: 1;
    min-width: 0;
    max-width: 40rem;

    ${media.tablet} {
        max-width: 100%;
        width: 100%;
    }
`;

function ProfileSettings() {
    return (
        <Container>
            <Section>
                <SectionTitle>Profile Information</SectionTitle>
                <ProfileCard>
                    <ProfileIcon>
                        <HiOutlineUser />
                    </ProfileIcon>
                    <ProfileContent>
                        <AvatarSection>
                            <AvatarUpload />
                        </AvatarSection>
                        <FormSection>
                            <UserDataForm />
                        </FormSection>
                    </ProfileContent>
                </ProfileCard>
            </Section>

            <Section>
                <SectionTitle>Security</SectionTitle>
                <SecurityCard>
                    <SecurityIcon>
                        <HiOutlineLockClosed />
                    </SecurityIcon>
                    <SecurityContent>
                        <UpdatePasswordForm variant="settings" />
                    </SecurityContent>
                </SecurityCard>
            </Section>
        </Container>
    );
}

export default ProfileSettings;
