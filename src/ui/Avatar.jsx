import styled, { css, keyframes } from "styled-components";
import { usePlayerStatusForAvatar } from "../features/players/usePlayerStatus";
import { BountyTooltip, useBountyTooltip } from "./BountyTooltip";
import { DEFAULT_AVATAR } from "../utils/constants";

// Asset Imports - GIFs
import RedThunder from "../assets/avatar_highlights/sprites/RedThunder.png";
import ColdGif from "../assets/avatar_highlights/gifs/Cold.gif";
import IceColdGif from "../assets/avatar_highlights/gifs/IceCold.gif";
import FrozenGif from "../assets/avatar_highlights/gifs/Frozen.gif";
import HotStreakGif from "../assets/avatar_highlights/gifs/HotStreak.gif";
import OnFireGif from "../assets/avatar_highlights/gifs/OnFire.gif";
import LegendaryGif from "../assets/avatar_highlights/gifs/Legendary.gif";

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
        showEffects: true, // Bei xs keine Effekte anzeigen
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
   Default Size Config für Status Effects
   Wird verwendet wenn kein spezifischer sizeConfig vorhanden ist
   
   Jede Größe hat: scale, top, bottom, left, right, visible
----------------------------------------- */
const DEFAULT_EFFECT_SIZE_CONFIG = {
    xs: { scale: 1.0, top: 0, bottom: 0, left: 0, right: 0, visible: true },
    small: { scale: 1.0, top: 0, bottom: 0, left: 0, right: 0, visible: true },
    medium: { scale: 1.0, top: 0, bottom: 0, left: 0, right: 0, visible: true },
    large: { scale: 1.0, top: 0, bottom: 0, left: 0, right: 0, visible: true },
    huge: { scale: 1.0, top: 0, bottom: 0, left: 0, right: 0, visible: true },
};

/* ----------------------------------------
   Helper: Berechnet finale Position für einen Effekt
   Kombiniert SIZE_CONFIG mit effect-spezifischem sizeConfig
   
   @param avatarSize: 'xs' | 'small' | 'medium' | 'large' | 'huge'
   @param effect: STATUS_EFFECTS[key] Objekt
   @returns { top, bottom, left, right, visible, scale }
----------------------------------------- */
const getEffectPosition = (avatarSize, effect) => {
    const baseSizeConfig = SIZE_CONFIG[avatarSize] || SIZE_CONFIG.large;
    const effectSizeConfig =
        effect?.sizeConfig?.[avatarSize] ||
        DEFAULT_EFFECT_SIZE_CONFIG[avatarSize] ||
        DEFAULT_EFFECT_SIZE_CONFIG.large;

    // Verwende effect.scale als Fallback wenn sizeConfig.scale nicht definiert
    const scale = effectSizeConfig.scale ?? effect?.scale ?? 1;
    const baseInset = baseSizeConfig.overlayInset * scale;

    return {
        top: baseInset + (effectSizeConfig.top ?? 0),
        bottom: baseInset + (effectSizeConfig.bottom ?? 0),
        left: baseInset + (effectSizeConfig.left ?? 0),
        right: baseInset + (effectSizeConfig.right ?? 0),
        visible: effectSizeConfig.visible ?? true,
        scale,
    };
};

