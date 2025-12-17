import styled from "styled-components";
import {
    useRef,
    useEffect,
    useCallback,
    useState,
    forwardRef,
    useImperativeHandle,
} from "react";

const EditableDiv = styled.div`
    width: 100%;
    padding: 1rem;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-input-border-color);
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);
    font-family: inherit;
    font-size: 1.6rem;
    outline: none;
    min-height: 2.2em;
    max-height: 10em;
    overflow-y: auto;
    word-wrap: break-word;
    white-space: pre-wrap;
    touch-action: manipulation;
    cursor: text;

    &:focus {
        border-color: var(--primary-input-border-color-active);
    }

    &:empty::before {
        content: attr(data-placeholder);
        color: var(--tertiary-text-color);
        pointer-events: none;
    }

    /* Mention styling */
    .mention {
        color: var(--primary-button-color);
        background-color: rgba(var(--primary-button-color-rgb), 0.1);
        border-radius: 3px;
        padding: 0 2px;
        font-weight: 500;
        user-select: all;
        cursor: default;
    }

    /* GIF tag styling - show as placeholder */
    .gif-tag {
        color: var(--tertiary-text-color);
        background-color: var(--tertiary-background-color);
        border-radius: 3px;
        padding: 0 4px;
        font-size: 1.2rem;
        user-select: all;
    }
`;

// Parse raw content to HTML with styled mentions
function contentToHtml(content) {
    if (!content) return "";

    let html = content;

    // First, escape HTML special characters (but not our patterns)
    html = html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Replace @everyone with styled mention
    html = html.replace(
        /@everyone\b/g,
        '<span class="mention" data-mention="everyone" contenteditable="false">@everyone</span>'
    );

    // Replace @[Name](id) with styled mention spans
    html = html.replace(
        /@\[([^\]]+)\]\((\d+)\)/g,
        '<span class="mention" data-mention="$2" data-name="$1" contenteditable="false">@$1</span>'
    );

    // Replace [gif:URL] with a styled tag
    html = html.replace(
        /\[gif:([^\]]+)\]/g,
        '<span class="gif-tag" data-gif="$1" contenteditable="false">[GIF]</span>'
    );

    return html;
}

// Parse HTML back to raw content with @[Name](id) format
function htmlToContent(element) {
    let content = "";

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            content += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains("mention")) {
                const mentionId = node.dataset.mention;
                const name = node.dataset.name;
                if (mentionId === "everyone") {
                    content += "@everyone";
                } else if (mentionId && name) {
                    content += `@[${name}](${mentionId})`;
                }
            } else if (node.classList.contains("gif-tag")) {
                const gifUrl = node.dataset.gif;
                if (gifUrl) {
                    content += `[gif:${gifUrl}]`;
                }
            } else if (node.tagName === "BR") {
                content += "\n";
            } else if (node.tagName === "DIV" || node.tagName === "P") {
                // Block elements add newlines
                if (content.length > 0 && !content.endsWith("\n")) {
                    content += "\n";
                }
                node.childNodes.forEach(processNode);
            } else {
                // Process children for other elements
                node.childNodes.forEach(processNode);
            }
        }
    }

    element.childNodes.forEach(processNode);
    return content;
}

// Get cursor position as text offset
function getCursorPosition(element) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    // Count text length before cursor, accounting for mentions
    let position = 0;
    const treeWalker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        null
    );

    let node;
    while ((node = treeWalker.nextNode())) {
        if (node === range.endContainer) {
            if (node.nodeType === Node.TEXT_NODE) {
                position += range.endOffset;
            }
            break;
        }

        if (node.nodeType === Node.TEXT_NODE) {
            position += node.textContent.length;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList?.contains("mention")) {
                const mentionId = node.dataset.mention;
                const name = node.dataset.name;
                if (mentionId === "everyone") {
                    position += "@everyone".length;
                } else if (mentionId && name) {
                    position += `@[${name}](${mentionId})`.length;
                }
            } else if (node.classList?.contains("gif-tag")) {
                const gifUrl = node.dataset.gif;
                if (gifUrl) {
                    position += `[gif:${gifUrl}]`.length;
                }
            }
        }
    }

    return position;
}

