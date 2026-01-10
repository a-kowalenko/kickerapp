import styled from "styled-components";
import Heading from "./Heading";
import { Link } from "react-router-dom";
import { FaGithub, FaXTwitter, FaInstagram, FaPatreon } from "react-icons/fa6";
import { SiBuymeacoffee } from "react-icons/si";
import { media } from "../utils/constants";

const StyledFooter = styled.footer`
    grid-column: 1 / -1;
    padding: 2.4rem 9.6rem;

    font-size: 1rem;
    text-align: center;
    left: 0;
    bottom: 0;
    width: 100%;
    border-top: 1px solid var(--primary-border-color);
    background-color: var(--primary-background-color);
    overflow-x: auto;

    ${media.tablet} {
        padding: 2.4rem;
    }
`;

const FooterLayout = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4.8rem;
    max-width: 100rem;
    margin-left: auto;
    margin-right: auto;

    ${media.tablet} {
        gap: 3.2rem;
        justify-content: flex-start;
    }

    ${media.mobile} {
        gap: 2.4rem;
    }
`;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 14.7rem;
    flex: 0 0 auto;

    ${media.mobile} {
        /* align-items: center;
        text-align: center; */
        min-width: 100%;
    }
`;

const List = styled.ul`
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    color: var(--secondary-text-color);
`;

const ListElement = styled.div`
    display: flex;
    align-items: center;
    line-height: 20px;
    font-size: 1.2rem;
    transition: all 0.3s ease;

    &:hover {
        color: var(--primary-text-color);
    }

    & svg {
        width: 3rem;
        height: 3rem;
    }
`;

const TechStackContainer = styled(Container)``;

const TechLists = styled.div`
    display: flex;
    gap: 4.8rem;

    ${media.tablet} {
        gap: 2.4rem;
    }

    ${media.mobile} {
        gap: 4.8rem;
    }
`;

const TechList = styled(List)``;

const TechElement = styled(ListElement)`
    display: flex;
`;

const SocialsContainer = styled(Container)``;

const SocialsList = styled(List)`
    flex-direction: row;
    flex-wrap: wrap;
    gap: 2.4rem;

    ${media.mobile} {
        justify-content: center;
    }
`;

const SocialElement = styled(ListElement)`
    gap: 1rem;
    font-size: large;
`;

const LegalContainer = styled(Container)``;

const LegalList = styled(List)`
    flex-direction: column;
    gap: 0.4rem;
`;

const LegalElement = styled(ListElement)`
    display: flex;
`;

const Copyright = styled.p`
    margin-top: 2rem;
    color: var(--secondary-text-color);
`;

function Footer() {
    return (
        <StyledFooter>
            <FooterLayout>
                <TechStackContainer>
                    <Heading>Tech Stack</Heading>
                    <TechLists>
                        <TechList>
                            <TechElement>
                                <Link to="https://react.dev/" target={"_blank"}>
                                    ReactJS
                                </Link>
                            </TechElement>
                            <TechElement>
                                <Link
                                    to="https://reactrouter.com/"
                                    target={"_blank"}
                                >
                                    React Router
                                </Link>
                            </TechElement>
                            <TechElement>
                                <Link
                                    to="https://tanstack.com/query/latest/"
                                    target={"_blank"}
                                >
                                    TanStack Query
                                </Link>
                            </TechElement>
                            <TechElement>
                                <Link
                                    to="https://styled-components.com/"
                                    target={"_blank"}
                                >
                                    Styled Components
                                </Link>
                            </TechElement>
                            <TechElement>
                                <Link
                                    to="https://react-icons.github.io/react-icons/"
                                    target={"_blank"}
                                >
                                    React Icons
                                </Link>
                            </TechElement>
                            <TechElement>
                                <Link
                                    to="https://react-hot-toast.com/"
                                    target={"_blank"}
                                >
                                    React Hot Toast
                                </Link>
                            </TechElement>
                            <TechElement>
                                <Link
                                    to="https://recharts.org/"
                                    target={"_blank"}
                                >
                                    Recharts
                                </Link>
                            </TechElement>
                            <TechElement>
                                <Link
                                    to="https://react-hook-form.com/"
                                    target={"_blank"}
                                >
                                    React Hook Form
                                </Link>
                            </TechElement>
                        </TechList>
                        <TechList>
                            <TechElement>
                                <Link
                                    to="https://supabase.com/"
                                    target={"_blank"}
                                >
                                    Supabase
                                </Link>
                            </TechElement>
                            <TechElement>
                                <Link
                                    to="https://vercel.com/"
                                    target={"_blank"}
                                >
                                    Vercel
                                </Link>
                            </TechElement>
                            <TechElement>
                                <Link
                                    to="https://www.postgresql.org/"
                                    target={"_blank"}
                                >
                                    PostgreSQL
                                </Link>
                            </TechElement>
                        </TechList>
                    </TechLists>
                </TechStackContainer>
                <SocialsContainer>
                    <Heading>Socials</Heading>
                    <SocialsList>
                        <SocialElement>
                            <Link
                                to="https://github.com/a-kowalenko/kickerapp"
                                target={"_blank"}
                            >
                                <FaGithub title="Fork me on Github" />
                            </Link>
                        </SocialElement>
                        <SocialElement>
                            <Link
                                to="https://www.instagram.com/andreaskowalenko/"
                                target={"_blank"}
                            >
                                <FaInstagram title="Follow me on Instagram" />
                            </Link>
                        </SocialElement>
                        <SocialElement>
                            <Link
                                to="https://twitter.com/andy_kowalenko"
                                target={"_blank"}
                            >
                                <FaXTwitter title="Follow me on X" />
                            </Link>
                        </SocialElement>
                        <SocialElement>
                            <Link
                                to="https://www.patreon.com/andreaskowalenko"
                                target={"_blank"}
                            >
                                <FaPatreon title="Become a patreon" />
                            </Link>
                        </SocialElement>
                        <SocialElement>
                            <Link
                                to="https://www.buymeacoffee.com/kowalenko"
                                target={"_blank"}
                            >
                                <SiBuymeacoffee title="Buy me a coffee" />
                            </Link>
                        </SocialElement>
                    </SocialsList>
                </SocialsContainer>
                <LegalContainer>
                    <Heading>Legal</Heading>
                    <LegalList>
                        <LegalElement>
                            <Link to="/imprint">Imprint</Link>
                        </LegalElement>
                        <LegalElement>
                            <Link to="/privacy">Privacy</Link>
                        </LegalElement>
                    </LegalList>
                </LegalContainer>
            </FooterLayout>
            <Copyright>
                © 2023-{new Date().getFullYear()} Andreas Kowalenko
            </Copyright>
        </StyledFooter>
    );
}

export default Footer;
