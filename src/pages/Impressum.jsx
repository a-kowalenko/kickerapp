import { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi2";
import LanguageToggle from "../ui/LanguageToggle";
import { media } from "../utils/constants";

const StyledImpressum = styled.div`
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
    margin-bottom: 3.2rem;
    color: var(--primary-text-color);

    ${media.mobile} {
        font-size: 2.4rem;
    }
`;

const Section = styled.section`
    margin-bottom: 2.4rem;
`;

const SectionTitle = styled.h2`
    font-size: 2rem;
    margin-bottom: 1.2rem;
    color: var(--primary-text-color);

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const Text = styled.p`
    font-size: 1.4rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    color: var(--secondary-text-color);
`;

const ContactInfo = styled.div`
    font-size: 1.4rem;
    line-height: 2;
    color: var(--secondary-text-color);
`;

const EmailLink = styled.a`
    color: var(--tertiary-text-color);
    transition: color 0.2s ease;

    &:hover {
        color: var(--primary-text-color);
    }
`;

const content = {
    de: {
        back: "Zurück zur Startseite",
        title: "Impressum",
        responsibleTitle: "Angaben gemäß § 5 DDG",
        responsibleText: "Verantwortlich für den Inhalt:",
        name: "Andreas Kowalenko",
        address: "Große Pfarrgasse 7",
        city: "34369 Hofgeismar",
        country: "Deutschland",
        contactTitle: "Kontakt",
        phone: "Telefon:",
        phoneNumber: "+49 (0)160 995 01 966",
        email: "E-Mail:",
        emailAddress: "info@kickerapp.dev",
        disclaimerTitle: "Haftungsausschluss",
        disclaimerContent: `Diese Webseite ist ein privates, nicht-kommerzielles Hobbyprojekt. 
        Der Betreiber übernimmt keine Gewähr für die Aktualität, Korrektheit, Vollständigkeit 
        oder Qualität der bereitgestellten Informationen. Haftungsansprüche gegen den Betreiber, 
        welche sich auf Schäden materieller oder ideeller Art beziehen, die durch die Nutzung 
        oder Nichtnutzung der dargebotenen Informationen bzw. durch die Nutzung fehlerhafter 
        und unvollständiger Informationen verursacht wurden, sind grundsätzlich ausgeschlossen, 
        sofern seitens des Betreibers kein nachweislich vorsätzliches oder grob fahrlässiges 
        Verschulden vorliegt.`,
        linksTitle: "Haftung für Links",
        linksContent: `Diese Webseite enthält Links zu externen Webseiten Dritter, auf deren 
        Inhalte der Betreiber keinen Einfluss hat. Deshalb kann für diese fremden Inhalte auch 
        keine Gewähr übernommen werden. Für die Inhalte der verlinkten Seiten ist stets der 
        jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden 
        zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte 
        waren zum Zeitpunkt der Verlinkung nicht erkennbar.`,
        copyrightTitle: "Urheberrecht",
        copyrightContent: `Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen 
        Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, 
        Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen 
        der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.`,
        projectNote: `Dies ist ein privates Hobbyprojekt ohne kommerzielle Absichten. 
        Es werden keine Einnahmen generiert.`,
    },
    en: {
        back: "Back to Homepage",
        title: "Legal Notice",
        responsibleTitle:
            "Information according to § 5 DDG (German Digital Services Act)",
        responsibleText: "Responsible for content:",
        name: "Andreas Kowalenko",
        address: "Große Pfarrgasse 7",
        city: "34369 Hofgeismar",
        country: "Germany",
        contactTitle: "Contact",
        phone: "Phone:",
        phoneNumber: "+49 (0)160 995 01 966",
        email: "Email:",
        emailAddress: "info@kickerapp.dev",
        disclaimerTitle: "Disclaimer",
        disclaimerContent: `This website is a private, non-commercial hobby project. 
        The operator assumes no liability for the timeliness, correctness, completeness, 
        or quality of the information provided. Liability claims against the operator relating 
        to material or immaterial damages caused by the use or non-use of the information provided 
        or by the use of incorrect and incomplete information are fundamentally excluded, 
        unless there is evidence of intentional or grossly negligent fault on the part of the operator.`,
        linksTitle: "Liability for Links",
        linksContent: `This website contains links to external third-party websites over whose 
        content the operator has no influence. Therefore, no guarantee can be given for this 
        external content. The respective provider or operator of the linked pages is always 
        responsible for the content of the linked pages. The linked pages were checked for 
        possible legal violations at the time of linking. Illegal content was not recognizable 
        at the time of linking.`,
        copyrightTitle: "Copyright",
        copyrightContent: `The content and works created by the site operator on these pages are 
        subject to German copyright law. Reproduction, processing, distribution, and any kind of 
        exploitation outside the limits of copyright law require the written consent of the 
        respective author or creator.`,
        projectNote: `This is a private hobby project without commercial intentions. 
        No revenue is generated.`,
    },
};

function Impressum() {
    const [language, setLanguage] = useState("en");
    const t = content[language];

    return (
        <StyledImpressum>
            <Content>
                <Header>
                    <BackLink to="/">
                        <HiArrowLeft />
                        {t.back}
                    </BackLink>
                    <LanguageToggle
                        language={language}
                        onLanguageChange={setLanguage}
                    />
                </Header>

                <Title>{t.title}</Title>

                <Section>
                    <SectionTitle>{t.responsibleTitle}</SectionTitle>
                    <Text>{t.responsibleText}</Text>
                    <ContactInfo>
                        {t.name}
                        <br />
                        {t.address}
                        <br />
                        {t.city}
                        <br />
                        {t.country}
                    </ContactInfo>
                </Section>

                <Section>
                    <SectionTitle>{t.contactTitle}</SectionTitle>
                    <ContactInfo>
                        {t.phone}{" "}
                        <EmailLink href={`tel:${t.phoneNumber}`}>
                            {t.phoneNumber}
                        </EmailLink>
                        <br />
                        {t.email}{" "}
                        <EmailLink href={`mailto:${t.emailAddress}`}>
                            {t.emailAddress}
                        </EmailLink>
                    </ContactInfo>
                </Section>

                <Section>
                    <SectionTitle>{t.disclaimerTitle}</SectionTitle>
                    <Text>{t.disclaimerContent}</Text>
                    <Text>
                        <em>{t.projectNote}</em>
                    </Text>
                </Section>

                <Section>
                    <SectionTitle>{t.linksTitle}</SectionTitle>
                    <Text>{t.linksContent}</Text>
                </Section>

                <Section>
                    <SectionTitle>{t.copyrightTitle}</SectionTitle>
                    <Text>{t.copyrightContent}</Text>
                </Section>
            </Content>
        </StyledImpressum>
    );
}

export default Impressum;
