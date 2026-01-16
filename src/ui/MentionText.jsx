import styled, { keyframes } from "styled-components";
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { HiPlay } from "react-icons/hi2";
import MatchLinkWithTooltip from "./MatchLinkWithTooltip";
import MediaViewer from "./MediaViewer";

const MentionLink = styled(Link)`
    color: var(--player-mention-color);
    font-weight: 600;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const EveryoneMention = styled.span`
    color: var(--everyone-mention-color);
    font-weight: 600;

    &:hover {
        text-decoration: underline;
        cursor: pointer;
    }
`;

const ExternalLink = styled.a`
    color: var(--link-text-color);
    text-decoration: none;
    word-break: break-all;

    &:hover {
        text-decoration: underline;
    }
`;

// Skeleton loading animation
const shimmer = keyframes`
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
`;

// Container to maintain consistent height during load
const ImageContainer = styled.div`
    position: relative;
    max-width: 100%;
    border-radius: var(--border-radius-sm);
    margin: 0.4rem 0;
    /* Reserve space: min-height prevents layout shift, aspect-ratio provides natural sizing */
    min-height: ${(props) => (props.$isLoaded ? "0" : "15rem")};
    max-height: 30rem;
    overflow: hidden;
    background: ${(props) =>
        props.$isLoaded
            ? "transparent"
            : "linear-gradient(90deg, var(--tertiary-background-color) 25%, var(--secondary-background-color) 50%, var(--tertiary-background-color) 75%)"};
    background-size: 200% 100%;
    animation: ${(props) => (props.$isLoaded ? "none" : shimmer)} 1.5s infinite;
`;

const GifImage = styled.img`
    max-width: 100%;
    max-height: 30rem;
    border-radius: var(--border-radius-sm);
    display: block;
    opacity: ${(props) => (props.$isLoaded ? 1 : 0)};
    transition: opacity 0.2s ease-in;
`;

const UploadedImage = styled.img`
    max-width: 100%;
    max-height: 30rem;
    border-radius: var(--border-radius-sm);
    display: block;
    cursor: pointer;
    opacity: ${(props) => (props.$isLoaded ? 1 : 0)};
    transition: opacity 0.2s ease-in;

    &:hover {
        opacity: 0.9;
    }
`;

// Wrapper component for GIF images with loading state
function GifImageWithPlaceholder({ src, alt = "GIF" }) {
    const [isLoaded, setIsLoaded] = useState(false);

    const handleLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    return (
        <ImageContainer $isLoaded={isLoaded}>
            <GifImage
                src={src}
                alt={alt}
                loading="lazy"
                $isLoaded={isLoaded}
                onLoad={handleLoad}
            />
        </ImageContainer>
    );
}

// Wrapper component for uploaded images with loading state
function UploadedImageWithPlaceholder({
    src,
    alt = "Uploaded image",
    onClick,
}) {
    const [isLoaded, setIsLoaded] = useState(false);

    const handleLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    return (
        <ImageContainer $isLoaded={isLoaded}>
            <UploadedImage
                src={src}
                alt={alt}
                loading="lazy"
                $isLoaded={isLoaded}
                onLoad={handleLoad}
                onClick={onClick}
            />
        </ImageContainer>
    );
}

// YouTube Embed Styled Components
const YouTubeContainer = styled.div`
    position: relative;
    width: 100%;
    max-width: ${(props) => (props.$isShort ? "24rem" : "48rem")};
    aspect-ratio: ${(props) => (props.$isShort ? "9 / 16" : "16 / 9")};
    max-height: ${(props) => (props.$isShort ? "42rem" : "30rem")};
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    margin: 0.4rem 0;
    background-color: #000;
`;

const YouTubeThumbnail = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;

    &:hover {
        opacity: 0.85;
        transform: scale(1.02);
    }
`;

const PlayButtonOverlay = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6.8rem;
    height: 4.8rem;
    background-color: rgba(255, 0, 0, 0.9);
    border-radius: var(--border-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;
    pointer-events: none;

    & svg {
        font-size: 2.8rem;
        color: white;
        margin-left: 0.3rem;
    }

    ${YouTubeContainer}:hover & {
        background-color: rgba(255, 0, 0, 1);
        transform: translate(-50%, -50%) scale(1.1);
    }
`;

const YouTubeIframe = styled.iframe`
    width: 100%;
    height: 100%;
    border: none;
`;

const YouTubeWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
`;

// Parse YouTube timestamp from various formats: t=123, t=1m30s, t=1h2m3s
function parseYouTubeTimestamp(url) {
    // Match t= parameter in URL
    const timeMatch = url.match(/[?&]t=([^&]+)/);
    if (!timeMatch) return 0;

    const timeValue = timeMatch[1];

    // Pure seconds format (e.g., t=123)
    if (/^\d+s?$/.test(timeValue)) {
        return parseInt(timeValue, 10);
    }

    // Complex format (e.g., 1h2m3s, 1m30s, 2m)
    let totalSeconds = 0;
    const hours = timeValue.match(/(\d+)h/);
    const minutes = timeValue.match(/(\d+)m/);
    const seconds = timeValue.match(/(\d+)s/);

    if (hours) totalSeconds += parseInt(hours[1], 10) * 3600;
    if (minutes) totalSeconds += parseInt(minutes[1], 10) * 60;
    if (seconds) totalSeconds += parseInt(seconds[1], 10);

    return totalSeconds;
}

// Extract YouTube video ID and metadata from URL
function parseYouTubeUrl(url) {
    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
    );
    if (watchMatch) {
        return {
            videoId: watchMatch[1],
            isShort: false,
            startTime: parseYouTubeTimestamp(url),
        };
    }

    // youtu.be/VIDEO_ID
    const shortUrlMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (shortUrlMatch) {
        return {
            videoId: shortUrlMatch[1],
            isShort: false,
            startTime: parseYouTubeTimestamp(url),
        };
    }

    // youtube.com/shorts/VIDEO_ID
    const shortsMatch = url.match(
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    );
    if (shortsMatch) {
        return {
            videoId: shortsMatch[1],
            isShort: true,
            startTime: parseYouTubeTimestamp(url),
        };
    }

    return null;
}

