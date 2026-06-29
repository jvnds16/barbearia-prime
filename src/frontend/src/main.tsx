import React from 'react'
import ReactDOM from 'react-dom/client'
import HomePage from './pages/HomePage.tsx'
import AdminPage from './pages/AdminPage.tsx'
import './styles/index.css'

const Page = (window.location.pathname.replace(/\/$/, '') || '/') === '/admin'
  ? AdminPage
  : HomePage

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
)
