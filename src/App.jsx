import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppLayout from "./ui/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
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

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 0,
        },
    },
});

function App() {
    return (
        <>
            <QueryClientProvider client={queryClient}>
                <ReactQueryDevtools initialIsOpen={false} />
                <GlobalStyles />
                <BrowserRouter>
                    <Routes>
                        <Route index element={<Login />} />
                        <Route path="register" element={<Register />} />
                        <Route
                            element={
                                <ProtectedRoute>
                                    <AppLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="home" element={<Home />} />
                            <Route path="login" element={<Login />} />
                            <Route
                                path="forgotpassword"
                                element={<ForgotPassword />}
                            />
                            <Route path="rankings" element={<Rankings />} />
                            <Route path="disgraces" element={<Disgraces />} />
                            <Route path="user/:userId/*" element={<User />} />

                            <Route
                                path="kicker/:kickerId"
                                element={<Kicker />}
                            />
                            <Route path="matches" element={<Matches />} />
                            <Route path="players" element={<Players />} />
                            <Route path="testwiese" element={<Testwiese />} />
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
                            <Route path="*" element={<PageNotFound />} />
                        </Route>
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
            </QueryClientProvider>
        </>
    );
}

export default App;
