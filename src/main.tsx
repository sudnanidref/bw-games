import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'
import './games/customer-focus/match.css'

const root = createRoot(document.getElementById('root')!)

if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'customer-focus') {
	import('./games/customer-focus/Preview').then(({ CustomerFocusPreview }) => root.render(<CustomerFocusPreview />))
} else {
	root.render(<App />)
}