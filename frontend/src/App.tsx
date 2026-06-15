import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import Login from './pages/Login';
import Register from './pages/Register';
import Test from './pages/Test';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* L'URL de base affiche le menu */}
        <Route path="/" element={<Home />} />
        
        {/* L'URL /game affiche ta page Game (qui contient ton Board) */}
        <Route path="/game" element={<Game />} />

        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />

        {/* petit page de test pour faire le liens avec le back */}
        <Route path='/test' element={<Test />} />
      </Routes>
    </BrowserRouter>
  );
}