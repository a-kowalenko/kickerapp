import styled from "styled-components";
import { Link } from "react-router-dom";
import MatchLinkWithTooltip from "./MatchLinkWithTooltip";

const MentionLink = styled(Link)`
    color: var(--primary-button-color);
    font-weight: 600;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const ExternalLink = styled.a`
    color: var(--primary-button-color);
    text-decoration: none;
    word-break: break-all;

    &:hover {
        text-decoration: underline;
    }
`;

const GifImage = styled.img`
    max-width: 100%;
    max-height: 30rem;
    border-radius: var(--border-radius-sm);
    display: block;
    margin: 0.4rem 0;
`;

// Parse comment content and convert @[name](id) patterns to clickable links,
// #[matchDisplay](matchId) patterns to match links, [gif:URL] patterns to images,
// and plain URLs to clickable links
function MentionText({ content }) {
    if (!content) return null;

    // Check if entire content is just a GIF
    const gifOnlyRegex = /^\[gif:(https?:\/\/[^\]]+)\]$/;
    const gifOnlyMatch = content.match(gifOnlyRegex);
    if (gifOnlyMatch) {
        return <GifImage src={gifOnlyMatch[1]} alt="GIF" loading="lazy" />;
    }

    // Regex patterns
    const mentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;
    const matchLinkRegex = /#\[([^\]]+)\]\((\d+)\)/g;
    const gifRegex = /\[gif:(https?:\/\/[^\]]+)\]/g;
    // URL regex - matches http://, https://, and www. URLs
    // Excludes URLs that are part of [gif:...] syntax
    const urlRegex = /(?<!\[gif:)(https?:\/\/[^\s<>\[\]]+|www\.[^\s<>\[\]]+)/g;

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

    // Find URLs (but not those inside [gif:...])
    urlRegex.lastIndex = 0;
    while ((match = urlRegex.exec(content)) !== null) {
        const url = match[0];
        const startIndex = match.index;

        // Check if this URL is inside a [gif:...] block
        const beforeText = content.slice(0, startIndex);
        const isInsideGif =
            beforeText.lastIndexOf("[gif:") > beforeText.lastIndexOf("]");

        if (!isInsideGif) {
            allMatches.push({
                type: "url",
                index: startIndex,
                length: url.length,
                url: url,
                fullMatch: url,
            });
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
                <GifImage
                    key={`gif-${m.index}`}
                    src={m.url}
                    alt="GIF"
                    loading="lazy"
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
        }

        lastIndex = m.index + m.length;
    }

    // Add remaining text after the last match
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
    }

    return <>{parts}</>;
}

export default MentionText;
