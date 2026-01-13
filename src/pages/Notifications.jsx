import styled from "styled-components";
import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import { HiOutlineBell, HiArrowLeft, HiChevronDown } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../features/notifications/useNotifications";
import NotificationItem from "../features/notifications/NotificationItem";
import SpinnerMini from "../ui/SpinnerMini";
import ButtonIcon from "../ui/ButtonIcon";

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--primary-background-color);
`;

const PageHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.6rem 2rem;
    border-bottom: 1px solid var(--primary-border-color);
    background-color: var(--secondary-background-color);
`;

const BackButton = styled(ButtonIcon)`
    & svg {
        width: 2.4rem;
        height: 2.4rem;
    }
`;

const HeaderTitle = styled.h1`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;
    flex: 1;
`;

const MarkAllReadButton = styled.button`
    background: none;
    border: none;
    color: var(--primary-button-color);
    font-size: 1.4rem;
    cursor: pointer;
    padding: 0.6rem 1rem;
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

const FilterBar = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--primary-border-color);
    background-color: var(--secondary-background-color);
`;

const FilterLabel = styled.span`
    font-size: 1.3rem;
    color: var(--secondary-text-color);
`;

const FilterSelect = styled.div`
    position: relative;
    display: inline-block;
`;

const FilterButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background-color: var(--tertiary-background-color);
    border: 1px solid var(--primary-border-color);
    color: var(--primary-text-color);
    font-size: 1.3rem;
    padding: 0.6rem 1.2rem;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;

    &:hover {
        background-color: var(--quaternary-background-color);
        border-color: var(--secondary-border-color);
    }

    & svg {
        width: 1.4rem;
        height: 1.4rem;
        transition: transform 0.2s ease;
        transform: ${(props) =>
            props.$isOpen ? "rotate(180deg)" : "rotate(0)"};
    }
`;

const FilterDropdown = styled.div`
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 0;
    min-width: 14rem;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 100;
    overflow: hidden;
`;

const FilterOption = styled.button`
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    color: var(--primary-text-color);
    font-size: 1.3rem;
    padding: 1rem 1.4rem;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
        background-color: var(--tertiary-background-color);
    }

    ${(props) =>
        props.$isActive &&
        `
        background-color: var(--primary-button-color-light);
        color: var(--primary-button-color);
        font-weight: 500;
    `}
`;

const NotificationList = styled.div`
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6rem 2rem;
    text-align: center;
    color: var(--tertiary-text-color);

    & svg {
        width: 5rem;
        height: 5rem;
        margin-bottom: 1.5rem;
        opacity: 0.5;
    }

    & p {
        font-size: 1.5rem;
    }
`;

const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem;
`;

const LoadMoreTrigger = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    color: var(--tertiary-text-color);
    font-size: 1.3rem;
`;

const FILTER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "chat", label: "Chat" },
    { value: "comment", label: "Comments" },
    { value: "team_invite", label: "Team Invites" },
];

function Notifications() {
    const navigate = useNavigate();
    const listRef = useRef(null);
    const [filter, setFilter] = useState("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef(null);

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

    const selectedFilterLabel =
        FILTER_OPTIONS.find((o) => o.value === filter)?.label || "Alle";

    // Close dropdown when clicking outside
    const handleFilterToggle = useCallback(() => {
        setIsFilterOpen((prev) => !prev);
    }, []);

    const handleFilterSelect = useCallback((value) => {
        setFilter(value);
        setIsFilterOpen(false);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                filterRef.current &&
                !filterRef.current.contains(event.target)
            ) {
                setIsFilterOpen(false);
            }
        }

        if (isFilterOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isFilterOpen]);

    const handleScroll = useCallback(
        (e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            if (
                scrollHeight - scrollTop - clientHeight < 100 &&
                hasNextPage &&
                !isFetchingNextPage
            ) {
                fetchNextPage();
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    );

    function handleBack() {
        navigate(-1);
    }

    function handleMarkAllAsRead() {
        markAllAsRead();
    }

    return (
        <PageContainer>
            <PageHeader>
                <BackButton onClick={handleBack} title="Zurück">
                    <HiArrowLeft />
                </BackButton>
                <HeaderTitle>Notifications</HeaderTitle>
                {unreadCount > 0 && (
                    <MarkAllReadButton
                        onClick={handleMarkAllAsRead}
                        disabled={isMarkingAllAsRead}
                    >
                        {isMarkingAllAsRead ? <SpinnerMini /> : "Mark all read"}
                    </MarkAllReadButton>
                )}
            </PageHeader>

            <FilterBar>
                <FilterLabel>Filter:</FilterLabel>
                <FilterSelect ref={filterRef}>
                    <FilterButton
                        onClick={handleFilterToggle}
                        $isOpen={isFilterOpen}
                    >
                        {selectedFilterLabel}
                        <HiChevronDown />
                    </FilterButton>
                    {isFilterOpen && (
                        <FilterDropdown>
                            {FILTER_OPTIONS.map((option) => (
                                <FilterOption
                                    key={option.value}
                                    $isActive={filter === option.value}
                                    onClick={() =>
                                        handleFilterSelect(option.value)
                                    }
                                >
                                    {option.label}
                                </FilterOption>
                            ))}
                        </FilterDropdown>
                    )}
                </FilterSelect>
            </FilterBar>

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
                            />
                        ))}
                        {isFetchingNextPage && (
                            <LoadMoreTrigger>
                                <SpinnerMini />
                            </LoadMoreTrigger>
                        )}
                        {!hasNextPage && filteredNotifications.length > 0 && (
                            <LoadMoreTrigger>
                                No more notifications
                            </LoadMoreTrigger>
                        )}
                    </>
                )}
            </NotificationList>
        </PageContainer>
    );
}

export default Notifications;
