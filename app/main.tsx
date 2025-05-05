import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './globals.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const root = document.getElementById('root')
const queryClient = new QueryClient()

if (!root) {
  throw new Error('Failed to find the root element')
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
