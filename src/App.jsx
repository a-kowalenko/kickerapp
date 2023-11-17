import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppLayout from "./ui/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import User from "./pages/User";
import Kicker from "./pages/Kicker";
import Match from "./pages/Match";
import Tournament from "./pages/Tournament";
import PageNotFound from "./pages/PageNotFound";
import Rankings from "./pages/Rankings";
import GlobalStyles from "./styles/GlobalStyles";
import CreateMatch from "./pages/CreateMatch";
import Matches from "./pages/Matches";
import Disgraces from "./pages/Disgraces";
import ProtectedRoute from "./features/authentication/ProtectedRoute";
import Testwiese from "./pages/Testwiese";
import Players from "./pages/Players";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { SoundProvider } from "./contexts/SoundContext";
import Recovery from "./pages/Recovery";
import UpdatePassword from "./pages/UpdatePassword";
import { KickerProvider } from "./contexts/KickerContext";
import Start from "./pages/Start";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 0,
        },
    },
});

function App() {
    return (
        <DarkModeProvider>
            <SoundProvider>
                <QueryClientProvider client={queryClient}>
                    <KickerProvider>
                        <ReactQueryDevtools initialIsOpen={false} />
                        <GlobalStyles />
                        <BrowserRouter>
                            <Routes>
                                <Route index element={<Start />} />
                                <Route path="login" element={<Login />} />
                                <Route path="register" element={<Register />} />
                                <Route path="recovery" element={<Recovery />} />

                                <Route
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout />
                                        </ProtectedRoute>
                                    }
                                >
                                    <Route path="home" element={<Home />} />
                                    <Route
                                        path="update-password"
                                        element={<UpdatePassword />}
                                    />
                                    <Route
                                        path="rankings"
                                        element={<Rankings />}
                                    />
                                    <Route
                                        path="disgraces"
                                        element={<Disgraces />}
                                    />
                                    <Route
                                        path="user/:userId/*"
                                        element={<User />}
                                    />
                                    <Route
                                        path="kicker/:kickerId"
                                        element={<Kicker />}
                                    />
                                    <Route
                                        path="matches"
                                        element={<Matches />}
                                    />
                                    <Route
                                        path="players"
                                        element={<Players />}
                                    />
                                    <Route
                                        path="testwiese"
                                        element={<Testwiese />}
                                    />
                                    <Route
                                        path="matches/create"
                                        element={<CreateMatch />}
                                    />
                                    <Route
                                        path="matches/:matchId"
                                        element={<Match />}
                                    />
                                    <Route
                                        path="tournament/:tourId"
                                        element={<Tournament />}
                                    />
                                </Route>
                                <Route path="*" element={<PageNotFound />} />
                            </Routes>
                        </BrowserRouter>

                        <Toaster
                            position="top-center"
                            gutter={12}
                            containerStyle={{ margin: "8px" }}
                            toastOptions={{
                                success: {
                                    duration: 3000,
                                },
                                error: {
                                    duration: 5000,
                                },
                                style: {
                                    fontSize: "16px",
                                    maxWidth: "500px",
                                    padding: "16px 24px",
                                    backgroundColor: "var(--color-grey-0)",
                                    color: "var(--color-grey-700)",
                                },
                            }}
                        />
                    </KickerProvider>
                </QueryClientProvider>
            </SoundProvider>
        </DarkModeProvider>
    );
}

export default App;
