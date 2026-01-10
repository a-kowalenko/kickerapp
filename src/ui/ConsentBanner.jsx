import { useState, useEffect } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { media } from "../utils/constants";
import LanguageToggle from "./LanguageToggle";

const CONSENT_KEY = "privacyConsent";

const content = {
    de: {
        title: "🍪 Hinweis",
        description:
            "Diese Webseite verwendet nur technisch notwendige Daten für die Authentifizierung und Benutzereinstellungen. Kein Tracking, keine Werbung.",
        learnMore: "Mehr erfahren",
        accept: "Verstanden",
    },
    en: {
        title: "🍪 Notice",
        description:
            "This website only uses technically necessary data for authentication and user settings. No tracking, no advertising.",
        learnMore: "Learn more",
        accept: "Got it",
    },
};

const Banner = styled.div`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--primary-background-color);
    border-top: 1px solid var(--primary-border-color);
    padding: 1.6rem 2.4rem;
    z-index: 9999;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);

    ${media.mobile} {
        padding: 1.2rem;
    }
`;

const BannerContent = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2.4rem;
    max-width: 120rem;
    margin: 0 auto;

    ${media.tablet} {
        flex-direction: column;
        gap: 1.2rem;
    }
`;

const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    ${media.tablet} {
        display: flex;
    }

    @media (min-width: 769px) {
        display: none;
    }
`;

const TextContent = styled.div`
    flex: 1;

    ${media.tablet} {
        text-align: center;
    }
`;

const Title = styled.p`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin-bottom: 0.4rem;

    ${media.tablet} {
        display: none;
    }
`;

const MobileTitle = styled.p`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const Description = styled.p`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    line-height: 1.6;
`;

const PrivacyLink = styled(Link)`
    color: var(--tertiary-text-color);
    text-decoration: underline;
    transition: color 0.2s ease;

    &:hover {
        color: var(--primary-text-color);
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    flex-shrink: 0;

    ${media.tablet} {
        display: none;
    }
`;

const MobileButtonContainer = styled.div`
    display: none;

    ${media.tablet} {
        display: flex;
        width: 100%;
    }

    ${media.mobile} {
        margin-bottom: 2.2rem;
    }
`;

const AcceptButton = styled.button`
    background-color: var(--tertiary-text-color);
    color: white;
    border: none;
    padding: 1rem 2.4rem;
    font-size: 1.4rem;
    font-weight: 500;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }

    ${media.tablet} {
        width: 100%;
        padding: 1.2rem;
    }
`;

function ConsentBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [language, setLanguage] = useState("en");
    const t = content[language];

    useEffect(() => {
        const consent = localStorage.getItem(CONSENT_KEY);
        if (!consent) {
            setShowBanner(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(CONSENT_KEY, "accepted");
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <Banner>
            <BannerContent>
                {/* Mobile/Tablet: Title + Language Toggle in einer Zeile */}
                <HeaderRow>
                    <MobileTitle>{t.title}</MobileTitle>
                    <LanguageToggle
                        language={language}
                        onLanguageChange={setLanguage}
                    />
                </HeaderRow>

                <TextContent>
                    {/* Desktop: Title hier */}
                    <Title>{t.title}</Title>
                    <Description>
                        {t.description}{" "}
                        <PrivacyLink to="/privacy">{t.learnMore}</PrivacyLink>
                    </Description>
                </TextContent>

                {/* Desktop: Buttons rechts */}
                <ButtonContainer>
                    <LanguageToggle
                        language={language}
                        onLanguageChange={setLanguage}
                    />
                    <AcceptButton onClick={handleAccept}>
                        {t.accept}
                    </AcceptButton>
                </ButtonContainer>

                {/* Mobile/Tablet: Button volle Breite unten */}
                <MobileButtonContainer>
                    <AcceptButton onClick={handleAccept}>
                        {t.accept}
                    </AcceptButton>
                </MobileButtonContainer>
            </BannerContent>
        </Banner>
    );
}

export default ConsentBanner;
