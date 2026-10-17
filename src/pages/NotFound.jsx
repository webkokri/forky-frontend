import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <div className="text-6xl font-extrabold text-brand-500">404</div>
      <p className="mt-2 text-ink-500">This page wandered off.</p>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  )
}
