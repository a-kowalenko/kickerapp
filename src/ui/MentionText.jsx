import styled from "styled-components";
import { Link } from "react-router-dom";

const MentionLink = styled(Link)`
    color: var(--primary-button-color);
    font-weight: 600;
    text-decoration: none;

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

// Parse comment content and convert @[name](id) patterns to clickable links
// and [gif:URL] patterns to images
function MentionText({ content }) {
    if (!content) return null;

    // Check if entire content is just a GIF
    const gifOnlyRegex = /^\[gif:(https?:\/\/[^\]]+)\]$/;
    const gifOnlyMatch = content.match(gifOnlyRegex);
    if (gifOnlyMatch) {
        return <GifImage src={gifOnlyMatch[1]} alt="GIF" loading="lazy" />;
    }

    // Regex to match @[name](id) pattern and [gif:URL] pattern
    const mentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;
    const gifRegex = /\[gif:(https?:\/\/[^\]]+)\]/g;

    // Combined regex for splitting
    const combinedRegex = /(@\[[^\]]+\]\(\d+\)|\[gif:https?:\/\/[^\]]+\])/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    // Find all matches (mentions and gifs)
    const allMatches = [];

    // Reset regex lastIndex
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

    // Sort by index
    allMatches.sort((a, b) => a.index - b.index);

    // Build parts array
    for (const m of allMatches) {
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
        } else if (m.type === "gif") {
            parts.push(
                <GifImage
                    key={`gif-${m.index}`}
                    src={m.url}
                    alt="GIF"
                    loading="lazy"
                />
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
