import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api'
import type { EventType } from '../types'

export function GuestEventTypesPage() {
  const [items, setItems] = useState<EventType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.listEventTypes()
        if (!cancelled) setItems(data)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Не удалось загрузить типы')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="muted">Загрузка…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <section>
      <h1>Виды брони</h1>
      <p className="lead">Выберите тип встречи, чтобы увидеть свободные слоты на 14 дней.</p>
      {items.length === 0 ? (
        <p className="muted">Пока нет доступных типов событий.</p>
      ) : (
        <ul className="stack">
          {items.map((item) => (
            <li key={item.id} className="row">
              <div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <p className="muted">{item.durationMinutes} мин</p>
              </div>
              <Link className="button" to={`/book/${encodeURIComponent(item.id)}`}>
                Выбрать
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
