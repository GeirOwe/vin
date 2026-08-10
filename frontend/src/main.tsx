import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { GuestOnly, RequireAuth } from './auth/RequireAuth'
import WineEntryForm from './components/WineEntryForm'
import WineCollectionListView from './components/WineCollectionListView'
import WineDetailView from './components/WineDetailView'
import DrinkingWindowMonitoringView from './components/DrinkingWindowMonitoringView'
import EmptyWinesView from './components/EmptyWinesView'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: 'innlogging', element: <LoginPage /> },
          { path: 'registrer', element: <RegisterPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <WineCollectionListView showSearchAndSort={true} /> },
          { path: 'legg-til', element: <WineEntryForm /> },
          { path: 'wines/:id', element: <WineDetailView /> },
          { path: 'drikkevindu', element: <DrinkingWindowMonitoringView /> },
          { path: 'tomme', element: <EmptyWinesView /> },
          // Old English paths → Norwegian
          { path: 'add-wine', element: <Navigate to="/legg-til" replace /> },
          { path: 'drinking-window', element: <Navigate to="/drikkevindu" replace /> },
          { path: 'empty', element: <Navigate to="/tomme" replace /> },
        ],
      },
    ],
  },
])

const container = document.getElementById('root')
if (!container) throw new Error('Fant ikke rot-element')

createRoot(container).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)
