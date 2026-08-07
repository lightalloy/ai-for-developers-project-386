import { Link, NavLink, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          Calendar
        </Link>
        <nav>
          <NavLink to="/" end>
            Запись
          </NavLink>
          <NavLink to="/admin">Админка</NavLink>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