/* ----------------------------------------
   Status Effect Konfiguration
   
   Mapping von status_definitions.asset_key zu visuellen Effekten
   
   type: 'gif' | 'sprite' | 'css'
   asset: importiertes Asset (null = CSS-basiert oder nicht vorhanden)
   zIndex: Layering-Reihenfolge (höher = weiter vorne)
   scale: Skalierungsfaktor für das Overlay (1 = normal) - LEGACY, wird von sizeConfig überschrieben
   cssEffect: CSS-Klasse für animierte Effekte (wenn type='css')
   color: Farbe für CSS-basierte Effekte
   sizeConfig: Per-Size Konfiguration { xs, small, medium, large, huge }
               Jede Size hat: { scale, top, bottom, left, right, visible }
----------------------------------------- */
const STATUS_EFFECTS = {
    // ============== WIN STREAK STATUSES ==============
    warmingUp: {
        type: "css",
        asset: null,
        zIndex: 11,
        cssEffect: "warming",
        color: "rgba(255, 200, 100, 0.5)",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },
    hotStreak: {
        type: "gif",
        asset: HotStreakGif,
        zIndex: 11,
        cssEffect: "hot",
        color: "rgba(255, 100, 50, 0.6)",
        sizeConfig: {
            xs: {
                scale: 6,
                top: 4,
                bottom: 0,
                left: 4,
                right: 0,
                visible: true,
            },
            small: {
                scale: 4,
                top: 1,
                bottom: 0,
                left: 3,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 2.7,
                top: 1,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.3,
                top: 0,
                bottom: 0,
                left: 0,
                right: -4,
                visible: true,
            },
            huge: {
                scale: 3.4,
                top: 2,
                bottom: 0,
                left: 4,
                right: 0,
                visible: true,
            },
        },
    },
    onFire: {
        type: "gif",
        asset: OnFireGif,
        zIndex: 11,
        cssEffect: "fire",
        color: "rgba(255, 50, 0, 0.7)",
        sizeConfig: {
            xs: {
                scale: 6,
                top: 4,
                bottom: 0,
                left: 0,
                right: 5,
                visible: true,
            },
            small: {
                scale: 4.8,
                top: 0,
                bottom: 5,
                left: 0,
                right: 10,
                visible: true,
            },
            medium: {
                scale: 2.7,
                top: 0,
                bottom: 0,
                left: 0,
                right: 4,
                visible: true,
            },
            large: {
                scale: 1.3,
                top: 0,
                bottom: 0,
                left: 0,
                right: 4,
                visible: true,
            },
            huge: {
                scale: 3.4,
                top: 2,
                bottom: 0,
                left: 4,
                right: 6,
                visible: true,
            },
        },
    },
    legendary: {
        type: "gif",
        asset: LegendaryGif, // TODO: Eigenes goldenes Feuer-Asset
        zIndex: 11,
        cssEffect: "legendary",
        color: "rgba(255, 215, 0, 0.8)",
        sizeConfig: {
            xs: {
                scale: 1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            small: {
                scale: 0.8,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 0.5,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 0.3,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 0.7,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },

    // ============== LOSS STREAK STATUSES ==============
    cold: {
        type: "gif",
        asset: ColdGif,
        zIndex: 11,
        cssEffect: "cold",
        color: "rgba(100, 180, 255, 0.4)",
        sizeConfig: {
            xs: {
                scale: 0.3,
                top: 0,
                bottom: 0,
                left: 0,
                right: 3,
                visible: true,
            },
            small: {
                scale: 0.3,
                top: 0,
                bottom: 0,
                left: 0,
                right: 4,
                visible: true,
            },
            medium: {
                scale: 0.2,
                top: 0,
                bottom: 0,
                left: 0,
                right: 4,
                visible: true,
            },
            large: {
                scale: 0.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 2,
                visible: true,
            },
            huge: {
                scale: 0.3,
                top: 0,
                bottom: 0,
                left: 0,
                right: 4,
                visible: true,
            },
        },
    },
    iceCold: {
        type: "gif",
        asset: IceColdGif,
        zIndex: 11,
        cssEffect: "ice",
        color: "rgba(50, 150, 255, 0.6)",
        sizeConfig: {
            xs: {
                scale: 0.45,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            small: {
                scale: 0.5,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 0.5,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 0.25,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 0.55,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },
    frozen: {
        type: "gif",
        asset: FrozenGif,
        zIndex: 11,
        cssEffect: "frozen",
        color: "rgba(0, 100, 255, 0.7)",
        sizeConfig: {
            xs: {
                scale: 0.5,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            small: {
                scale: 0.5,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 0.5,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 0.4,
                top: 0,
                bottom: 0,
                left: 0,
                right: 3,
                visible: true,
            },
            huge: {
                scale: 0.55,
                top: 0,
                bottom: 0,
                left: 0,
                right: 3,
                visible: true,
            },
        },
    },

    // ============== EVENT STATUSES ==============
    humiliated: {
        type: "css",
        asset: null,
        zIndex: 1,
        cssEffect: "humiliated",
        color: "rgba(128, 128, 128, 0.5)",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },
    dominator: {
        type: "sprite",
        asset: RedThunder,
        zIndex: 3,
        cssEffect: "dominator",
        color: "rgba(255, 50, 50, 0.6)",
        spriteDuration: "0.5s",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: -5,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.2,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.2,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.3,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },
    comeback: {
        type: "css",
        asset: null,
        zIndex: 2,
        cssEffect: "comeback",
        color: "rgba(100, 255, 150, 0.5)",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.05,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.15,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },
    underdog: {
        type: "css",
        asset: null,
        zIndex: 2,
        cssEffect: "underdog",
        color: "rgba(255, 100, 121, 0.5)",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.05,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.05,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },
    giantSlayer: {
        type: "css",
        asset: null,
        zIndex: 3,
        cssEffect: "slayer",
        color: "rgba(200, 50, 255, 0.6)",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.15,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.15,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.2,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },

    // ============== LEGACY/OTHER STATUSES ==============
    champion: {
        type: "sprite",
        asset: null,
        zIndex: 3,
        cssEffect: "champion",
        color: "rgba(255, 215, 0, 0.6)",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.05,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.15,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },
    elite: {
        type: "sprite",
        asset: null,
        zIndex: 2,
        cssEffect: "elite",
        color: "rgba(200, 150, 255, 0.5)",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.05,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.15,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },
    grandmaster: {
        type: "sprite",
        asset: null,
        zIndex: 2,
        cssEffect: "grandmaster",
        color: "rgba(255, 100, 100, 0.6)",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.15,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.15,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.2,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },
    speedDemon: {
        type: "gif",
        asset: null,
        zIndex: 1,
        cssEffect: "speed",
        color: "rgba(255, 255, 100, 0.5)",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.05,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.15,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },
    veteran: {
        type: "sprite",
        asset: null,
        zIndex: 2,
        cssEffect: "veteran",
        color: "rgba(150, 150, 150, 0.5)",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.05,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.05,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
    },
    mvp: {
        type: "sprite",
        asset: null,
        zIndex: 3,
        cssEffect: "mvp",
        color: "rgba(255, 215, 0, 0.6)",
        sizeConfig: {
            xs: {
                scale: 1.0,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: false,
            },
            small: {
                scale: 1.05,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            medium: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            large: {
                scale: 1.1,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
            huge: {
                scale: 1.15,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                visible: true,
            },
        },
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
   - Position wird von außen über $position Prop übergeben
   - $position: { top, bottom, left, right } in %
----------------------------------------- */
const StatusOverlay = styled.div`
    position: absolute;
    z-index: ${(props) => props.$zIndex || 0};

    /* Position über $position Prop */
    top: ${(props) => props.$position?.top ?? 0}%;
    bottom: ${(props) => props.$position?.bottom ?? 0}%;
    left: ${(props) => props.$position?.left ?? 0}%;
    right: ${(props) => props.$position?.right ?? 0}%;

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
   - Position wird von außen über $position Prop übergeben
----------------------------------------- */
const SpriteOverlay = styled.div`
    position: absolute;
    z-index: ${(props) => props.$zIndex || 0};

    /* Position über $position Prop */
    top: ${(props) => props.$position?.top ?? 0}%;
    bottom: ${(props) => props.$position?.bottom ?? 0}%;
    left: ${(props) => props.$position?.left ?? 0}%;
    right: ${(props) => props.$position?.right ?? 0}%;

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
   Bounty Indicator Configuration
   Size tiers based on total bounty amount:
   1-5: small, 6-10: medium, 11-20: large, 21+: xlarge
----------------------------------------- */
const BOUNTY_SIZE_CONFIG = {
    xs: {
        small: { fontSize: "1rem", bottom: "-4px", left: "-4px" },
        medium: { fontSize: "1.2rem", bottom: "-6px", left: "-6px" },
        large: { fontSize: "1.5rem", bottom: "-8px", left: "-8px" },
        xlarge: { fontSize: "1.9rem", bottom: "-10px", left: "-10px" },
    },
    small: {
        small: { fontSize: "1.4rem", bottom: "-6px", left: "-6px" },
        medium: { fontSize: "1.6rem", bottom: "-8px", left: "-8px" },
        large: { fontSize: "1.9rem", bottom: "-10px", left: "-10px" },
        xlarge: { fontSize: "2.2rem", bottom: "-12px", left: "-12px" },
    },
    medium: {
        small: { fontSize: "1.4rem", bottom: "-4px", left: "-4px" },
        medium: { fontSize: "1.6rem", bottom: "-5px", left: "-5px" },
        large: { fontSize: "1.8rem", bottom: "-6px", left: "-6px" },
        xlarge: { fontSize: "2rem", bottom: "-7px", left: "-7px" },
    },
    large: {
        small: { fontSize: "1.8rem", bottom: "-6px", left: "-6px" },
        medium: { fontSize: "2.2rem", bottom: "-8px", left: "-8px" },
        large: { fontSize: "2.6rem", bottom: "-10px", left: "-10px" },
        xlarge: { fontSize: "3rem", bottom: "-12px", left: "-12px" },
    },
    huge: {
        small: { fontSize: "3rem", bottom: "-10px", left: "-10px" },
        medium: { fontSize: "3.6rem", bottom: "-14px", left: "-14px" },
        large: { fontSize: "4.2rem", bottom: "-18px", left: "-18px" },
        xlarge: { fontSize: "5rem", bottom: "-22px", left: "-22px" },
    },
};

const getBountyTier = (totalBounty) => {
    if (totalBounty >= 21) return "xlarge";
    if (totalBounty >= 11) return "large";
    if (totalBounty >= 6) return "medium";
    return "small";
};

/* ----------------------------------------
   Bounty Emoji Overlay
----------------------------------------- */
const BountyEmoji = styled.span`
    position: absolute;
    z-index: 13;
    cursor: pointer;
    user-select: none;
    filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3));
    transition: transform 0.2s ease;

    &:hover {
        transform: scale(1.2);
    }
`;

/* ----------------------------------------
   BountyIndicator Component
   Shows a 💰 emoji when player has active bounty
   Includes tooltip with bounty breakdown by gamemode
----------------------------------------- */
function BountyIndicator({ bountyData, avatarSize }) {
    const {
        isHovered,
        tooltipPos,
        handleMouseEnter,
        handleMouseLeave,
        triggerRef,
    } = useBountyTooltip(140);

    const bounty1on1 = bountyData?.bounty1on1 || 0;
    const bounty2on2 = bountyData?.bounty2on2 || 0;
    const totalBounty = bounty1on1 + bounty2on2;

    // Don't render if no bounty
    if (totalBounty === 0) return null;

    const sizeConfig = BOUNTY_SIZE_CONFIG[avatarSize];
    if (!sizeConfig) return null;

    const bountyTier = getBountyTier(totalBounty);
    const tierConfig = sizeConfig[bountyTier];

    return (
        <>
            <BountyEmoji
                ref={triggerRef}
                style={{
                    fontSize: tierConfig.fontSize,
                    bottom: tierConfig.bottom,
                    left: tierConfig.left,
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                💰
            </BountyEmoji>

            <BountyTooltip
                isVisible={isHovered}
                position={tooltipPos}
                bounty1on1={bounty1on1}
                bounty2on2={bounty2on2}
            />
        </>
    );
}

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
   - bountyData: { bounty1on1: number, bounty2on2: number } - Bounty data for indicator (optional)
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
   
   Bounty Indicator:
   - Shows 💰 emoji when bountyData has bounty > 0
   - Hidden on xs size avatars
   - Emoji size scales with total bounty (1-5: small, 6-10: medium, 11-20: large, 21+: xlarge)
   - Tooltip shows breakdown by gamemode (only gamemodes with bounty > 0)
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
    bountyData = null,
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
    // Fallback auf DEFAULT_AVATAR wenn src/player.avatar leer oder undefined ist
    const avatarSrc = src || player?.avatar || DEFAULT_AVATAR;

    // Status-Priorität: expliziter $status > geladene Status-Assets > player.status
    let status = $status;
    if (!status && shouldFetchStatus && statusAssets?.length > 0) {
        // Verwende alle geladenen Status-Assets (Array)
        status = statusAssets;
    }
    if (!status) {
        status = player?.status;
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

                      // Berechne Position für diesen spezifischen Effekt bei dieser Größe
                      const position = getEffectPosition($size, effect);

                      // Prüfe ob Effekt bei dieser Größe sichtbar sein soll
                      if (!position.visible) {
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
                                      $position={position}
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
                                  $position={position}
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
            {bountyData && (
                <BountyIndicator bountyData={bountyData} avatarSize={$size} />
            )}
        </AvatarWrapper>
    );
};

// Exports für StatusDisplaySettings und andere Komponenten
export {
    STATUS_EFFECTS,
    DEFAULT_EFFECT_SIZE_CONFIG,
    getEffectPosition,
    SIZE_CONFIG,
};
export default Avatar;
