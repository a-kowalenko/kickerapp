import { useState, useEffect, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import {
    HiOutlinePlay,
    HiOutlinePause,
    HiChevronLeft,
    HiChevronRight,
} from "react-icons/hi2";
import { media } from "../../utils/constants";

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const Section = styled.section`
    padding: 4rem 4rem;
    max-width: 100rem;
    margin: 0 auto;

    ${media.tablet} {
        padding: 3rem 2rem;
    }

    ${media.mobile} {
        padding: 2rem 1rem;
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
    margin-bottom: 2rem;

    ${media.tablet} {
        font-size: 1.3rem;
    }
`;

const CarouselContainer = styled.div`
    position: relative;
    overflow: hidden;
    border-radius: var(--border-radius-lg);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    background: var(--color-grey-100);
`;

const SlideWrapper = styled.div.attrs((props) => ({
    style: {
        transform: `translateX(-${props.$currentIndex * 100}%)`,
    },
}))`
    display: flex;
    transition: transform 0.5s ease-in-out;
`;

const Slide = styled.div`
    min-width: 100%;
    position: relative;
`;

const SlideImage = styled.img`
    width: 100%;
    height: auto;
    display: block;
    animation: ${fadeIn} 0.3s ease-out;
`;

const PlaceholderSlide = styled.div`
    width: 100%;
    aspect-ratio: 16 / 9;
    background: linear-gradient(
        135deg,
        var(--color-grey-200) 0%,
        var(--color-grey-300) 100%
    );
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--color-grey-500);
    gap: 1rem;
`;

const PlaceholderText = styled.span`
    font-size: 1.6rem;
    font-style: italic;
`;

const SlideCaption = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 2rem;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
    color: white;

    ${media.mobile} {
        padding: 1rem;
    }
`;

const CaptionTitle = styled.h3`
    font-size: 1.6rem;
    margin: 0 0 0.4rem;

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

const CaptionDescription = styled.p`
    font-size: 1.3rem;
    margin: 0;
    opacity: 0.9;

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const Controls = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    margin-top: 1.5rem;
`;

const NavButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border: none;
    border-radius: 50%;
    background: var(--color-grey-100);
    color: var(--primary-text-color);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: var(--color-grey-200);
        transform: scale(1.1);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }

    & svg {
        width: 2rem;
        height: 2rem;
    }

    ${media.mobile} {
        width: 3.6rem;
        height: 3.6rem;

        & svg {
            width: 1.8rem;
            height: 1.8rem;
        }
    }
`;

const PlayPauseButton = styled(NavButton)`
    background: var(--color-brand-600);
    color: white;

    &:hover {
        background: var(--color-brand-700);
    }
`;

const DotsContainer = styled.div`
    display: flex;
    gap: 0.8rem;
`;

const Dot = styled.button`
    width: 1rem;
    height: 1rem;
    border: none;
    border-radius: 50%;
    background: ${(props) =>
        props.$active ? "var(--color-brand-600)" : "var(--color-grey-300)"};
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;

    &:hover {
        background: ${(props) =>
            props.$active ? "var(--color-brand-600)" : "var(--color-grey-400)"};
        transform: scale(1.2);
    }
`;

const ProgressBar = styled.div`
    height: 0.3rem;
    background: var(--color-grey-200);
    border-radius: 0.15rem;
    overflow: hidden;
    margin-top: 1rem;
`;

const ProgressFill = styled.div.attrs((props) => ({
    style: {
        width: `${props.$progress}%`,
    },
}))`
    height: 100%;
    background: var(--color-brand-600);
    transition: width 0.1s linear;
