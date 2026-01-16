import styled from "styled-components";
import { Link } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi2";
import ContactForm from "../features/start/ContactForm";
import { media } from "../utils/constants";

const StyledContact = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: var(--secondary-background-color);
    color: var(--primary-text-color);
    padding: 3.2rem;

    ${media.tablet} {
        padding: 2.4rem;
    }

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3.2rem;
`;

const BackLink = styled(Link)`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--tertiary-text-color);
    font-size: 1.4rem;
    transition: color 0.2s ease;

    &:hover {
        color: var(--primary-text-color);
    }

    & svg {
        width: 2rem;
        height: 2rem;
    }
`;

const Content = styled.div`
    max-width: 80rem;
    margin: 0 auto;
    width: 100%;
`;

const Title = styled.h1`
    font-size: 3.2rem;
    margin-bottom: 1.6rem;
    color: var(--primary-text-color);
    text-align: center;

    ${media.mobile} {
        font-size: 2.4rem;
    }
`;

const Intro = styled.p`
    font-size: 1.6rem;
    line-height: 1.8;
    color: var(--secondary-text-color);
    text-align: center;
    max-width: 60rem;
    margin: 0 auto 2rem;

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

const FormWrapper = styled.div`
    /* Override ContactForm's Section padding since we have our own layout */
    & > section {
        padding: 0;
    }
`;

function Contact() {
    return (
        <StyledContact>
            <Header>
                <BackLink to="/">
                    <HiArrowLeft />
                    Back
                </BackLink>
            </Header>

            <Content>
                <Title>Contact Us</Title>
                <Intro>
                    Have questions, feedback, or need help? We&apos;re here for
                    you! Fill out the form below and we&apos;ll get back to you
                    as soon as possible.
                </Intro>

                <FormWrapper>
                    <ContactForm />
                </FormWrapper>
            </Content>
        </StyledContact>
    );
}

export default Contact;
