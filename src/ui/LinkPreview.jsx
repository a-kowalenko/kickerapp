import styled, { keyframes } from "styled-components";
import { useState, useCallback } from "react";
import { HiOutlineExclamationCircle, HiOutlineGlobeAlt } from "react-icons/hi2";
import { useLinkPreview } from "../hooks/useLinkPreview";
import { media } from "../utils/constants";

/* ----------------------------------------
   Animations
----------------------------------------- */
const shimmer = keyframes`
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

/* ----------------------------------------
   Styled Components
----------------------------------------- */
const CardLink = styled.a`
    display: flex;
    flex-direction: row;
    text-decoration: none;
    color: inherit;
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    margin: 0.4rem 0;
    max-width: 48rem;
    background: var(--secondary-background-color);
    transition: border-color 0.2s, box-shadow 0.2s;

    &:hover {
        border-color: var(--primary-button-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    ${media.tablet} {
        flex-direction: column;
        max-width: 100%;
    }
`;

const ImageContainer = styled.div`
    width: 18rem;
    min-width: 18rem;
    height: 12rem;
    flex-shrink: 0;
    overflow: hidden;
    background: ${(props) =>
        props.$isLoaded
            ? "var(--tertiary-background-color)"
            : `linear-gradient(90deg, var(--tertiary-background-color) 25%, var(--secondary-background-color) 50%, var(--tertiary-background-color) 75%)`};
    background-size: 200% 100%;
    animation: ${(props) => (props.$isLoaded ? "none" : shimmer)} 1.5s infinite;
    display: flex;
    align-items: center;
    justify-content: center;

    ${media.tablet} {
        width: 100%;
        min-width: unset;
        height: 16rem;
    }
`;

const PreviewImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: ${(props) => (props.$isLoaded ? 1 : 0)};
    transition: opacity 0.2s ease-in;
`;

const PlaceholderIcon = styled.div`
    color: var(--secondary-text-color);
    font-size: 3rem;
    opacity: 0.5;
`;

const Content = styled.div`
    flex: 1;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
    justify-content: center;
`;

const SiteName = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1.1rem;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const Favicon = styled.img`
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 2px;
`;

const Title = styled.div`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const Description = styled.div`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const UrlText = styled.div`
    font-size: 1.1rem;
    color: var(--link-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

/* ----------------------------------------
   Fallback Components
----------------------------------------- */
const FallbackLink = styled.a`
    color: var(--link-text-color);
    text-decoration: none;
    word-break: break-all;

    &:hover {
        text-decoration: underline;
    }
`;

const ErrorIndicator = styled.span`
    color: var(--secondary-text-color);
    font-size: 1.1rem;
    margin-left: 0.4rem;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    opacity: 0.7;

    svg {
        font-size: 1.2rem;
    }
`;

/* ----------------------------------------
   Skeleton Components
----------------------------------------- */
const SkeletonCard = styled.div`
    display: flex;
    flex-direction: row;
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    margin: 0.4rem 0;
    max-width: 48rem;
    background: var(--secondary-background-color);

    ${media.tablet} {
        flex-direction: column;
        max-width: 100%;
    }
`;

const SkeletonImage = styled.div`
    width: 18rem;
    min-width: 18rem;
    height: 12rem;
    background: linear-gradient(
        90deg,
        var(--tertiary-background-color) 25%,
        var(--secondary-background-color) 50%,
        var(--tertiary-background-color) 75%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;

    ${media.tablet} {
        width: 100%;
        min-width: unset;
        height: 16rem;
    }
`;

const SkeletonContent = styled.div`
    flex: 1;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
`;

const SkeletonLine = styled.div`
    height: ${(props) => props.$height || "1.4rem"};
    width: ${(props) => props.$width || "100%"};
    border-radius: 4px;
    background: linear-gradient(
        90deg,
        var(--tertiary-background-color) 25%,
        var(--secondary-background-color) 50%,
        var(--tertiary-background-color) 75%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
`;

/* ----------------------------------------
   LinkPreview Component
   
   Displays a rich preview card for URLs with OpenGraph data
   
   Props:
   - url: string - The URL to fetch preview for
   
   Layout:
   - Desktop: Image left, text right (row)
   - Tablet/Mobile: Image top, text bottom (column)
----------------------------------------- */
function LinkPreview({ url }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { data, isLoading, isError } = useLinkPreview(url);

    const handleImageLoad = useCallback(() => setImageLoaded(true), []);
    const handleImageError = useCallback(() => {
        setImageError(true);
        setImageLoaded(true);
    }, []);

    const href = url.startsWith("www.") ? `https://${url}` : url;

    // Loading state - show skeleton
    if (isLoading) {
        return (
            <SkeletonCard>
                <SkeletonImage />
                <SkeletonContent>
                    <SkeletonLine $height="1.1rem" $width="30%" />
                    <SkeletonLine $height="1.6rem" $width="80%" />
                    <SkeletonLine $height="1.2rem" $width="100%" />
                    <SkeletonLine $height="1.2rem" $width="60%" />
                </SkeletonContent>
            </SkeletonCard>
        );
    }

    // Error or no useful data - show fallback link with indicator
    if (isError || !data || data.error || (!data.title && !data.description)) {
        return (
            <span>
                <FallbackLink
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {url}
                </FallbackLink>
                <ErrorIndicator title="Preview unavailable">
                    <HiOutlineExclamationCircle />
                </ErrorIndicator>
            </span>
        );
    }

    const { title, description, image, site_name, favicon } = data;

    // Extract hostname for site name display
    let displayHostname;
    try {
        displayHostname = new URL(href).hostname.replace(/^www\./, "");
    } catch {
        displayHostname = url;
    }

    // Format URL for display (remove protocol, keep path)
    let displayUrl;
    try {
        const urlObj = new URL(href);
        displayUrl = urlObj.hostname + urlObj.pathname + urlObj.search;
        // Remove trailing slash if it's just the root
        if (displayUrl.endsWith("/") && urlObj.pathname === "/") {
            displayUrl = displayUrl.slice(0, -1);
        }
    } catch {
        displayUrl = url;
    }

    return (
        <CardLink href={href} target="_blank" rel="noopener noreferrer">
            <ImageContainer $isLoaded={imageLoaded}>
                {image && !imageError ? (
                    <PreviewImage
                        src={image}
                        alt={title || "Link preview"}
                        loading="lazy"
                        $isLoaded={imageLoaded}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                    />
                ) : (
                    <PlaceholderIcon>
                        <HiOutlineGlobeAlt />
                    </PlaceholderIcon>
                )}
            </ImageContainer>
            <Content>
                <SiteName>
                    {favicon && (
                        <Favicon
                            src={favicon}
                            alt=""
                            onError={(e) => (e.target.style.display = "none")}
                        />
                    )}
                    {site_name || displayHostname}
                </SiteName>
                {title && <Title>{title}</Title>}
                {description && <Description>{description}</Description>}
                <UrlText title={url}>{displayUrl}</UrlText>
            </Content>
        </CardLink>
    );
}

export default LinkPreview;
