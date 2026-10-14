import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Matchmaking from './pages/Matchmaking';
import Game from './pages/Game';
import ResetPassword from './pages/ResetPassword';
import History from './pages/History';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import RequireAuth from './components/RequireAuth';
import ForAnna from './pages/ForAnna';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Pages réservées aux joueurs connectés */}
        <Route element={<RequireAuth />}>
          <Route path="/matchmaking" element={<Matchmaking />} />
          <Route path="/game/:roomId" element={<Game />} />
          <Route path="/history" element={<History />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pour-toi" element={<ForAnna />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
