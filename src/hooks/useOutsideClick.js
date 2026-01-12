import { useRef, useEffect } from "react";

export function useOutsideClick(handler, listenCapturing = true) {
    const ref = useRef();

    useEffect(
        function () {
            function handleClick(e) {
                // Ignore clicks on modal overlays (rendered via portal)
                if (e.target.closest("[data-modal-overlay]")) {
                    return;
                }
                if (ref.current && !ref.current.contains(e.target)) {
                    handler();
                }
            }
            document.addEventListener("click", handleClick, listenCapturing);

            return () =>
                document.removeEventListener(
                    "click",
                    handleClick,
                    listenCapturing
                );
        },
        [handler, listenCapturing]
    );

    return ref;
}
