import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
)

// Report Core Web Vitals to GA4
// https://web.dev/vitals/
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    const send = ({ name, value, id }) => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, {
          value: Math.round(name === 'CLS' ? value * 1000 : value),
          metric_id: id,
          metric_value: value,
          non_interaction: true,
        })
      }
    }
    onCLS(send)
    onINP(send)
    onFCP(send)
    onLCP(send)
    onTTFB(send)
  })
}