// YouTube Embed Component with thumbnail preview
function YouTubeEmbed({ videoId, isShort, startTime, originalUrl }) {
    const [isPlaying, setIsPlaying] = useState(false);

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1${
        startTime ? `&start=${startTime}` : ""
    }`;

    function handleClick() {
        setIsPlaying(true);
    }

    return (
        <YouTubeWrapper>
            <ExternalLink
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
            >
                {originalUrl}
            </ExternalLink>
            <YouTubeContainer $isShort={isShort}>
                {isPlaying ? (
                    <YouTubeIframe
                        src={embedUrl}
                        title="YouTube video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <>
                        <YouTubeThumbnail
                            src={thumbnailUrl}
                            alt="YouTube video thumbnail"
                            onClick={handleClick}
                            loading="lazy"
                        />
                        <PlayButtonOverlay onClick={handleClick}>
                            <HiPlay />
                        </PlayButtonOverlay>
                    </>
                )}
            </YouTubeContainer>
        </YouTubeWrapper>
    );
}

// Helper component for clickable images that open the viewer
function ClickableImage({ src, onOpenViewer }) {
    return (
        <UploadedImageWithPlaceholder
            src={src}
            alt="Uploaded image"
            onClick={() => onOpenViewer(src)}
        />
    );
}

// Parse comment content and convert @[name](id) patterns to clickable links,
// #[matchDisplay](matchId) patterns to match links, [gif:URL] patterns to images,
// [img:URL] patterns to uploaded images, and plain URLs to clickable links
function MentionText({ content }) {
    const [viewerImage, setViewerImage] = useState(null);

    if (!content) return null;

    // Check if entire content is just a GIF
    const gifOnlyRegex = /^\[gif:(https?:\/\/[^\]]+)\]$/;
    const gifOnlyMatch = content.match(gifOnlyRegex);
    if (gifOnlyMatch) {
        return <GifImageWithPlaceholder src={gifOnlyMatch[1]} alt="GIF" />;
    }

    // Check if entire content is just an uploaded image
    const imgOnlyRegex = /^\[img:(https?:\/\/[^\]]+)\]$/;
    const imgOnlyMatch = content.match(imgOnlyRegex);
    if (imgOnlyMatch) {
        return (
            <>
                <UploadedImageWithPlaceholder
                    src={imgOnlyMatch[1]}
                    alt="Uploaded image"
                    onClick={() => setViewerImage(imgOnlyMatch[1])}
                />
                {viewerImage && (
                    <MediaViewer
                        src={viewerImage}
                        alt="Uploaded image"
                        onClose={() => setViewerImage(null)}
                    />
                )}
            </>
        );
    }

    // Regex patterns
    const mentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;
    const everyoneRegex = /@everyone\b/g;
    const matchLinkRegex = /#\[([^\]]+)\]\((\d+)\)/g;
    const gifRegex = /\[gif:(https?:\/\/[^\]]+)\]/g;
    const imgRegex = /\[img:(https?:\/\/[^\]]+)\]/g;
    // URL regex - matches http://, https://, and www. URLs
    // Excludes URLs that are part of [gif:...] or [img:...] syntax
    const urlRegex =
        /(?<!\[(gif|img):)(https?:\/\/[^\s<>\[\]]+|www\.[^\s<>\[\]]+)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    // Find all matches (mentions, match links, gifs, and URLs)
    const allMatches = [];

    // Reset regex lastIndex and find mentions
    mentionRegex.lastIndex = 0;
    while ((match = mentionRegex.exec(content)) !== null) {
        allMatches.push({
            type: "mention",
            index: match.index,
            length: match[0].length,
            name: match[1],
            playerId: match[2],
            fullMatch: match[0],
        });
    }

    // Find @everyone mentions
    everyoneRegex.lastIndex = 0;
    while ((match = everyoneRegex.exec(content)) !== null) {
        allMatches.push({
            type: "everyone",
            index: match.index,
            length: match[0].length,
            fullMatch: match[0],
        });
    }

    // Find match links
    matchLinkRegex.lastIndex = 0;
    while ((match = matchLinkRegex.exec(content)) !== null) {
        allMatches.push({
            type: "matchLink",
            index: match.index,
            length: match[0].length,
            display: match[1],
            matchId: match[2],
            fullMatch: match[0],
        });
    }

    // Find gifs
    gifRegex.lastIndex = 0;
    while ((match = gifRegex.exec(content)) !== null) {
        allMatches.push({
            type: "gif",
            index: match.index,
            length: match[0].length,
            url: match[1],
            fullMatch: match[0],
        });
    }

    // Find uploaded images
    imgRegex.lastIndex = 0;
    while ((match = imgRegex.exec(content)) !== null) {
        allMatches.push({
            type: "img",
            index: match.index,
            length: match[0].length,
            url: match[1],
            fullMatch: match[0],
        });
    }

    // Find URLs (but not those inside [gif:...] or [img:...])
    // Track if we've already found a YouTube video (limit to 1 embed per message)
    let hasYouTubeEmbed = false;

    urlRegex.lastIndex = 0;
    while ((match = urlRegex.exec(content)) !== null) {
        const url = match[0];
        const startIndex = match.index;

        // Check if this URL is inside a [gif:...] or [img:...] block
        const beforeText = content.slice(0, startIndex);
        const lastGifIndex = beforeText.lastIndexOf("[gif:");
        const lastImgIndex = beforeText.lastIndexOf("[img:");
        const lastCloseBracket = beforeText.lastIndexOf("]");
        const isInsideTag =
            Math.max(lastGifIndex, lastImgIndex) > lastCloseBracket;

        if (!isInsideTag) {
            // Check if this is a YouTube URL (only embed the first one)
            const youtubeData = parseYouTubeUrl(url);
            if (youtubeData && !hasYouTubeEmbed) {
                hasYouTubeEmbed = true;
                allMatches.push({
                    type: "youtube",
                    index: startIndex,
                    length: url.length,
                    url: url,
                    videoId: youtubeData.videoId,
                    isShort: youtubeData.isShort,
                    startTime: youtubeData.startTime,
                    fullMatch: url,
                });
            } else {
                allMatches.push({
                    type: "url",
                    index: startIndex,
                    length: url.length,
                    url: url,
                    fullMatch: url,
                });
            }
        }
    }

    // Sort by index
    allMatches.sort((a, b) => a.index - b.index);

    // Remove overlapping matches (keep the first one)
    const filteredMatches = [];
    for (const m of allMatches) {
        const overlaps = filteredMatches.some(
            (existing) =>
                m.index < existing.index + existing.length &&
                m.index + m.length > existing.index
        );
        if (!overlaps) {
            filteredMatches.push(m);
        }
    }

    // Build parts array
    for (const m of filteredMatches) {
        // Add text before this match
        if (m.index > lastIndex) {
            parts.push(content.slice(lastIndex, m.index));
        }

        if (m.type === "mention") {
            parts.push(
                <MentionLink
                    key={`mention-${m.index}`}
                    to={`/user/${m.name}/profile`}
                >
                    @{m.name}
                </MentionLink>
            );
        } else if (m.type === "everyone") {
            parts.push(
                <EveryoneMention key={`everyone-${m.index}`}>
                    @everyone
                </EveryoneMention>
            );
        } else if (m.type === "matchLink") {
            parts.push(
                <MatchLinkWithTooltip
                    key={`match-${m.index}`}
                    matchId={m.matchId}
                    display={m.display}
                />
            );
        } else if (m.type === "gif") {
            parts.push(
                <GifImageWithPlaceholder
                    key={`gif-${m.index}`}
                    src={m.url}
                    alt="GIF"
                />
            );
        } else if (m.type === "img") {
            parts.push(
                <ClickableImage
                    key={`img-${m.index}`}
                    src={m.url}
                    onOpenViewer={setViewerImage}
                />
            );
        } else if (m.type === "url") {
            // Add https:// prefix if URL starts with www.
            const href = m.url.startsWith("www.") ? `https://${m.url}` : m.url;
            parts.push(
                <ExternalLink
                    key={`url-${m.index}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {m.url}
                </ExternalLink>
            );
        } else if (m.type === "youtube") {
            parts.push(
                <YouTubeEmbed
                    key={`youtube-${m.index}`}
                    videoId={m.videoId}
                    isShort={m.isShort}
                    startTime={m.startTime}
                    originalUrl={m.url}
                />
            );
        }

        lastIndex = m.index + m.length;
    }

    // Add remaining text after the last match
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
    }

    return (
        <>
            {parts}
            {viewerImage && (
                <MediaViewer
                    src={viewerImage}
                    alt="Uploaded image"
                    onClose={() => setViewerImage(null)}
                />
            )}
        </>
    );
}

export default MentionText;
