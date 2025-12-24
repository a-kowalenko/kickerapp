import styled from "styled-components";
import { useState, useEffect } from "react";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import { useUser } from "../authentication/useUser";
import {
    useStatusDisplayConfig,
    useBatchUpdateStatusConfig,
} from "./useStatusDisplayConfig";
import Button from "../../ui/Button";
import Spinner from "../../ui/Spinner";
import Heading from "../../ui/Heading";
import Avatar from "../../ui/Avatar";
import {
    HiArrowUp,
    HiArrowDown,
    HiLockClosed,
    HiLockOpen,
} from "react-icons/hi2";
import { media } from "../../utils/constants";

const StyledStatusSettings = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
`;

const InfoText = styled.p`
    color: var(--color-grey-500);
    font-size: 1.4rem;
    line-height: 1.6;
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const StatusTable = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--color-grey-200);
    padding: 1.6rem;
`;

const TableHeader = styled.div`
    display: grid;
    grid-template-columns: auto 1fr 10rem 6rem 7rem 5rem;
    gap: 1rem;
    align-items: center;
    padding: 0.8rem 1.2rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--color-grey-500);

    ${media.tablet} {
        display: none;
    }
`;

const StatusCard = styled.div`
    display: grid;
    grid-template-columns: auto 1fr 10rem 6rem 7rem 5rem;
    gap: 1rem;
    align-items: center;
    padding: 1rem 1.2rem;
    background-color: ${(props) =>
        props.$disabled
            ? "var(--color-grey-100)"
            : "var(--primary-background-color)"};
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--color-grey-200);
    opacity: ${(props) => (props.$disabled ? 0.6 : 1)};

    ${media.tablet} {
        grid-template-columns: auto 1fr auto;
        gap: 1rem;
    }
`;

const StatusInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const StatusName = styled.span`
    font-weight: 500;
    font-size: 1.4rem;
    color: var(--primary-text-color);
`;

const StatusKeyInput = styled.input`
    font-size: 1.2rem;
    color: var(--color-grey-600);
    font-family: monospace;
    background: transparent;
    border: 1px solid transparent;
    padding: 0.2rem 0.4rem;
    border-radius: var(--border-radius-sm);
    width: 100%;
    max-width: 12rem;

    &:hover {
        border-color: var(--color-grey-300);
    }

    &:focus {
        outline: none;
        border-color: var(--color-brand-500);
        background-color: var(--primary-background-color);
    }
`;

const LayerSelect = styled.select`
    padding: 0.5rem 0.8rem;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--color-grey-300);
    background-color: var(--primary-background-color);
    color: var(--primary-text-color);
    font-size: 1.2rem;
    cursor: pointer;
    width: 100%;

    ${media.tablet} {
        display: none;
    }
`;

const PriorityControl = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4rem;

    ${media.tablet} {
        display: none;
    }
`;

const PriorityValue = styled.span`
    font-size: 1.3rem;
    font-weight: 500;
    min-width: 2.4rem;
    text-align: center;
    color: var(--color-brand-600);
`;

const IconButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    border: none;
    background-color: ${(props) =>
        props.$active ? "var(--color-brand-500)" : "var(--color-grey-200)"};
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    color: ${(props) => (props.$active ? "white" : "var(--color-grey-600)")};
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background-color: ${(props) =>
            props.$active
                ? "var(--color-brand-600)"
                : "var(--color-brand-500)"};
        color: white;
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
`;

const ExclusiveButton = styled(IconButton)`
    background-color: ${(props) =>
        props.$exclusive ? "var(--color-yellow-500)" : "var(--color-grey-200)"};
    color: ${(props) => (props.$exclusive ? "white" : "var(--color-grey-600)")};

    &:hover:not(:disabled) {
        background-color: ${(props) =>
            props.$exclusive
                ? "var(--color-yellow-600)"
                : "var(--color-yellow-500)"};
        color: white;
    }
`;

const ToggleSwitch = styled.label`
    position: relative;
    display: inline-block;
    width: 4.4rem;
    height: 2.4rem;
    cursor: pointer;
