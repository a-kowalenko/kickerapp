import styled, { css, keyframes } from "styled-components";
import { usePlayerStatusForAvatar } from "../features/players/usePlayerStatus";

// Asset Imports - GIFs
import RedThunder from "../assets/avatar_highlights/sprites/RedThunder.png";
import IceCold from "../assets/avatar_highlights/gifs/IceCold.gif";
import OnFireGif from "../assets/avatar_highlights/gifs/OnFire.gif";

// Asset Imports - Sprites (für zukünftige Erweiterungen)
// import ChampionSprite from "../assets/avatar_highlights/sprites/Champion.png";

/* ----------------------------------------
   Größen-Konfiguration für Avatar
   Alle Werte in rem für konsistente Skalierung
----------------------------------------- */
const SIZE_CONFIG = {
    xs: {
        size: 2.6,
        // Overlay-Anpassungen (in % relativ zum Avatar)
        overlayInset: -8, // Wie weit das Overlay übersteht
        overlayOffset: { top: 3, left: 3, bottom: 2, right: 0 }, // Feintuning
        frameInset: -6,
        showEffects: false, // Bei xs keine Effekte anzeigen
    },
    small: {
        size: 3.4,
        overlayInset: -12,
        overlayOffset: { top: 4, left: -10, bottom: 2, right: 4 },
        frameInset: -8,
        showEffects: true,
    },
    medium: {
        size: 6,
        overlayInset: -18,
        overlayOffset: { top: 5, left: 5, bottom: 2, right: 0 },
        frameInset: -10,
        showEffects: true,
    },
    large: {
        size: 10,
        overlayInset: -35,
        overlayOffset: { top: 5, left: 5, bottom: 2, right: 2 },
        frameInset: -10,
        showEffects: true,
    },
    huge: {
        size: 30,
        overlayInset: -15,
        overlayOffset: { top: 3, left: 3, bottom: 1, right: 0 },
        frameInset: -8,
        showEffects: true,
    },
};

