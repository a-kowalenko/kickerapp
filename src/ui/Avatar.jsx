import styled, { css } from "styled-components";

// Asset Imports - GIFs
import OnFireGif from "../assets/avatar_highlights/gifs/OnFire.gif";

// Asset Imports - Sprites (für zukünftige Erweiterungen)
// import ChampionSprite from "../assets/avatar_highlights/sprites/Champion.png";

/* ----------------------------------------
   Status Effect Konfiguration
   - type: 'gif' | 'sprite'
   - asset: importiertes Asset
   - zIndex: Layering-Reihenfolge (höher = weiter vorne)
   - inset: Positionierung (negativ = ragt heraus)
----------------------------------------- */
const STATUS_EFFECTS = {
    onFire: {
        type: "gif",
        asset: OnFireGif,
        zIndex: 11,
        inset: "-50%",
    },
    hotStreak: {
        type: "gif",
        asset: OnFireGif, // Placeholder - später eigenes Asset
        zIndex: 11,
        inset: "-18%",
    },
    iceCold: {
        type: "gif",
        asset: null, // Asset noch nicht vorhanden
        zIndex: 1,
        inset: "-15%",
    },
    champion: {
        type: "sprite",
        asset: null, // Asset noch nicht vorhanden
        zIndex: 3,
        inset: "-12%",
    },
    elite: {
        type: "sprite",
        asset: null, // Asset noch nicht vorhanden
        zIndex: 2,
        inset: "-14%",
    },
    grandmaster: {
        type: "sprite",
        asset: null, // Asset noch nicht vorhanden
        zIndex: 2,
        inset: "-16%",
    },
    comeback: {
        type: "gif",
        asset: null, // Asset noch nicht vorhanden
        zIndex: 1,
        inset: "-15%",
    },
    speedDemon: {
        type: "gif",
        asset: null, // Asset noch nicht vorhanden
        zIndex: 1,
        inset: "-15%",
    },
    veteran: {
        type: "sprite",
        asset: null, // Asset noch nicht vorhanden
        zIndex: 2,
        inset: "-10%",
    },
    mvp: {
        type: "sprite",
        asset: null, // Asset noch nicht vorhanden
        zIndex: 3,
        inset: "-12%",
    },
};

/* ----------------------------------------
   Opacity nach Avatar-Größe
   (kleinere Avatare = reduzierte Opacity)
----------------------------------------- */
const OPACITY_BY_SIZE = {
    xs: 1,
    small: 1,
    medium: 1,
    large: 0.7,
    huge: 1,
};

/* ----------------------------------------
   Größen
----------------------------------------- */
const sizes = {
    xs: css`
        width: 2.6rem;
        height: 2.6rem;
    `,
    small: css`
        width: 3.4rem;
        height: 3.4rem;
    `,
    medium: css`
        width: 6rem;
        height: 6rem;
    `,
    large: css`
        width: 10rem;
        height: 10rem;
    `,
    huge: css`
        width: 30rem;
        height: 30rem;
    `,
};

/* ----------------------------------------
   Wrapper (Hover-Transform für Avatar + Overlays)
----------------------------------------- */
const AvatarWrapper = styled.div`
    position: relative;
    display: inline-block;
    transition: transform 0.3s;

    &:hover {
        transform: scale(1.15);
    }
`;

/* ----------------------------------------
   Status Overlay (für jeden aktiven Status)
   - leicht nach rechts verschoben mit left-offset
----------------------------------------- */
const StatusOverlay = styled.div`
    position: absolute;
    top: calc(${(props) => props.$inset || "-15%"} + 5%);
    bottom: calc(${(props) => props.$inset || "-15%"} + 2%);
    left: calc(${(props) => props.$inset || "-15%"} + 5%);
    right: calc(${(props) => props.$inset || "-15%"} + 0%);
    z-index: ${(props) => props.$zIndex || 0};

    background-image: url(${(props) => props.$asset});
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    border-radius: 50%;

    filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.25));
    pointer-events: none;

    opacity: ${(props) => props.$opacity || 1};
    transition: opacity 0.3s ease-in-out;
`;

