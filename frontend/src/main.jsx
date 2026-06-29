import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MapEditor from './components/MapEditor.jsx'
import { GameProvider } from './context/GameContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

const isEditor = new URLSearchParams(window.location.search).get('edit') === '1';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isEditor ? (
      <MapEditor />
    ) : (
      <ToastProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </ToastProvider>
    )}
  </StrictMode>,
)
