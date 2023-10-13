import { BrowserRouter, Route, Routes } from "react-router-dom";
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

function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route index element={<Home />} />
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />
                        <Route
                            path="forgotpassword"
                            element={<ForgotPassword />}
                        />
                        <Route path="user/:userId" element={<User />} />
                        <Route path="kicker/:kickerId" element={<Kicker />} />
                        <Route path="match/:matchId" element={<Match />} />
                        <Route
                            path="tournament/:tourId"
                            element={<Tournament />}
                        />
                        <Route path="*" element={<PageNotFound />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