/* ----------------------------------------
   Status Effect Konfiguration
   
   Mapping von status_definitions.asset_key zu visuellen Effekten
   
   type: 'gif' | 'sprite' | 'css'
   asset: importiertes Asset (null = CSS-basiert oder nicht vorhanden)
   zIndex: Layering-Reihenfolge (höher = weiter vorne)
   scale: Skalierungsfaktor für das Overlay (1 = normal)
   cssEffect: CSS-Klasse für animierte Effekte (wenn type='css')
   color: Farbe für CSS-basierte Effekte
----------------------------------------- */
const STATUS_EFFECTS = {
    // ============== WIN STREAK STATUSES ==============
    warmingUp: {
        type: "css",
        asset: null,
        zIndex: 11,
        scale: 1.0,
        cssEffect: "warming",
        color: "rgba(255, 200, 100, 0.5)",
    },
    hotStreak: {
        type: "gif",
        asset: OnFireGif,
        zIndex: 11,
        scale: 1.4, // Feuer sollte größer sein
        cssEffect: "hot",
        color: "rgba(255, 100, 50, 0.6)",
    },
    onFire: {
        type: "gif",
        asset: OnFireGif,
        zIndex: 11,
        scale: 1.6, // Noch größer
        cssEffect: "fire",
        color: "rgba(255, 50, 0, 0.7)",
    },
    legendary: {
        type: "gif",
        asset: OnFireGif, // TODO: Eigenes goldenes Feuer-Asset
        zIndex: 11,
        scale: 1.8,
        cssEffect: "legendary",
        color: "rgba(255, 215, 0, 0.8)",
    },

    // ============== LOSS STREAK STATUSES ==============
    cold: {
        type: "gif",
        asset: IceCold,
        zIndex: 11,
        scale: 0.5,
        cssEffect: "cold",
        color: "rgba(100, 180, 255, 0.4)",
    },
    iceCold: {
        type: "gif",
        asset: IceCold,
        zIndex: 11,
        scale: 0.5,
        cssEffect: "ice",
        color: "rgba(50, 150, 255, 0.6)",
    },
    frozen: {
        type: "gif",
        asset: IceCold,
        zIndex: 11,
        scale: 0.5,
        cssEffect: "frozen",
        color: "rgba(0, 100, 255, 0.7)",
    },

    // ============== EVENT STATUSES ==============
    humiliated: {
        type: "css",
        asset: null,
        zIndex: 1,
        scale: 1.0,
        cssEffect: "humiliated",
        color: "rgba(128, 128, 128, 0.5)",
    },
    dominator: {
        type: "sprite",
        asset: RedThunder,
        zIndex: 3,
        scale: 1.2,
        cssEffect: "dominator",
        color: "rgba(255, 50, 50, 0.6)",
        spriteDuration: "0.5s",
    },
    comeback: {
        type: "css",
        asset: null,
        zIndex: 2,
        scale: 1.1,
        cssEffect: "comeback",
        color: "rgba(100, 255, 150, 0.5)",
    },
    underdog: {
        type: "css",
        asset: null,
        zIndex: 2,
        scale: 1.05,
        cssEffect: "underdog",
        color: "rgba(255, 200, 100, 0.5)",
    },
    giantSlayer: {
        type: "css",
        asset: null,
        zIndex: 3,
        scale: 1.15,
        cssEffect: "slayer",
        color: "rgba(200, 50, 255, 0.6)",
    },

    // ============== LEGACY/OTHER STATUSES ==============
    champion: {
        type: "sprite",
        asset: null,
        zIndex: 3,
        scale: 1.1,
        cssEffect: "champion",
        color: "rgba(255, 215, 0, 0.6)",
    },
    elite: {
        type: "sprite",
        asset: null,
        zIndex: 2,
        scale: 1.1,
        cssEffect: "elite",
        color: "rgba(200, 150, 255, 0.5)",
    },
    grandmaster: {
        type: "sprite",
        asset: null,
        zIndex: 2,
        scale: 1.15,
        cssEffect: "grandmaster",
        color: "rgba(255, 100, 100, 0.6)",
    },
    speedDemon: {
        type: "gif",
        asset: null,
        zIndex: 1,
        scale: 1.1,
        cssEffect: "speed",
        color: "rgba(255, 255, 100, 0.5)",
    },
    veteran: {
        type: "sprite",
        asset: null,
        zIndex: 2,
        scale: 1.05,
        cssEffect: "veteran",
        color: "rgba(150, 150, 150, 0.5)",
    },
    mvp: {
        type: "sprite",
        asset: null,
        zIndex: 3,
        scale: 1.1,
        cssEffect: "mvp",
        color: "rgba(255, 215, 0, 0.6)",
    },
};

/* ----------------------------------------
   CSS Animationen für Status-Effekte
----------------------------------------- */
const pulseGlow = keyframes`
    0%, 100% { 
        box-shadow: 0 0 15px var(--glow-color), 0 0 30px var(--glow-color);
        opacity: 0.7;
    }
    50% { 
        box-shadow: 0 0 25px var(--glow-color), 0 0 50px var(--glow-color);
        opacity: 1;
    }
`;

const iceShimmer = keyframes`
    0%, 100% {
        box-shadow: 0 0 10px var(--glow-color), inset 0 0 15px var(--glow-color);
        opacity: 0.5;
    }
    50% {
        box-shadow: 0 0 20px var(--glow-color), inset 0 0 25px var(--glow-color);
        opacity: 0.8;
    }
`;

const fireGlow = keyframes`
    0%, 100% {
        box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color), 0 0 60px var(--glow-color);
    }
    25% {
        box-shadow: 0 0 25px var(--glow-color), 0 0 50px var(--glow-color), 0 0 75px var(--glow-color);
    }
    50% {
        box-shadow: 0 0 30px var(--glow-color), 0 0 60px var(--glow-color), 0 0 90px var(--glow-color);
    }
    75% {
        box-shadow: 0 0 25px var(--glow-color), 0 0 50px var(--glow-color), 0 0 75px var(--glow-color);
    }
`;