// Set cursor position from text offset
function setCursorPosition(element, targetPosition) {
    if (targetPosition < 0) return;

    const selection = window.getSelection();
    const range = document.createRange();

    let currentPosition = 0;
    let found = false;

    function findPosition(node) {
        if (found) return;

        if (node.nodeType === Node.TEXT_NODE) {
            const textLength = node.textContent.length;
            if (currentPosition + textLength >= targetPosition) {
                range.setStart(node, targetPosition - currentPosition);
                range.collapse(true);
                found = true;
                return;
            }
            currentPosition += textLength;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList?.contains("mention")) {
                const mentionId = node.dataset.mention;
                const name = node.dataset.name;
                let mentionLength;
                if (mentionId === "everyone") {
                    mentionLength = "@everyone".length;
                } else if (mentionId && name) {
                    mentionLength = `@[${name}](${mentionId})`.length;
                } else {
                    mentionLength = 0;
                }

                if (currentPosition + mentionLength >= targetPosition) {
                    // Position after the mention
                    range.setStartAfter(node);
                    range.collapse(true);
                    found = true;
                    return;
                }
                currentPosition += mentionLength;
            } else if (node.classList?.contains("gif-tag")) {
                const gifUrl = node.dataset.gif;
                const gifLength = gifUrl ? `[gif:${gifUrl}]`.length : 0;

                if (currentPosition + gifLength >= targetPosition) {
                    range.setStartAfter(node);
                    range.collapse(true);
                    found = true;
                    return;
                }
                currentPosition += gifLength;
            } else {
                // Process children
                for (const child of node.childNodes) {
                    findPosition(child);
                    if (found) return;
                }
            }
        }
    }

    for (const child of element.childNodes) {
        findPosition(child);
        if (found) break;
    }

    // If not found, position at end
    if (!found) {
        range.selectNodeContents(element);
        range.collapse(false);
    }

    selection.removeAllRanges();
    selection.addRange(range);
}

