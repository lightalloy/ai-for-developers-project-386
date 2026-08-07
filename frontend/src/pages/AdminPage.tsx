import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api'
import { formatRange } from '../format'
import type { CalendarOwner, EventType, UpcomingMeeting } from '../types'

export function AdminPage() {
  const [owner, setOwner] = useState<CalendarOwner | null>(null)
  const [types, setTypes] = useState<EventType[]>([])
  const [meetings, setMeetings] = useState<UpcomingMeeting[]>([])
  const [error, setError] = useState<string | null>(null)
  const [id, setId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(30)

  async function reload() {
    const [ownerData, typeData, meetingData] = await Promise.all([
      api.getOwner(),
      api.listAdminEventTypes(),
      api.listMeetings(),
    ])
    setOwner(ownerData)
    setTypes(typeData)
    setMeetings(meetingData)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await reload()
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Не удалось загрузить админку')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.createEventType({ id, title, description, durationMinutes })
      setId('')
      setTitle('')
      setDescription('')
      setDurationMinutes(30)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось создать тип')
    }
  }

  return (
    <section>
      <h1>Админка</h1>
      {owner && (
        <p className="lead">
          Владелец: {owner.displayName} ({owner.email})
        </p>
      )}
      {error && <p className="error">{error}</p>}

      <div className="admin-grid">
        <div>
          <h2>Типы событий</h2>
          <form className="form" onSubmit={onCreate}>
            <label>
              id
              <input value={id} onChange={(e) => setId(e.target.value)} required />
            </label>
            <label>
              Название
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Описание
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </label>
            <label>
              Длительность (мин)
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
              />
            </label>
            <button className="button" type="submit">
              Создать
            </button>
          </form>

          <ul className="stack">
            {types.map((item) => (
              <li key={item.id} className="row">
                <div>
                  <strong>{item.title}</strong>
                  <p className="muted">
                    {item.id} · {item.durationMinutes} мин
                  </p>
                  <p>{item.description}</p>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={async () => {
                    setError(null)
                    try {
                      await api.deleteEventType(item.id)
                      await reload()
                    } catch (err) {
                      setError(
                        err instanceof ApiError ? err.message : 'Не удалось удалить',
                      )
                    }
                  }}
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Предстоящие встречи</h2>
          {meetings.length === 0 ? (
            <p className="muted">Нет предстоящих встреч.</p>
          ) : (
            <ul className="stack">
              {meetings.map((m) => (
                <li key={m.bookingId} className="row">
                  <div>
                    <strong>{m.eventTypeTitle}</strong>
                    <p>{formatRange(m.startAt, m.endAt)}</p>
                    <p className="muted">
                      {m.guest.name} · {m.guest.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={async () => {
                      setError(null)
                      try {
                        await api.adminCancelBooking(m.bookingId)
                        await reload()
                      } catch (err) {
                        setError(
                          err instanceof ApiError ? err.message : 'Не удалось отменить',
                        )
                      }
                    }}
                  >
                    Отменить
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="muted">
            <Link to="/">Открыть гостевую запись</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