/* ----------------------------------------
   Eigentliches Avatar-Bild
----------------------------------------- */
const AvatarImage = styled.img`
    position: relative;
    z-index: 10;

    display: block;
    ${(props) => sizes[props.$size]}
    aspect-ratio: 1;
    object-fit: cover;
    object-position: center;
    border-radius: 50%;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);

    ${(props) => (props.$cursor === "pointer" ? "cursor: pointer;" : "")}

    border: 1px solid var(--primary-border-color);
`;

/* ----------------------------------------
   Hilfsfunktion: Status-Array normalisieren
----------------------------------------- */
const normalizeStatus = (status) => {
    if (!status) return [];
    if (Array.isArray(status)) return status;
    return [status];
};

/* ----------------------------------------
   Frame Overlay (für Reward-Rahmen)
   - Rendert über dem Avatar-Bild
   - Nimmt URL von reward_definitions.display_value
----------------------------------------- */
const FrameOverlay = styled.div`
    position: absolute;
    top: -10%;
    bottom: -10%;
    left: -10%;
    right: -10%;
    z-index: 12;
    background-image: url(${(props) => props.$frameUrl});
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    pointer-events: none;
`;

/* ----------------------------------------
   Öffentliche Avatar-Komponente
   Props:
   - player: object - Player-Objekt mit avatar, status und rewards (optional)
   - src: string - Avatar-URL (optional wenn player übergeben)
   - $status: string | string[] - Status-Effekte (optional wenn player übergeben)
   - $size: 'xs' | 'small' | 'medium' | 'large' | 'huge'
   - $cursor: 'pointer' | 'none'
   - $frameUrl: string - URL für den Rahmen (Reward-Frame)
   - ...rest: alle anderen img-Props (alt, etc.)
   
   Priorität: Explizite Props (src, $status, $frameUrl) überschreiben player-Werte
   
   Player-Objekt kann enthalten:
   - avatar: string - Avatar URL
   - status: string | string[] - Status-Effekte
   - rewards: { frame: { display_value: string } } - Selected rewards
----------------------------------------- */
const Avatar = ({
    player,
    src,
    $status = "onFire",
    $size = "large",
    $frameUrl,
    $cursor = "none",
    ...props
}) => {
    // Werte aus player-Objekt extrahieren, explizite Props haben Priorität
    const avatarSrc = src ?? player?.avatar;
    const status = $status ?? player?.status;

    // Frame URL: explizite Prop > player.rewards.frame.display_value
    const frameUrl = $frameUrl ?? player?.rewards?.frame?.display_value;

    const statusArray = normalizeStatus(status);
    const opacity = OPACITY_BY_SIZE[$size] || 1;

    // Rendere Overlays für gültige Status
    const overlays = statusArray
        .map((statusKey) => {
            const effect = STATUS_EFFECTS[statusKey];

            // Status existiert nicht
            if (!effect) {
                if (process.env.NODE_ENV === "development") {
                    console.warn(
                        `[Avatar] Unknown status: "${statusKey}". Available: ${Object.keys(
                            STATUS_EFFECTS
                        ).join(", ")}`
                    );
                }
                return null;
            }

            // Asset nicht vorhanden
            if (!effect.asset) {
                if (process.env.NODE_ENV === "development") {
                    console.warn(
                        `[Avatar] No asset available for status: "${statusKey}". Skipping overlay.`
                    );
                }
                return null;
            }

            return (
                <StatusOverlay
                    key={statusKey}
                    $asset={effect.asset}
                    $zIndex={effect.zIndex}
                    $inset={effect.inset}
                    $opacity={opacity}
                />
            );
        })
        .filter(Boolean);

    return (
        <AvatarWrapper>
            {overlays}
            <AvatarImage
                src={avatarSrc}
                $size={$size}
                $cursor={$cursor}
                {...props}
            />
            {frameUrl && <FrameOverlay $frameUrl={frameUrl} />}
        </AvatarWrapper>
    );
};

export default Avatar;