const RichTextInput = forwardRef(function RichTextInput(
    { value, onChange, onKeyDown, placeholder, disabled, onMentionTrigger },
    ref
) {
    const editorRef = useRef(null);
    const [isComposing, setIsComposing] = useState(false);
    const lastValueRef = useRef(value);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        focus: () => editorRef.current?.focus(),
        blur: () => editorRef.current?.blur(),
        getCursorPosition: () =>
            editorRef.current ? getCursorPosition(editorRef.current) : 0,
        setCursorPosition: (pos) =>
            editorRef.current && setCursorPosition(editorRef.current, pos),
        insertText: (text) => {
            if (!editorRef.current) return;
            document.execCommand("insertText", false, text);
        },
        insertMention: (player) => {
            if (!editorRef.current) return;

            // Find and remove the @ trigger text
            const content = htmlToContent(editorRef.current);
            const cursorPos = getCursorPosition(editorRef.current);
            const textBeforeCursor = content.slice(0, cursorPos);
            const atIndex = textBeforeCursor.lastIndexOf("@");

            if (atIndex !== -1) {
                const beforeAt = content.slice(0, atIndex);
                const afterCursor = content.slice(cursorPos);

                let mentionText;
                if (player.isEveryone) {
                    mentionText = "@everyone ";
                } else {
                    mentionText = `@[${player.name}](${player.id}) `;
                }

                const newContent = beforeAt + mentionText + afterCursor;
                onChange(newContent);

                // Set cursor after mention
                setTimeout(() => {
                    if (editorRef.current) {
                        setCursorPosition(
                            editorRef.current,
                            beforeAt.length + mentionText.length
                        );
                    }
                }, 0);
            }
        },
        insertGif: (gifUrl) => {
            if (!editorRef.current) return;

            // Replace existing GIF or add new one
            let content = htmlToContent(editorRef.current);
            const gifTag = `[gif:${gifUrl}]`;
            const gifRegex = /\[gif:[^\]]+\]/g;

            content = content.replace(gifRegex, "").trim();
            const newContent = content ? `${content} ${gifTag}` : gifTag;

            onChange(newContent);

            // Position cursor at end
            setTimeout(() => {
                if (editorRef.current) {
                    setCursorPosition(editorRef.current, newContent.length);
                }
            }, 0);
        },
    }));

    // Update HTML when value changes externally
    useEffect(() => {
        if (!editorRef.current) return;

        // Only update if value actually changed (not from our own input)
        if (value !== lastValueRef.current) {
            const currentContent = htmlToContent(editorRef.current);
            if (currentContent !== value) {
                const cursorPos = getCursorPosition(editorRef.current);
                editorRef.current.innerHTML = contentToHtml(value);

                // Try to restore cursor position
                if (document.activeElement === editorRef.current) {
                    const newPos = Math.min(cursorPos, value.length);
                    setCursorPosition(editorRef.current, newPos);
                }
            }
            lastValueRef.current = value;
        }
    }, [value]);

    // Handle input
    const handleInput = useCallback(() => {
        if (!editorRef.current || isComposing) return;

        const content = htmlToContent(editorRef.current);
        lastValueRef.current = content;
        onChange(content);

        // Check for @ mention trigger
        const cursorPos = getCursorPosition(editorRef.current);
        const textBeforeCursor = content.slice(0, cursorPos);
        const atIndex = textBeforeCursor.lastIndexOf("@");

        if (
            atIndex !== -1 &&
            onMentionTrigger &&
            !textBeforeCursor.slice(atIndex + 1).includes(" ")
        ) {
            const search = textBeforeCursor.slice(atIndex + 1);
            onMentionTrigger(search, atIndex);
        } else if (onMentionTrigger) {
            onMentionTrigger(null, -1);
        }
    }, [onChange, onMentionTrigger, isComposing]);

    // Handle keydown for special cases
    const handleKeyDown = useCallback(
        (e) => {
            // Handle backspace on mentions
            if (e.key === "Backspace") {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);

                    // Check if cursor is right after a mention
                    if (range.collapsed) {
                        const node = range.startContainer;
                        let mentionNode = null;

                        // Check previous sibling
                        if (node.nodeType === Node.TEXT_NODE) {
                            if (
                                range.startOffset === 0 &&
                                node.previousSibling?.classList?.contains(
                                    "mention"
                                )
                            ) {
                                mentionNode = node.previousSibling;
                            }
                        } else if (
                            node.nodeType === Node.ELEMENT_NODE &&
                            node.classList?.contains("mention")
                        ) {
                            mentionNode = node;
                        }

                        // Check parent's previous sibling
                        if (
                            !mentionNode &&
                            range.startOffset === 0 &&
                            node.parentNode
                        ) {
                            const parent = node.parentNode;
                            if (
                                parent !== editorRef.current &&
                                parent.previousSibling?.classList?.contains(
                                    "mention"
                                )
                            ) {
                                mentionNode = parent.previousSibling;
                            }
                        }

                        if (mentionNode) {
                            e.preventDefault();
                            mentionNode.remove();
                            handleInput();
                            return;
                        }
                    }
                }
            }

            // Handle delete on mentions
            if (e.key === "Delete") {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);

                    if (range.collapsed) {
                        const node = range.startContainer;

                        // Check if next node is a mention
                        if (
                            node.nodeType === Node.TEXT_NODE &&
                            range.startOffset === node.textContent.length
                        ) {
                            const nextNode = node.nextSibling;
                            if (nextNode?.classList?.contains("mention")) {
                                e.preventDefault();
                                nextNode.remove();
                                handleInput();
                                return;
                            }
                        }
                    }
                }
            }

            // Pass to parent handler
            if (onKeyDown) {
                onKeyDown(e);
            }
        },
        [onKeyDown, handleInput]
    );

    // Handle paste - strip formatting
    const handlePaste = useCallback((e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
    }, []);

    return (
        <EditableDiv
            ref={editorRef}
            contentEditable={!disabled}
            data-placeholder={placeholder}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => {
                setIsComposing(false);
                handleInput();
            }}
            suppressContentEditableWarning
        />
    );
});

export default RichTextInput;
