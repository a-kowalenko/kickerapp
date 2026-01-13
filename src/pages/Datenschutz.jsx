import { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi2";
import LanguageToggle from "../ui/LanguageToggle";
import { media } from "../utils/constants";

const StyledDatenschutz = styled.div`
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

const SubSectionTitle = styled.h3`
    font-size: 1.6rem;
    margin-bottom: 0.8rem;
    margin-top: 1.6rem;
    color: var(--primary-text-color);

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

const Text = styled.p`
    font-size: 1.4rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    color: var(--secondary-text-color);
`;

const List = styled.ul`
    font-size: 1.4rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    margin-left: 2rem;
    color: var(--secondary-text-color);
`;

const ListItem = styled.li`
    margin-bottom: 0.5rem;
`;

const EmailLink = styled.a`
    color: var(--tertiary-text-color);
    transition: color 0.2s ease;

    &:hover {
        color: var(--primary-text-color);
    }
`;

const ExternalLink = styled.a`
    color: var(--tertiary-text-color);
    transition: color 0.2s ease;

    &:hover {
        color: var(--primary-text-color);
    }
`;

const content = {
    de: {
        back: "Zurück zur Startseite",
        title: "Datenschutzerklärung",
        lastUpdated: "Stand: Januar 2026",

        // Section 1: General
        generalTitle: "1. Allgemeine Hinweise",
        generalText: `Diese Datenschutzerklärung informiert Sie über die Art, den Umfang und 
        den Zweck der Verarbeitung personenbezogener Daten auf dieser Webseite. Diese Webseite 
        ist ein privates, nicht-kommerzielles Hobbyprojekt.`,

        // Section 2: Responsible
        responsibleTitle: "2. Verantwortlicher",
        responsibleText:
            "Verantwortlich für die Datenverarbeitung auf dieser Webseite:",
        name: "Andreas Kowalenko",
        address: "Große Pfarrgasse 7",
        city: "34369 Hofgeismar",
        phone: "Telefon:",
        phoneNumber: "+49 (0)160 995 01 966",
        email: "E-Mail:",
        emailAddress: "info@kickerapp.dev",

        // Section 3: Hosting
        hostingTitle: "3. Hosting",
        hostingText: `Diese Webseite wird bei Vercel Inc. gehostet. Beim Besuch der Webseite 
        werden automatisch Informationen in sogenannten Server-Log-Dateien gespeichert, die Ihr 
        Browser automatisch übermittelt. Dies sind:`,
        hostingList: [
            "Browsertyp und Browserversion",
            "Verwendetes Betriebssystem",
            "Referrer URL",
            "IP-Adresse (anonymisiert)",
            "Uhrzeit der Serveranfrage",
        ],
        hostingProvider:
            "Anbieter: Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA",
        hostingPrivacy: "Datenschutzerklärung von Vercel:",
        hostingPrivacyLink: "https://vercel.com/legal/privacy-policy",

        // Section 4: Backend/Database
        backendTitle: "4. Backend und Datenbank",
        backendText: `Für die Speicherung von Benutzerdaten und die Authentifizierung wird 
        Supabase verwendet. Supabase ist ein Open-Source-Backend-as-a-Service-Anbieter.`,
        backendDataTitle: "Gespeicherte Daten:",
        backendDataList: [
            "E-Mail-Adresse (für die Registrierung und Anmeldung)",
            "Benutzername",
            "Spielstatistiken und -ergebnisse",
            "Spielerprofilinformationen",
        ],
        backendProvider:
            "Anbieter: Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992",
        backendPrivacy: "Datenschutzerklärung von Supabase:",
        backendPrivacyLink: "https://supabase.com/privacy",

        // Section 5: Cookies
        cookiesTitle: "5. Cookies",
        cookiesText: `Diese Webseite verwendet ausschließlich technisch notwendige Cookies, 
        die für den Betrieb der Webseite erforderlich sind.`,
        cookiesTypesTitle: "Verwendete Cookies:",
        cookiesTypesList: [
            "Session-Cookies für die Authentifizierung (Supabase Auth)",
            "Einstellungs-Cookies (z.B. Dark Mode Präferenz)",
            "Cookie-Consent-Cookie zur Speicherung Ihrer Einwilligung",
        ],
        cookiesNote: `Diese Cookies sind für die Nutzung der Webseite unbedingt erforderlich 
        und können nicht deaktiviert werden. Es werden keine Tracking- oder Werbe-Cookies verwendet.`,

        // Section 6: Rights
        rightsTitle: "6. Ihre Rechte",
        rightsText:
            "Sie haben jederzeit folgende Rechte bezüglich Ihrer personenbezogenen Daten:",
        rightsList: [
            "Recht auf Auskunft (Art. 15 DSGVO)",
            "Recht auf Berichtigung (Art. 16 DSGVO)",
            "Recht auf Löschung (Art. 17 DSGVO)",
            "Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)",
            "Recht auf Datenübertragbarkeit (Art. 20 DSGVO)",
            "Widerspruchsrecht (Art. 21 DSGVO)",
        ],
        rightsContact: `Um Ihre Rechte auszuüben, wenden Sie sich bitte per E-Mail an die 
        oben genannte Adresse.`,

        // Section 7: Data Security
        securityTitle: "7. Datensicherheit",
        securityText: `Diese Webseite nutzt aus Sicherheitsgründen und zum Schutz der 
        Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine 
        verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers 
        von "http://" auf "https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.`,

        // Section 8: Changes
        changesTitle: "8. Änderungen dieser Datenschutzerklärung",
        changesText: `Diese Datenschutzerklärung kann von Zeit zu Zeit aktualisiert werden. 
        Die aktuelle Version finden Sie stets auf dieser Seite.`,
    },
    en: {
        back: "Back to Homepage",
        title: "Privacy Policy",
        lastUpdated: "Last updated: January 2026",

        // Section 1: General
        generalTitle: "1. General Information",
        generalText: `This privacy policy informs you about the nature, scope, and purpose 
        of the processing of personal data on this website. This website is a private, 
        non-commercial hobby project.`,

        // Section 2: Responsible
        responsibleTitle: "2. Data Controller",
        responsibleText: "Responsible for data processing on this website:",
        name: "Andreas Kowalenko",
        address: "Große Pfarrgasse 7",
        city: "34369 Hofgeismar",
        phone: "Phone:",
        phoneNumber: "+49 (0)160 995 01 966",
        email: "Email:",
        emailAddress: "info@kickerapp.dev",

        // Section 3: Hosting
        hostingTitle: "3. Hosting",
        hostingText: `This website is hosted by Vercel Inc. When visiting the website, 
        information is automatically stored in so-called server log files, which your 
        browser automatically transmits. These are:`,
        hostingList: [
            "Browser type and version",
            "Operating system used",
            "Referrer URL",
            "IP address (anonymized)",
            "Time of server request",
        ],
        hostingProvider:
            "Provider: Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA",
        hostingPrivacy: "Vercel's Privacy Policy:",
        hostingPrivacyLink: "https://vercel.com/legal/privacy-policy",

        // Section 4: Backend/Database
        backendTitle: "4. Backend and Database",
        backendText: `Supabase is used for storing user data and authentication. 
        Supabase is an open-source Backend-as-a-Service provider.`,
        backendDataTitle: "Data stored:",
        backendDataList: [
            "Email address (for registration and login)",
            "Username",
            "Game statistics and results",
            "Player profile information",
        ],
        backendProvider:
            "Provider: Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992",
        backendPrivacy: "Supabase's Privacy Policy:",
        backendPrivacyLink: "https://supabase.com/privacy",

        // Section 5: Cookies
        cookiesTitle: "5. Cookies",
        cookiesText: `This website only uses technically necessary cookies that are 
        required for the operation of the website.`,
        cookiesTypesTitle: "Cookies used:",
        cookiesTypesList: [
            "Session cookies for authentication (Supabase Auth)",
            "Preference cookies (e.g., Dark Mode preference)",
            "Cookie consent cookie to store your consent",
        ],
        cookiesNote: `These cookies are strictly necessary for the use of the website 
        and cannot be disabled. No tracking or advertising cookies are used.`,

        // Section 6: Rights
        rightsTitle: "6. Your Rights",
        rightsText:
            "You have the following rights regarding your personal data at any time:",
        rightsList: [
            "Right of access (Art. 15 GDPR)",
            "Right to rectification (Art. 16 GDPR)",
            "Right to erasure (Art. 17 GDPR)",
            "Right to restriction of processing (Art. 18 GDPR)",
            "Right to data portability (Art. 20 GDPR)",
            "Right to object (Art. 21 GDPR)",
        ],
        rightsContact: `To exercise your rights, please contact us by email at the 
        address mentioned above.`,

        // Section 7: Data Security
        securityTitle: "7. Data Security",
        securityText: `For security reasons and to protect the transmission of 
        confidential content, this website uses SSL or TLS encryption. You can 
        recognize an encrypted connection by the fact that the address line of 
        the browser changes from "http://" to "https://" and by the lock symbol 
        in your browser line.`,

        // Section 8: Changes
        changesTitle: "8. Changes to this Privacy Policy",
        changesText: `This privacy policy may be updated from time to time. 
        The current version can always be found on this page.`,
    },
};

function Datenschutz() {
    const [language, setLanguage] = useState("en");
    const t = content[language];

    return (
        <StyledDatenschutz>
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
                <Text>
                    <em>{t.lastUpdated}</em>
                </Text>

                {/* Section 1: General */}
                <Section>
                    <SectionTitle>{t.generalTitle}</SectionTitle>
                    <Text>{t.generalText}</Text>
                </Section>

                {/* Section 2: Responsible */}
                <Section>
                    <SectionTitle>{t.responsibleTitle}</SectionTitle>
                    <Text>{t.responsibleText}</Text>
                    <Text>
                        {t.name}
                        <br />
                        {t.address}
                        <br />
                        {t.city}
                    </Text>
                    <Text>
                        {t.phone}{" "}
                        <EmailLink href={`tel:${t.phoneNumber}`}>
                            {t.phoneNumber}
                        </EmailLink>
                        <br />
                        {t.email}{" "}
                        <EmailLink href={`mailto:${t.emailAddress}`}>
                            {t.emailAddress}
                        </EmailLink>
                    </Text>
                </Section>

                {/* Section 3: Hosting */}
                <Section>
                    <SectionTitle>{t.hostingTitle}</SectionTitle>
                    <Text>{t.hostingText}</Text>
                    <List>
                        {t.hostingList.map((item, index) => (
                            <ListItem key={index}>{item}</ListItem>
                        ))}
                    </List>
                    <Text>{t.hostingProvider}</Text>
                    <Text>
                        {t.hostingPrivacy}{" "}
                        <ExternalLink
                            href={t.hostingPrivacyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {t.hostingPrivacyLink}
                        </ExternalLink>
                    </Text>
                </Section>

                {/* Section 4: Backend */}
                <Section>
                    <SectionTitle>{t.backendTitle}</SectionTitle>
                    <Text>{t.backendText}</Text>
                    <SubSectionTitle>{t.backendDataTitle}</SubSectionTitle>
                    <List>
                        {t.backendDataList.map((item, index) => (
                            <ListItem key={index}>{item}</ListItem>
                        ))}
                    </List>
                    <Text>{t.backendProvider}</Text>
                    <Text>
                        {t.backendPrivacy}{" "}
                        <ExternalLink
                            href={t.backendPrivacyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {t.backendPrivacyLink}
                        </ExternalLink>
                    </Text>
                </Section>

                {/* Section 5: Cookies */}
                <Section>
                    <SectionTitle>{t.cookiesTitle}</SectionTitle>
                    <Text>{t.cookiesText}</Text>
                    <SubSectionTitle>{t.cookiesTypesTitle}</SubSectionTitle>
                    <List>
                        {t.cookiesTypesList.map((item, index) => (
                            <ListItem key={index}>{item}</ListItem>
                        ))}
                    </List>
                    <Text>{t.cookiesNote}</Text>
                </Section>

                {/* Section 6: Rights */}
                <Section>
                    <SectionTitle>{t.rightsTitle}</SectionTitle>
                    <Text>{t.rightsText}</Text>
                    <List>
                        {t.rightsList.map((item, index) => (
                            <ListItem key={index}>{item}</ListItem>
                        ))}
                    </List>
                    <Text>{t.rightsContact}</Text>
                </Section>

                {/* Section 7: Security */}
                <Section>
                    <SectionTitle>{t.securityTitle}</SectionTitle>
                    <Text>{t.securityText}</Text>
                </Section>

                {/* Section 8: Changes */}
                <Section>
                    <SectionTitle>{t.changesTitle}</SectionTitle>
                    <Text>{t.changesText}</Text>
                </Section>
            </Content>
        </StyledDatenschutz>
    );
}

export default Datenschutz;
