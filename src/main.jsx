import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SiteProvider } from './context/SiteContext'
import { AuthProvider } from './context/AuthContext'
import { PartnerAuthProvider } from './context/PartnerAuth'
import { LocationProvider } from './context/LocationContext'
import { CartProvider } from './context/CartContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SiteProvider>
      <AuthProvider>
        <PartnerAuthProvider>
          <LocationProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </LocationProvider>
        </PartnerAuthProvider>
      </AuthProvider>
      </SiteProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