`;

const ToggleSlider = styled.span`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${(props) =>
        props.$checked ? "var(--color-brand-500)" : "var(--color-grey-300)"};
    border-radius: 2.4rem;
    transition: 0.3s;

    &::before {
        position: absolute;
        content: "";
        height: 1.8rem;
        width: 1.8rem;
        left: ${(props) => (props.$checked ? "2.3rem" : "0.3rem")};
        bottom: 0.3rem;
        background-color: white;
        border-radius: 50%;
        transition: 0.3s;
    }
`;

const HiddenCheckbox = styled.input`
    opacity: 0;
    width: 0;
    height: 0;
`;

const ButtonRow = styled.div`
    display: flex;
    gap: 1.2rem;
    justify-content: flex-end;
    margin-top: 1.6rem;
`;

const PreviewSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding: 1.6rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--color-grey-200);
`;

const PreviewItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
`;

const PreviewLabel = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-500);
`;

const PreviewControls = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 1.6rem;
    padding: 1.2rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--color-grey-200);
`;

const ControlGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
`;

const ControlLabel = styled.span`
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--color-grey-500);
`;

const SizeSelector = styled.div`
    display: flex;
    gap: 0.4rem;
`;

const SizeButton = styled.button`
    padding: 0.4rem 0.8rem;
    border: 1px solid
        ${(props) =>
            props.$active ? "var(--color-brand-500)" : "var(--color-grey-300)"};
    background-color: ${(props) =>
        props.$active
            ? "var(--color-brand-500)"
            : "var(--primary-background-color)"};
    color: ${(props) => (props.$active ? "white" : "var(--color-grey-600)")};
    border-radius: var(--border-radius-sm);
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: var(--color-brand-500);
        background-color: ${(props) =>
            props.$active
                ? "var(--color-brand-600)"
                : "var(--color-brand-100)"};
    }
`;

const StatusSelector = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
`;

const StatusChip = styled.button`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    border: 1px solid
        ${(props) =>
            props.$active ? "var(--color-brand-500)" : "var(--color-grey-300)"};
    background-color: ${(props) =>
        props.$active
            ? "var(--color-brand-100)"
            : "var(--primary-background-color)"};
    color: ${(props) =>
        props.$active ? "var(--color-brand-700)" : "var(--color-grey-600)"};
    border-radius: 2rem;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: var(--color-brand-500);
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`;

const PreviewDisplay = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    min-height: 12rem;
`;

const Legend = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 1.6rem;
    padding: 1.2rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.2rem;
`;

const LegendItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--color-grey-600);
`;

const LegendIcon = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--border-radius-sm);
    background-color: ${(props) => props.$bg || "var(--color-grey-200)"};
    color: ${(props) => props.$color || "var(--color-grey-600)"};
    font-size: 1rem;
