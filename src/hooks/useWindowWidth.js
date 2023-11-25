import { useEffect } from "react";
import { useState } from "react";
import { media } from "../utils/constants";

function useWindowWidth() {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isMobile = width <= media.maxMobile;
    const isTablet = width <= media.maxTablet && width > media.maxMobile;
    const isDesktop = width > media.maxTablet;

    return { windowWidth: width, isMobile, isTablet, isDesktop };
}

export default useWindowWidth;