const greyOut = keyframes`
    0%, 100% { filter: grayscale(40%); opacity: 0.7; }
    50% { filter: grayscale(60%); opacity: 0.5; }
`;

/* ----------------------------------------
   Sprite Animation (2 columns, 3 rows = 6 frames)
   Läuft durch alle Frames des Sprite-Sheets
----------------------------------------- */
const spriteAnimation = keyframes`
    0% { background-position: 0% 0%; }
    16.66% { background-position: 100% 0%; }
    33.33% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    66.66% { background-position: 0% 100%; }
    83.33% { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
`;

/* ----------------------------------------
   Opacity nach Avatar-Größe
   (kleinere Avatare = reduzierte Opacity)
----------------------------------------- */
const OPACITY_BY_SIZE = {
    xs: 0.8,
    small: 0.85,
    medium: 0.9,
    large: 1,
    huge: 1,
};

/* ----------------------------------------
   Größen (für AvatarImage)
----------------------------------------- */
const sizes = {
    xs: css`
        width: ${SIZE_CONFIG.xs.size}rem;
        height: ${SIZE_CONFIG.xs.size}rem;
    `,
    small: css`
        width: ${SIZE_CONFIG.small.size}rem;
        height: ${SIZE_CONFIG.small.size}rem;
    `,
    medium: css`
        width: ${SIZE_CONFIG.medium.size}rem;
        height: ${SIZE_CONFIG.medium.size}rem;
    `,
    large: css`
        width: ${SIZE_CONFIG.large.size}rem;
        height: ${SIZE_CONFIG.large.size}rem;
    `,
    huge: css`
        width: ${SIZE_CONFIG.huge.size}rem;
        height: ${SIZE_CONFIG.huge.size}rem;
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
   CSS-basierter Glow Effekt (fallback wenn kein Asset)
----------------------------------------- */
const CssGlowOverlay = styled.div`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: ${(props) => props.$zIndex || 0};
    border-radius: 50%;
    pointer-events: none;
    --glow-color: ${(props) => props.$color || "rgba(255, 100, 50, 0.5)"};

    ${(props) =>
        props.$cssEffect === "warming" &&
        css`
            animation: ${pulseGlow} 2s ease-in-out infinite;
        `}

    ${(props) =>
        props.$cssEffect === "hot" &&
        css`
            animation: ${pulseGlow} 1.5s ease-in-out infinite;
        `}

    ${(props) =>
        props.$cssEffect === "fire" &&
        css`
            animation: ${fireGlow} 1s ease-in-out infinite;
        `}

    ${(props) =>
        props.$cssEffect === "legendary" &&
        css`
            animation: ${fireGlow} 0.8s ease-in-out infinite;
        `}

    ${(props) =>
        props.$cssEffect === "cold" &&
        css`
            animation: ${iceShimmer} 3s ease-in-out infinite;
        `}

    ${(props) =>
        props.$cssEffect === "ice" &&
        css`
            animation: ${iceShimmer} 2s ease-in-out infinite;
        `}

    ${(props) =>
        props.$cssEffect === "frozen" &&
        css`
            animation: ${iceShimmer} 1.5s ease-in-out infinite;
            filter: brightness(1.2);
        `}

    ${(props) =>
        props.$cssEffect === "humiliated" &&
        css`
            animation: ${greyOut} 4s ease-in-out infinite;
        `}

    ${(props) =>
        props.$cssEffect === "dominator" &&
        css`
            animation: ${pulseGlow} 1.2s ease-in-out infinite;
        `}

    ${(props) =>
        props.$cssEffect === "comeback" &&
        css`
            animation: ${pulseGlow} 1.5s ease-in-out infinite;
        `}

    ${(props) =>
        props.$cssEffect === "underdog" &&
        css`
            animation: ${pulseGlow} 2s ease-in-out infinite;
        `}

    ${(props) =>
        props.$cssEffect === "slayer" &&
        css`
            animation: ${fireGlow} 1.2s ease-in-out infinite;
        `}

    opacity: ${(props) => props.$opacity || 1};
    transition: opacity 0.3s ease-in-out;
`;

/* ----------------------------------------
   Status Overlay (für GIF Assets)
   - Skaliert basierend auf Avatar-Größe und Effect-Scale
----------------------------------------- */
const StatusOverlay = styled.div`
    position: absolute;
    z-index: ${(props) => props.$zIndex || 0};

    /* Berechne Position basierend auf Größe und Scale */
    ${(props) => {
        const sizeConfig = SIZE_CONFIG[props.$avatarSize] || SIZE_CONFIG.large;
        const scale = props.$scale || 1;
        const baseInset = sizeConfig.overlayInset * scale;
        const offset = sizeConfig.overlayOffset;

        return css`
            top: calc(${baseInset}% + ${offset.top}%);
            bottom: calc(${baseInset}% + ${offset.bottom}%);
            left: calc(${baseInset}% + ${offset.left}%);
            right: calc(${baseInset}% + ${offset.right}%);
        `;
    }}

    background-image: url(${(props) => props.$asset});
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    border-radius: 50%;

    filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.2));
    pointer-events: none;

    opacity: ${(props) => props.$opacity || 1};
    transition: opacity 0.3s ease-in-out;
