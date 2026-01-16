import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { HiOutlineBugAnt } from "react-icons/hi2";
import BugReportModal from "./BugReportModal";

const wiggle = keyframes`
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(-15deg); }
    40% { transform: rotate(15deg); }
    60% { transform: rotate(-10deg); }
    80% { transform: rotate(10deg); }
`;

// Desktop sidebar version - expanded
const SidebarButtonExpanded = styled.button`
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 1.2rem 1.6rem;
    margin-top: auto;
    border: none;
    border-top: 1px solid var(--secondary-border-color);
    background: transparent;
    color: var(--secondary-text-color);
    font-size: 1.4rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: linear-gradient(
            135deg,
            rgba(239, 68, 68, 0.1) 0%,
            rgba(249, 115, 22, 0.1) 100%
        );
        color: var(--color-red-500);
    }

    &:hover svg {
        animation: ${wiggle} 0.6s ease-in-out;
    }

    & svg {
        font-size: 2rem;
        flex-shrink: 0;
    }
`;

// Desktop sidebar version - collapsed (icon only)
const SidebarButtonCollapsed = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 1.2rem 0;
    margin-top: auto;
    border: none;
    border-top: 1px solid var(--secondary-border-color);
    background: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
        background: linear-gradient(
            135deg,
            rgba(239, 68, 68, 0.1) 0%,
            rgba(249, 115, 22, 0.1) 100%
        );
        color: var(--color-red-500);
    }

    &:hover svg {
        animation: ${wiggle} 0.6s ease-in-out;
    }

    & svg {
        font-size: 2rem;
    }
`;

const CollapsedLabel = styled.span`
    position: absolute;
    left: calc(100% + 0.8rem);
    white-space: nowrap;
    padding: 0.6rem 1rem;
    background: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--primary-text-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    opacity: 0;
    transform: translateX(-5px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    z-index: 100;

    ${SidebarButtonCollapsed}:hover & {
        opacity: 1;
        transform: translateX(0);
    }
`;

// Mobile/tablet footer version
const FooterButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 1rem 1.6rem;
    border: none;
    border-radius: var(--border-radius-md);
    background: linear-gradient(
        135deg,
        var(--color-red-500) 0%,
        var(--color-orange-500) 100%
    );
    color: white;
    font-size: 1.3rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
    transition: all 0.2s ease;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
    }

    &:active {
        transform: translateY(0);
    }

    &:hover svg {
        animation: ${wiggle} 0.6s ease-in-out;
    }

    & svg {
        font-size: 1.8rem;
    }
`;

// Wrapper for footer positioning
const FooterButtonWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--primary-border-color);
`;

/**
 * BugReportButton - Renders in different styles based on variant
 * @param {string} variant - "sidebar-expanded", "sidebar-collapsed", or "footer"
 */
function BugReportButton({ variant = "footer", isExpanded }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Determine which variant to render
    const effectiveVariant =
        variant === "sidebar"
            ? isExpanded
                ? "sidebar-expanded"
                : "sidebar-collapsed"
            : variant;

    return (
        <>
            {effectiveVariant === "sidebar-expanded" && (
                <SidebarButtonExpanded
                    onClick={() => setIsModalOpen(true)}
                    aria-label="Report a bug"
                    title="Report a bug"
                >
                    <HiOutlineBugAnt />
                    Report a Bug
                </SidebarButtonExpanded>
            )}

            {effectiveVariant === "sidebar-collapsed" && (
                <SidebarButtonCollapsed
                    onClick={() => setIsModalOpen(true)}
                    aria-label="Report a bug"
                    title="Report a bug"
                >
                    <HiOutlineBugAnt />
                    <CollapsedLabel>Report a Bug</CollapsedLabel>
                </SidebarButtonCollapsed>
            )}

            {effectiveVariant === "footer" && (
                <FooterButtonWrapper>
                    <FooterButton
                        onClick={() => setIsModalOpen(true)}
                        aria-label="Report a bug"
                    >
                        <HiOutlineBugAnt />
                        Report a Bug
                    </FooterButton>
                </FooterButtonWrapper>
            )}

            <BugReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

export default BugReportButton;
