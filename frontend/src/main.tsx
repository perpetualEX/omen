import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Providers } from './providers'
import HomePage from './pages/Home'
import MarketPage from './pages/Market'
import AgentPage from './pages/Agent'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/market/:address" element={<MarketPage />} />
          <Route path="/agent" element={<AgentPage />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  </StrictMode>,
)
