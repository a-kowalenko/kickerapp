import styled, { keyframes } from "styled-components";
import {
    HiOutlineComputerDesktop,
    HiOutlineDevicePhoneMobile,
} from "react-icons/hi2";
import { media } from "../../utils/constants";

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Section = styled.section`
    padding: 4rem 4rem;
    max-width: 120rem;
    margin: 0 auto;

    ${media.tablet} {
        padding: 3rem 2rem;
    }

    ${media.mobile} {
        padding: 2rem 1.5rem;
    }
`;

const SectionTitle = styled.h2`
    font-size: 2.4rem;
    color: var(--primary-text-color);
    margin-bottom: 0.5rem;
    text-align: center;

    ${media.tablet} {
        font-size: 2rem;
    }
`;

const SectionSubtitle = styled.p`
    font-size: 1.5rem;
    color: var(--secondary-text-color);
    text-align: center;
    margin-bottom: 3rem;

    ${media.tablet} {
        font-size: 1.3rem;
        margin-bottom: 2rem;
    }
`;

const ShowcaseGrid = styled.div`
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 3rem;
    align-items: center;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
`;

const DeviceContainer = styled.div`
    position: relative;
    animation: ${fadeIn} 0.6s ease-out;
    animation-delay: ${(props) => props.$delay || "0s"};
    animation-fill-mode: both;
`;

const DeviceBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1.2rem;
    background-color: var(--color-${(props) => props.$color}-100);
    color: var(--color-${(props) => props.$color}-700);
    border-radius: 2rem;
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;

    & svg {
        width: 1.6rem;
        height: 1.6rem;
    }
`;

const DesktopFrame = styled.div`
    background: var(--color-grey-100);
    border-radius: 1rem;
    padding: 0.8rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);

    &::before {
        content: "";
        display: block;
        height: 2.4rem;
        background: linear-gradient(
            90deg,
            var(--color-grey-300) 0.8rem,
            transparent 0.8rem,
            transparent 1.6rem,
            var(--color-grey-300) 1.6rem,
            var(--color-grey-300) 2.4rem,
            transparent 2.4rem,
            transparent 3.2rem,
            var(--color-grey-300) 3.2rem,
            var(--color-grey-300) 4rem,
            transparent 4rem
        );
        background-size: 6rem 0.8rem;
        background-repeat: no-repeat;
        background-position: 1rem center;
        border-radius: 0.6rem 0.6rem 0 0;
        margin-bottom: 0.4rem;
    }
`;

const MobileFrame = styled.div`
    background: var(--color-grey-200);
    border-radius: 2.5rem;
    padding: 1rem;
    max-width: 28rem;
    margin: 0 auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);

    &::before {
        content: "";
        display: block;
        width: 8rem;
        height: 0.4rem;
        background: var(--color-grey-400);
        border-radius: 0.2rem;
        margin: 0 auto 0.8rem;
    }

    @media (max-width: 900px) {
        max-width: 24rem;
    }
`;

const ScreenshotImage = styled.img`
    width: 100%;
    height: auto;
    border-radius: ${(props) => (props.$mobile ? "1.5rem" : "0.4rem")};
    display: block;
`;

const PlaceholderScreen = styled.div`
    width: 100%;
    aspect-ratio: ${(props) => (props.$mobile ? "9 / 16" : "16 / 10")};
    background: linear-gradient(
        135deg,
        var(--color-grey-200) 0%,
        var(--color-grey-300) 100%
    );
    border-radius: ${(props) => (props.$mobile ? "1.5rem" : "0.4rem")};
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-grey-500);
    font-size: 1.4rem;
    font-style: italic;
`;

function PlatformShowcase({ desktopScreenshot, mobileScreenshot }) {
    return (
        <Section>
            <SectionTitle>Play anywhere</SectionTitle>
            <SectionSubtitle>
                Full experience on desktop and mobile devices
            </SectionSubtitle>
            <ShowcaseGrid>
                <DeviceContainer $delay="0.1s">
                    <DeviceBadge $color="blue">
                        <HiOutlineComputerDesktop />
                        Desktop Experience
                    </DeviceBadge>
                    <DesktopFrame>
                        {desktopScreenshot ? (
                            <ScreenshotImage
                                src={desktopScreenshot}
                                alt="KickerApp Desktop Dashboard"
                                loading="lazy"
                            />
                        ) : (
                            <PlaceholderScreen>
                                Desktop screenshot coming soon
                            </PlaceholderScreen>
                        )}
                    </DesktopFrame>
                </DeviceContainer>

                <DeviceContainer $delay="0.3s">
                    <DeviceBadge $color="green">
                        <HiOutlineDevicePhoneMobile />
                        Mobile Ready
                    </DeviceBadge>
                    <MobileFrame>
                        {mobileScreenshot ? (
                            <ScreenshotImage
                                src={mobileScreenshot}
                                alt="KickerApp Mobile Dashboard"
                                $mobile
                                loading="lazy"
                            />
                        ) : (
                            <PlaceholderScreen $mobile>
                                Mobile screenshot coming soon
                            </PlaceholderScreen>
                        )}
                    </MobileFrame>
                </DeviceContainer>
            </ShowcaseGrid>
        </Section>
    );
}

export default PlatformShowcase;
