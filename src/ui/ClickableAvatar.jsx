import { useState } from "react";
import Avatar from "./Avatar";
import MediaViewer from "./MediaViewer";
import { DEFAULT_AVATAR } from "../utils/constants";

function ClickableAvatar({ player, src, alt = "Avatar", ...avatarProps }) {
    const [showViewer, setShowViewer] = useState(false);

    const avatarSrc = src || player?.avatar || DEFAULT_AVATAR;
    const isClickable = avatarSrc && avatarSrc !== DEFAULT_AVATAR;

    const handleClick = () => {
        if (isClickable) {
            setShowViewer(true);
        }
    };

    return (
        <>
            <Avatar
                player={player}
                src={src}
                $cursor={isClickable ? "pointer" : "none"}
                onClick={handleClick}
                {...avatarProps}
            />
            {showViewer && (
                <MediaViewer
                    src={avatarSrc}
                    alt={alt}
                    onClose={() => setShowViewer(false)}
                />
            )}
        </>
    );
}

export default ClickableAvatar;
