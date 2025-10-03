import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import WineEntryForm from './components/WineEntryForm'
import WineCollectionListView from './components/WineCollectionListView'
import WineDetailView from './components/WineDetailView'
import DrinkingWindowMonitoringView from './components/DrinkingWindowMonitoringView'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <WineCollectionListView showSearchAndSort={true} /> },
      { path: 'add-wine', element: <WineEntryForm /> },
      { path: 'wines/:id', element: <WineDetailView /> },
      { path: 'drinking-window', element: <DrinkingWindowMonitoringView /> },
    ],
  },
])

const container = document.getElementById('root')
if (!container) throw new Error('Failed to find root element')

createRoot(container).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
