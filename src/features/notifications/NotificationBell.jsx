import styled from "styled-components";
import { useRef, useCallback, useState, useMemo } from "react";
import { HiOutlineBell, HiArrowRight } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { useNotifications } from "./useNotifications";
import NotificationItem from "./NotificationItem";
import ButtonIcon from "../../ui/ButtonIcon";
import SpinnerMini from "../../ui/SpinnerMini";
import CountBadge from "../../ui/CountBadge";

const NotificationWrapper = styled.div`
    position: relative;
`;

const BellButton = styled(ButtonIcon)`
    position: relative;
`;

const Dropdown = styled.div`
    position: absolute;
    top: calc(100% + 1rem);
    right: 0;
    width: 38rem;
    max-width: calc(100vw - 2rem);
    background-color: var(--color-grey-0);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

const DropdownHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.2rem 1.4rem;
    border-bottom: 1px solid var(--primary-border-color);
    background-color: var(--secondary-background-color);
`;

const HeaderTitle = styled.h3`
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;
`;

const MarkAllReadButton = styled.button`
    background: none;
    border: none;
    color: var(--primary-button-color);
    font-size: 1.3rem;
    cursor: pointer;
    padding: 0.4rem 0.8rem;
    border-radius: var(--border-radius-sm);
    transition: background-color 0.15s ease;

    &:hover {
        background-color: var(--primary-button-color-hover);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const FilterTabs = styled.div`
    display: flex;
    gap: 0.4rem;
    padding: 0.8rem 1.4rem;
    border-bottom: 1px solid var(--primary-border-color);
    background-color: var(--secondary-background-color);
    overflow-x: auto;

    &::-webkit-scrollbar {
        display: none;
    }
`;

const FilterTab = styled.button`
    background: ${(props) =>
        props.$isActive
            ? "var(--primary-button-color)"
            : "var(--tertiary-background-color)"};
    border: none;
    color: ${(props) =>
        props.$isActive ? "white" : "var(--secondary-text-color)"};
    font-size: 1.2rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius-pill);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;

    &:hover {
        background: ${(props) =>
            props.$isActive
                ? "var(--primary-button-color)"
                : "var(--quaternary-background-color)"};
    }
`;

const NotificationList = styled.div`
    max-height: 45rem;
    overflow-y: auto;
    overscroll-behavior: contain;

    /* Discord-style scrollbar */
    &::-webkit-scrollbar {
        width: 0.8rem;
    }

    &::-webkit-scrollbar-track {
        background: var(--secondary-background-color);
    }

    &::-webkit-scrollbar-thumb {
        background: var(--tertiary-text-color);
        border-radius: var(--border-radius-pill);
    }

    &::-webkit-scrollbar-thumb:hover {
        background: var(--secondary-text-color);
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--tertiary-text-color);

    & svg {
        width: 4rem;
        height: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    & p {
        font-size: 1.4rem;
    }
`;

const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
`;

const LoadMoreTrigger = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    color: var(--tertiary-text-color);
    font-size: 1.3rem;
`;

const DropdownFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem 1.4rem;
    border-top: 1px solid var(--primary-border-color);
    background-color: var(--secondary-background-color);
`;

const ViewAllButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    background: transparent;
    border: none;
    color: var(--primary-button-color);
    font-size: 1.3rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0.8rem 1.6rem;
    border-radius: var(--border-radius-sm);
    transition: all 0.15s ease;
    width: 100%;

    &:hover {
        background-color: rgba(99, 102, 241, 0.1);
    }

    &:active {
        background-color: rgba(99, 102, 241, 0.15);
    }

    & svg {
        width: 1.4rem;
        height: 1.4rem;
    }
`;

const FILTER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "chat", label: "Chat" },
    { value: "comment", label: "Comments" },
    { value: "team_invite", label: "Invites" },
];

function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState("all");
    const listRef = useRef(null);
    const navigate = useNavigate();

    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        markAsRead,
        markAllAsRead,
        isMarkingAllAsRead,
    } = useNotifications();

    // Filter notifications based on selected filter
    const filteredNotifications = useMemo(() => {
        if (filter === "all") return notifications;
        return notifications.filter((n) => n.type === filter);
    }, [notifications, filter]);

    const close = useCallback(() => setIsOpen(false), []);
    const dropdownRef = useOutsideClick(close);

    function handleToggle() {
        setIsOpen((prev) => !prev);
    }

    function handleMarkAllAsRead() {
        markAllAsRead();
    }

    function handleViewAll() {
        setIsOpen(false);
        navigate("/notifications");
    }

    function handleScroll(e) {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Load more when scrolled to bottom (with 100px threshold)
        if (
            scrollHeight - scrollTop - clientHeight < 100 &&
            hasNextPage &&
            !isFetchingNextPage
        ) {
            fetchNextPage();
        }
    }

    return (
        <NotificationWrapper ref={dropdownRef}>
            <BellButton onClick={handleToggle} title="Notifications">
                <HiOutlineBell />
                <CountBadge
                    count={unreadCount}
                    position="absolute"
                    top="-0.2rem"
                    right="-0.2rem"
                />
            </BellButton>

            {isOpen && (
                <Dropdown>
                    <DropdownHeader>
                        <HeaderTitle>Notifications</HeaderTitle>
                        {unreadCount > 0 && (
                            <MarkAllReadButton
                                onClick={handleMarkAllAsRead}
                                disabled={isMarkingAllAsRead}
                            >
                                {isMarkingAllAsRead ? (
                                    <SpinnerMini />
                                ) : (
                                    "Mark all read"
                                )}
                            </MarkAllReadButton>
                        )}
                    </DropdownHeader>

                    <FilterTabs>
                        {FILTER_OPTIONS.map((option) => (
                            <FilterTab
                                key={option.value}
                                $isActive={filter === option.value}
                                onClick={() => setFilter(option.value)}
                            >
                                {option.label}
                            </FilterTab>
                        ))}
                    </FilterTabs>

                    <NotificationList ref={listRef} onScroll={handleScroll}>
                        {isLoading ? (
                            <LoadingContainer>
                                <SpinnerMini />
                            </LoadingContainer>
                        ) : filteredNotifications.length === 0 ? (
                            <EmptyState>
                                <HiOutlineBell />
                                <p>
                                    {filter === "all"
                                        ? "No notifications"
                                        : "No notifications in this category"}
                                </p>
                            </EmptyState>
                        ) : (
                            <>
                                {filteredNotifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={markAsRead}
                                        onClose={close}
                                    />
                                ))}
                                {isFetchingNextPage && (
                                    <LoadMoreTrigger>
                                        <SpinnerMini />
                                    </LoadMoreTrigger>
                                )}
                                {!hasNextPage &&
                                    filteredNotifications.length > 0 && (
                                        <LoadMoreTrigger>
                                            No more notifications
                                        </LoadMoreTrigger>
                                    )}
                            </>
                        )}
                    </NotificationList>

                    <DropdownFooter>
                        <ViewAllButton onClick={handleViewAll}>
                            View all notifications
                            <HiArrowRight />
                        </ViewAllButton>
                    </DropdownFooter>
                </Dropdown>
            )}
        </NotificationWrapper>
    );
}

export default NotificationBell;
