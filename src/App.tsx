import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Game from './pages/Game'
import Admin from './pages/Admin'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={`/game/${generateGameId()}`} replace />} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  )
}

function generateGameId(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}

export default App