`;

import { screenshotsUrl } from "../../services/supabase";

// Screenshot filenames - hosted in Supabase Storage bucket "screenshots"
const SCREENSHOT_FILES = {
    dashboard: "dashboard.png",
    rankings: "rankings.png",
    matchCreate: "match-create.png",
    achievements: "achievements.png",
    playerProfile: "player-profile.png",
};

// Default screenshots config
const defaultScreenshots = [
    {
        src: `${screenshotsUrl}/${SCREENSHOT_FILES.dashboard}`,
        title: "Dashboard Overview",
        description:
            "Track your daily stats, recent matches, and player activity at a glance.",
    },
    {
        src: `${screenshotsUrl}/${SCREENSHOT_FILES.rankings}`,
        title: "MMR Rankings",
        description:
            "Compete on the leaderboard with our skill-based rating system.",
    },
    {
        src: `${screenshotsUrl}/${SCREENSHOT_FILES.matchCreate}`,
        title: "Quick Match Creation",
        description:
            "Start a new match in seconds with our intuitive interface.",
    },
    {
        src: `${screenshotsUrl}/${SCREENSHOT_FILES.achievements}`,
        title: "Achievements & Badges",
        description: "Unlock achievements and show off your accomplishments.",
    },
    {
        src: `${screenshotsUrl}/${SCREENSHOT_FILES.playerProfile}`,
        title: "Player Profiles",
        description: "Detailed statistics and match history for every player.",
    },
];

function ScreenshotCarousel({
    id,
    screenshots = defaultScreenshots,
    autoplayInterval = 5000,
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [loadedImages, setLoadedImages] = useState({});
    const [imageErrors, setImageErrors] = useState({});
    const progressRef = useRef(null);
    const containerRef = useRef(null);

    const totalSlides = screenshots.length;

    const goToSlide = useCallback((index) => {
        setCurrentIndex(index);
        setProgress(0);
    }, []);

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
        setProgress(0);
    }, [totalSlides]);

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
        setProgress(0);
    }, [totalSlides]);

    // Autoplay logic
    useEffect(() => {
        if (!isPlaying) return;

        const startTime = Date.now();

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const newProgress = (elapsed / autoplayInterval) * 100;

            if (newProgress >= 100) {
                goNext();
            } else {
                setProgress(newProgress);
                progressRef.current = requestAnimationFrame(updateProgress);
            }
        };

        progressRef.current = requestAnimationFrame(updateProgress);

        return () => {
            if (progressRef.current) {
                cancelAnimationFrame(progressRef.current);
            }
        };
    }, [isPlaying, currentIndex, autoplayInterval, goNext]);

    // Pause on hover/touch
    const handleMouseEnter = () => setIsPlaying(false);
    const handleMouseLeave = () => setIsPlaying(true);

    // Prefetch next image
    useEffect(() => {
        const nextIndex = (currentIndex + 1) % totalSlides;
        const nextSrc = screenshots[nextIndex]?.src;

        if (nextSrc && !loadedImages[nextSrc] && !imageErrors[nextSrc]) {
            const link = document.createElement("link");
            link.rel = "prefetch";
            link.href = nextSrc;
            link.as = "image";
            document.head.appendChild(link);

            return () => {
                document.head.removeChild(link);
            };
        }
    }, [currentIndex, screenshots, totalSlides, loadedImages, imageErrors]);

    // Track loaded images
    const handleImageLoad = (src) => {
        setLoadedImages((prev) => ({ ...prev, [src]: true }));
    };

    const handleImageError = (src) => {
        setImageErrors((prev) => ({ ...prev, [src]: true }));
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
            if (e.key === " ") {
                e.preventDefault();
                setIsPlaying((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goNext, goPrev]);

    // Touch swipe support
    const touchStartX = useRef(0);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        setIsPlaying(false);
    };

    const handleTouchEnd = (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goNext();
            } else {
                goPrev();
            }
        }
    };

    return (
        <Section id={id}>
            <SectionTitle>See it in action</SectionTitle>
            <SectionSubtitle>
                Explore the features that make KickerApp unique
            </SectionSubtitle>
            <CarouselContainer
                ref={containerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <SlideWrapper $currentIndex={currentIndex}>
                    {screenshots.map((screenshot, index) => {
                        const isCurrentOrNext =
                            index === currentIndex ||
                            index === (currentIndex + 1) % totalSlides;
                        const hasError = imageErrors[screenshot.src];

                        return (
                            <Slide key={screenshot.src}>
                                {hasError ? (
                                    <PlaceholderSlide>
                                        <PlaceholderText>
                                            {screenshot.title}
                                        </PlaceholderText>
                                        <PlaceholderText>
                                            Screenshot coming soon
                                        </PlaceholderText>
                                    </PlaceholderSlide>
                                ) : (
                                    <SlideImage
                                        src={screenshot.src}
                                        alt={screenshot.title}
                                        loading={
                                            isCurrentOrNext ? "eager" : "lazy"
                                        }
                                        onLoad={() =>
                                            handleImageLoad(screenshot.src)
                                        }
                                        onError={() =>
                                            handleImageError(screenshot.src)
                                        }
                                    />
                                )}
                                <SlideCaption>
                                    <CaptionTitle>
                                        {screenshot.title}
                                    </CaptionTitle>
                                    <CaptionDescription>
                                        {screenshot.description}
                                    </CaptionDescription>
                                </SlideCaption>
                            </Slide>
                        );
                    })}
                </SlideWrapper>
                <ProgressBar>
                    <ProgressFill $progress={progress} />
                </ProgressBar>
            </CarouselContainer>

            <Controls>
                <NavButton onClick={goPrev} aria-label="Previous slide">
                    <HiChevronLeft />
                </NavButton>

                <DotsContainer>
                    {screenshots.map((_, index) => (
                        <Dot
                            key={index}
                            $active={index === currentIndex}
                            onClick={() => goToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </DotsContainer>

                <PlayPauseButton
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? "Pause autoplay" : "Start autoplay"}
                >
                    {isPlaying ? <HiOutlinePause /> : <HiOutlinePlay />}
                </PlayPauseButton>

                <NavButton onClick={goNext} aria-label="Next slide">
                    <HiChevronRight />
                </NavButton>
            </Controls>
        </Section>
    );
}

export default ScreenshotCarousel;