`;

const LAYER_ORDER = ["effect", "overlay", "background"];
const LAYER_LABELS = {
    effect: "Effect",
    overlay: "Overlay",
    background: "Background",
};

function StatusDisplaySettings() {
    const { data: kickerData, isLoading: isLoadingKicker } = useKickerInfo();
    const { user } = useUser();
    const { config, isLoading: isLoadingConfig } = useStatusDisplayConfig();
    const { batchUpdate, isBatchUpdating } = useBatchUpdateStatusConfig();

    const [localConfig, setLocalConfig] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [previewSize, setPreviewSize] = useState("large");
    const [selectedStatuses, setSelectedStatuses] = useState([]);

    const isLoading = isLoadingKicker || isLoadingConfig;
    const isAdmin = kickerData?.admin === user?.id;

    // Sync local state with server config (only on initial load or after save)
    const configString = JSON.stringify(config);
    useEffect(() => {
        if (config && config.length > 0 && localConfig.length === 0) {
            setLocalConfig(config);
            setHasChanges(false);
        }
    }, [configString]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isLoading) {
        return <Spinner />;
    }

    if (!isAdmin) {
        return (
            <StyledStatusSettings>
                <InfoText>
                    Only the kicker admin can manage status display settings.
                </InfoText>
            </StyledStatusSettings>
        );
    }

    // Sort by priority (highest first)
    const sortedConfig = [...localConfig].sort(
        (a, b) => b.priority - a.priority
    );

    const handleToggleEnabled = (statusKey) => {
        setLocalConfig((prev) =>
            prev.map((item) =>
                item.statusKey === statusKey
                    ? { ...item, isEnabled: !item.isEnabled }
                    : item
            )
        );
        setHasChanges(true);
    };

    const handleToggleExclusive = (statusKey) => {
        setLocalConfig((prev) =>
            prev.map((item) =>
                item.statusKey === statusKey
                    ? { ...item, isExclusive: !item.isExclusive }
                    : item
            )
        );
        setHasChanges(true);
    };

    const handleLayerChange = (statusKey, newLayer) => {
        setLocalConfig((prev) =>
            prev.map((item) =>
                item.statusKey === statusKey
                    ? { ...item, layer: newLayer }
                    : item
            )
        );
        setHasChanges(true);
    };

    const handlePriorityChange = (statusKey, delta) => {
        setLocalConfig((prev) =>
            prev.map((item) =>
                item.statusKey === statusKey
                    ? {
                          ...item,
                          priority: Math.max(
                              1,
                              Math.min(100, item.priority + delta)
                          ),
                      }
                    : item
            )
        );
        setHasChanges(true);
    };

    const handleStatusKeyChange = (oldKey, newKey) => {
        // Validate: no spaces, alphanumeric + camelCase
        const sanitized = newKey.replace(/[^a-zA-Z0-9]/g, "");
        if (sanitized !== newKey) return;

        setLocalConfig((prev) =>
            prev.map((item) =>
                item.statusKey === oldKey
                    ? { ...item, statusKey: sanitized }
                    : item
            )
        );
        setHasChanges(true);
    };

    const handleSave = () => {
        batchUpdate(localConfig, {
            onSuccess: () => {
                setHasChanges(false);
            },
        });
    };

    const handleReset = () => {
        setLocalConfig(config);
        setHasChanges(false);
    };

    const handleTogglePreviewStatus = (statusKey) => {
        setSelectedStatuses((prev) =>
            prev.includes(statusKey)
                ? prev.filter((s) => s !== statusKey)
                : [...prev, statusKey]
        );
    };

    const AVATAR_SIZES = ["xs", "small", "medium", "large", "huge"];

    return (
        <StyledStatusSettings>
            <Section>
                <InfoText>
                    Configure how player statuses are displayed on avatars. Each
                    status can be assigned to a <strong>layer</strong> (effect,
                    overlay, background) and has a <strong>priority</strong>{" "}
                    value (1-100).
                </InfoText>
                <Legend>
                    <LegendItem>
                        <LegendIcon
                            $bg="var(--color-yellow-500)"
                            $color="white"
                        >
                            <HiLockClosed size={12} />
                        </LegendIcon>
                        <span>
                            <strong>Exclusive:</strong> When multiple exclusive
                            statuses in the same layer are active, only the one
                            with the highest priority is shown
                        </span>
                    </LegendItem>
                    <LegendItem>
                        <LegendIcon $bg="var(--color-grey-200)">
                            <HiLockOpen size={12} />
                        </LegendIcon>
                        <span>
                            <strong>Combinable:</strong> Always shown regardless
                            of priority, can stack with other statuses
                        </span>
                    </LegendItem>
                </Legend>
            </Section>

            <StatusTable>
                <TableHeader>
                    <span>Preview</span>
                    <span>Status</span>
                    <span>Layer</span>
                    <span>Priority</span>
                    <span>Exclusive</span>
                    <span>Enabled</span>
                </TableHeader>

                {sortedConfig.map((item) => (
                    <StatusCard key={item.id} $disabled={!item.isEnabled}>
                        <Avatar
                            src="https://api.dicebear.com/7.x/adventurer/svg?seed=Preview"
                            $size="small"
                            $status={item.isEnabled ? item.statusKey : null}
                        />
                        <StatusInfo>
                            <StatusName>{item.displayName}</StatusName>
                            <StatusKeyInput
                                value={item.statusKey}
                                onChange={(e) =>
                                    handleStatusKeyChange(
                                        item.statusKey,
                                        e.target.value
                                    )
                                }
                                title="Status key (used in code)"
                            />
                        </StatusInfo>
                        <LayerSelect
                            value={item.layer}
                            onChange={(e) =>
                                handleLayerChange(
                                    item.statusKey,
                                    e.target.value
                                )
                            }
                        >
                            {LAYER_ORDER.map((l) => (
                                <option key={l} value={l}>
                                    {LAYER_LABELS[l]}
                                </option>
                            ))}
                        </LayerSelect>
                        <PriorityControl>
                            <IconButton
                                onClick={() =>
                                    handlePriorityChange(item.statusKey, -5)
                                }
                                disabled={item.priority <= 1}
                                title="Decrease priority"
                            >
                                <HiArrowDown size={14} />
                            </IconButton>
                            <PriorityValue>{item.priority}</PriorityValue>
                            <IconButton
                                onClick={() =>
                                    handlePriorityChange(item.statusKey, 5)
                                }
                                disabled={item.priority >= 100}
                                title="Increase priority"
                            >
                                <HiArrowUp size={14} />
                            </IconButton>
                        </PriorityControl>
                        <ExclusiveButton
                            $exclusive={item.isExclusive}
                            onClick={() =>
                                handleToggleExclusive(item.statusKey)
                            }
                            title={
                                item.isExclusive
                                    ? "Exclusive: Only one status per layer"
                                    : "Combinable: Can show with other statuses"
                            }
                        >
                            {item.isExclusive ? (
                                <HiLockClosed size={14} />
                            ) : (
                                <HiLockOpen size={14} />
                            )}
                        </ExclusiveButton>
                        <ToggleSwitch>
                            <HiddenCheckbox
                                type="checkbox"
                                checked={item.isEnabled}
                                onChange={() =>
                                    handleToggleEnabled(item.statusKey)
                                }
                            />
                            <ToggleSlider $checked={item.isEnabled} />
                        </ToggleSwitch>
                    </StatusCard>
                ))}
            </StatusTable>

            <PreviewSection>
                <Heading as="h3">Preview</Heading>
                <PreviewControls>
                    <ControlGroup>
                        <ControlLabel>Avatar Size</ControlLabel>
                        <SizeSelector>
                            {AVATAR_SIZES.map((size) => (
                                <SizeButton
                                    key={size}
                                    $active={previewSize === size}
                                    onClick={() => setPreviewSize(size)}
                                >
                                    {size}
                                </SizeButton>
                            ))}
                        </SizeSelector>
                    </ControlGroup>
                    <ControlGroup>
                        <ControlLabel>Active Statuses</ControlLabel>
                        <StatusSelector>
                            {sortedConfig
                                .filter((item) => item.isEnabled)
                                .map((item) => (
                                    <StatusChip
                                        key={item.statusKey}
                                        $active={selectedStatuses.includes(
                                            item.statusKey
                                        )}
                                        onClick={() =>
                                            handleTogglePreviewStatus(
                                                item.statusKey
                                            )
                                        }
                                    >
                                        {item.displayName}
                                    </StatusChip>
                                ))}
                        </StatusSelector>
                    </ControlGroup>
                </PreviewControls>
                <PreviewDisplay>
                    <PreviewItem>
                        <Avatar
                            src="https://api.dicebear.com/7.x/adventurer/svg?seed=Preview"
                            $size={previewSize}
                            $status={
                                selectedStatuses.length > 0
                                    ? selectedStatuses
                                    : null
                            }
                        />
                        <PreviewLabel>
                            {selectedStatuses.length > 0
                                ? selectedStatuses.join(" + ")
                                : "No status selected"}
                        </PreviewLabel>
                    </PreviewItem>
                </PreviewDisplay>
            </PreviewSection>

            {hasChanges && (
                <ButtonRow>
                    <Button
                        $variation="secondary"
                        onClick={handleReset}
                        disabled={isBatchUpdating}
                    >
                        Reset
                    </Button>
                    <Button onClick={handleSave} disabled={isBatchUpdating}>
                        {isBatchUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                </ButtonRow>
            )}
        </StyledStatusSettings>
    );
}

export default StatusDisplaySettings;
