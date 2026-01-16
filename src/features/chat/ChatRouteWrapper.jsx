import useWindowWidth from "../../hooks/useWindowWidth";
import ChatPage from "./ChatPage";
import ChatPageMobile from "./ChatPageMobile";

function ChatRouteWrapper() {
    const { isDesktop } = useWindowWidth();
    return isDesktop ? <ChatPage /> : <ChatPageMobile />;
}

export default ChatRouteWrapper;