`;

/* ----------------------------------------
   Sprite Overlay (für animierte Sprite-Sheets)
   - 2 columns, 3 rows = 6 frames
   - Skaliert basierend auf Avatar-Größe
----------------------------------------- */
const SpriteOverlay = styled.div`
    position: absolute;
    z-index: ${(props) => props.$zIndex || 0};

    /* Berechne Position basierend auf Größe und Scale */
    ${(props) => {
        const sizeConfig = SIZE_CONFIG[props.$avatarSize] || SIZE_CONFIG.large;
        const scale = props.$scale || 1;
        const baseInset = sizeConfig.overlayInset * scale;
        const offset = sizeConfig.overlayOffset;

        return css`
            top: calc(${baseInset}% + ${offset.top}%);
            bottom: calc(${baseInset}% + ${offset.bottom}%);
            left: calc(${baseInset}% + ${offset.left}%);
            right: calc(${baseInset}% + ${offset.right}%);
        `;
    }}

    background-image: url(${(props) => props.$asset});
    background-repeat: no-repeat;
    /* 200% width for 2 columns, 300% height for 3 rows */
    background-size: 200% 300%;
    background-position: 0% 0%;

    filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.2));
    pointer-events: none;

    opacity: ${(props) => props.$opacity || 1};
    animation: ${spriteAnimation} ${(props) => props.$duration || "0.6s"}
        steps(1) infinite;
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
   - Skaliert basierend auf Avatar-Größe
----------------------------------------- */
const FrameOverlay = styled.div`
    position: absolute;
    z-index: 12;

    ${(props) => {
        const sizeConfig = SIZE_CONFIG[props.$avatarSize] || SIZE_CONFIG.large;
        const inset = sizeConfig.frameInset;
        return css`
            top: ${inset}%;
            bottom: ${inset}%;
            left: ${inset}%;
            right: ${inset}%;
        `;
    }}

    background-image: url(${(props) => props.$frameUrl});
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    pointer-events: none;
`;

