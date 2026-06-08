// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* L'URL de base affiche le menu */}
        <Route path="/" element={<Home />} />
        
        {/* L'URL /game affiche ta page Game (qui contient ton Board) */}
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}