import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import Login from './pages/Login';
import Register from './pages/Register';
import Test from './pages/Test';
import Matchmaking from './pages/Matchmaking';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route path="/game/:roomId" element={<Game />} />

        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/matchmaking' element={<Matchmaking />} />
        <Route path='/test' element={<Test />} />
      </Routes>
    </BrowserRouter>
  );
}