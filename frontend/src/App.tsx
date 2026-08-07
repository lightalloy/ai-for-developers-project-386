import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminPage } from './pages/AdminPage'
import { BookPage } from './pages/BookPage'
import { GuestEventTypesPage } from './pages/GuestEventTypesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<GuestEventTypesPage />} />
          <Route path="book/:eventTypeId" element={<BookPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
