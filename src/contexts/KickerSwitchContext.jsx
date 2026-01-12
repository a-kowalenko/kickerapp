import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useKicker } from "./KickerContext";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import KickerSwitchConfirmModal from "../features/notifications/KickerSwitchConfirmModal";

const KickerSwitchContext = createContext();

function KickerSwitchProvider({ children }) {
    const navigate = useNavigate();
    const { currentKicker, setCurrentKicker } = useKicker();
    const [autoSwitchKicker, setAutoSwitchKicker] = useLocalStorageState(
        false,
        "autoSwitchKickerOnNotification"
    );

    const [showModal, setShowModal] = useState(false);
    const [pendingSwitch, setPendingSwitch] = useState(null);

    /**
     * Request a kicker switch with navigation.
     * If the target kicker is different from current, shows confirmation modal (unless auto-switch is enabled).
     * @param {number} targetKickerId - The kicker ID to switch to
     * @param {string} targetKickerName - The kicker name for display
     * @param {string} navigationUrl - The URL to navigate to after switching
     * @param {function} onBeforeSwitch - Optional callback to run before switching (e.g., close dropdown)
     */
    const requestKickerSwitch = useCallback(
        ({ targetKickerId, targetKickerName, navigationUrl, onBeforeSwitch }) => {
            const isDifferentKicker =
                targetKickerId && currentKicker && targetKickerId !== currentKicker;

            if (isDifferentKicker) {
                if (autoSwitchKicker) {
                    // Auto-switch enabled - switch immediately
                    onBeforeSwitch?.();
                    setCurrentKicker(targetKickerId);
                    navigate(navigationUrl);
                } else {
                    // Show confirmation modal
                    setPendingSwitch({
                        targetKickerId,
                        targetKickerName,
                        navigationUrl,
                        onBeforeSwitch,
                    });
                    setShowModal(true);
                }
            } else {
                // Same kicker - navigate directly
                onBeforeSwitch?.();
                navigate(navigationUrl);
            }
        },
        [currentKicker, autoSwitchKicker, setCurrentKicker, navigate]
    );

    function handleConfirmSwitch() {
        if (pendingSwitch) {
            const { targetKickerId, navigationUrl, onBeforeSwitch } = pendingSwitch;
            setShowModal(false);
            setPendingSwitch(null);
            onBeforeSwitch?.();
            setCurrentKicker(targetKickerId);
            navigate(navigationUrl);
        }
    }

    function handleCancelSwitch() {
        setShowModal(false);
        setPendingSwitch(null);
    }

    function handleDontAskAgain() {
        setAutoSwitchKicker(true);
    }

    return (
        <KickerSwitchContext.Provider value={{ requestKickerSwitch }}>
            {children}
            {showModal && pendingSwitch && (
                <KickerSwitchConfirmModal
                    kickerName={pendingSwitch.targetKickerName}
                    onConfirm={handleConfirmSwitch}
                    onCancel={handleCancelSwitch}
                    onDontAskAgain={handleDontAskAgain}
                />
            )}
        </KickerSwitchContext.Provider>
    );
}

function useKickerSwitch() {
    const context = useContext(KickerSwitchContext);

    if (context === undefined) {
        throw new Error(
            "KickerSwitchContext was used outside the KickerSwitchProvider"
        );
    }

    return context;
}

export { KickerSwitchProvider, useKickerSwitch };