/* ----------------------------------------
   Öffentliche Avatar-Komponente
   Props:
   - player: object - Player-Objekt mit id, avatar, status und rewards (optional)
   - src: string - Avatar-URL (optional wenn player übergeben)
   - $status: string | string[] - Status-Effekte (optional, überschreibt geladenen Status)
   - $size: 'xs' | 'small' | 'medium' | 'large' | 'huge'
   - $cursor: 'pointer' | 'none'
   - $frameUrl: string - URL für den Rahmen (Reward-Frame)
   - showStatusEffects: boolean - Ob Status-Effekte angezeigt werden sollen (default: true)
   - showStatus: boolean - Ob Status automatisch vom Server geladen werden soll (default: false)
   - ...rest: alle anderen img-Props (alt, etc.)
   
   Priorität: Explizite Props (src, $status, $frameUrl) überschreiben player-Werte
   
   Player-Objekt kann enthalten:
   - id: number - Player ID (benötigt für showStatus)
   - avatar: string - Avatar URL
   - status: string | string[] - Status-Effekte
   - rewards: { frame: { display_value: string } } - Selected rewards
   
   Status Loading (showStatus=true):
   - Lädt Status aus BEIDEN Gamemodes (1on1 und 2on2)
   - Kombiniert und filtert nach Display-Regeln
   - z.B. hotStreak + dominator werden zusammen angezeigt
----------------------------------------- */
const Avatar = ({
    player,
    src,
    $status,
    $size = "large",
    $frameUrl,
    $cursor = "none",
    showStatusEffects = true,
    showStatus = false,
    ...props
}) => {
    // Lade Status vom Server wenn showStatus=true und player.id vorhanden
    const playerId = player?.id;
    const shouldFetchStatus = showStatus && playerId;

    // statusAssets ist ein Array von asset keys die zusammen angezeigt werden sollen
    const { statusAssets } = usePlayerStatusForAvatar(
        shouldFetchStatus ? playerId : null
    );

    // Werte aus player-Objekt extrahieren, explizite Props haben Priorität
    const avatarSrc = src ?? player?.avatar;

    // Status-Priorität: expliziter $status > geladene Status-Assets > player.status
    let status = $status;
    if (!status && shouldFetchStatus && statusAssets?.length > 0) {
        // Verwende alle geladenen Status-Assets (Array)
        status = statusAssets;
    }
    if (!status) {
        status = player?.status;
    }

    if (player?.name === "Andy") {
        console.log("status", status);
    }

    // Frame URL: explizite Prop > player.rewards.frame.display_value
    const frameUrl = $frameUrl ?? player?.rewards?.frame?.display_value;

    const statusArray = normalizeStatus(status);
    const opacity = OPACITY_BY_SIZE[$size] || 1;
    const sizeConfig = SIZE_CONFIG[$size] || SIZE_CONFIG.large;

    // Rendere Overlays für gültige Status (nur wenn showStatusEffects=true und Größe erlaubt)
    const overlays =
        showStatusEffects && sizeConfig.showEffects
            ? statusArray
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

                      // Wenn Asset vorhanden
                      if (effect.asset) {
                          // Sprite: Animiertes Sprite-Sheet (2 columns, 3 rows)
                          if (effect.type === "sprite") {
                              return (
                                  <SpriteOverlay
                                      key={statusKey}
                                      $asset={effect.asset}
                                      $zIndex={effect.zIndex}
                                      $scale={effect.scale}
                                      $avatarSize={$size}
                                      $opacity={opacity}
                                      $duration={
                                          effect.spriteDuration || "0.6s"
                                      }
                                  />
                              );
                          }

                          // GIF: Statisches Overlay mit animiertem GIF
                          return (
                              <StatusOverlay
                                  key={statusKey}
                                  $asset={effect.asset}
                                  $zIndex={effect.zIndex}
                                  $scale={effect.scale}
                                  $avatarSize={$size}
                                  $opacity={opacity}
                              />
                          );
                      }

                      // Fallback: CSS-basierter Glow-Effekt
                      if (effect.cssEffect && effect.color) {
                          return (
                              <CssGlowOverlay
                                  key={statusKey}
                                  $cssEffect={effect.cssEffect}
                                  $color={effect.color}
                                  $zIndex={effect.zIndex}
                                  $opacity={opacity}
                              />
                          );
                      }

                      return null;
                  })
                  .filter(Boolean)
            : [];

    return (
        <AvatarWrapper>
            {overlays}
            <AvatarImage
                src={avatarSrc}
                $size={$size}
                $cursor={$cursor}
                {...props}
            />
            {frameUrl && (
                <FrameOverlay $frameUrl={frameUrl} $avatarSize={$size} />
            )}
        </AvatarWrapper>
    );
};

export default Avatar;
