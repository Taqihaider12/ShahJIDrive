import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/authContext'
import { Home } from './pages/Home'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { Admin } from './pages/Admin'
import { Coupon } from './pages/Coupon'
import { ApiKeys } from './pages/ApiKeys'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/coupon" element={<Coupon />} />
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="*" element={
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
              <h1 className="text-4xl font-extrabold mb-4">404</h1>
              <p className="text-muted-foreground mb-8">Page Not Found</p>
              <a href="/" className="px-6 py-2.5 bg-primary text-black font-bold rounded-xl">Back to Home</a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
