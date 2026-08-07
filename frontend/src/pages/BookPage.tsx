import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import { formatRange, formatSlot } from '../format'
import type { AvailableSlot, Booking, EventType } from '../types'

export function BookPage() {
  const { eventTypeId = '' } = useParams()
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [types, available] = await Promise.all([
          api.listEventTypes(),
          api.listSlots(eventTypeId),
        ])
        if (cancelled) return
        const found = types.find((t) => t.id === eventTypeId) ?? null
        setEventType(found)
        setSlots(available)
        if (!found) setError('Тип события не найден')
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Не удалось загрузить слоты')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [eventTypeId])

  const grouped = useMemo(() => {
    const map = new Map<string, AvailableSlot[]>()
    for (const slot of slots) {
      const day = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(slot.startAt))
      const list = map.get(day) ?? []
      list.push(slot)
      map.set(day, list)
    }
    return [...map.entries()]
  }, [slots])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await api.createBooking({
        eventTypeId,
        startAt: selected,
        guest: {
          name,
          email,
          phone: phone || undefined,
        },
      })
      setBooking(created)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось создать бронь')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="muted">Загрузка…</p>

  if (booking) {
    return (
      <section>
        <h1>Бронирование создано</h1>
        <p>
          {eventType?.title}: {formatRange(booking.startAt, booking.endAt)}
        </p>
        <p className="muted">ID: {booking.id}</p>
        <div className="actions">
          <Link className="button" to="/">
            К каталогу
          </Link>
          <button
            type="button"
            className="button secondary"
            onClick={async () => {
              try {
                await api.cancelBooking(booking.id)
                setBooking(null)
                setSelected(null)
                const available = await api.listSlots(eventTypeId)
                setSlots(available)
              } catch (err) {
                setError(err instanceof ApiError ? err.message : 'Не удалось отменить')
              }
            }}
          >
            Отменить бронь
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </section>
    )
  }

  return (
    <section>
      <p className="muted">
        <Link to="/">← Назад</Link>
      </p>
      <h1>{eventType?.title ?? 'Запись'}</h1>
      {eventType && (
        <p className="lead">
          {eventType.description} · {eventType.durationMinutes} мин · слоты Europe/Moscow
        </p>
      )}

      {error && <p className="error">{error}</p>}

      {slots.length === 0 ? (
        <p className="muted">Свободных слотов нет.</p>
      ) : (
        <div className="slot-days">
          {grouped.map(([day, daySlots]) => (
            <div key={day} className="day-block">
              <h2>{day}</h2>
              <div className="slot-grid">
                {daySlots.map((slot) => (
                  <button
                    key={slot.startAt}
                    type="button"
                    className={selected === slot.startAt ? 'slot selected' : 'slot'}
                    onClick={() => setSelected(slot.startAt)}
                  >
                    {formatSlot(slot.startAt).split(',').pop()?.trim()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="form" onSubmit={onSubmit}>
        <h2>Контакты</h2>
        <label>
          Имя
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Телефон
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <button className="button" type="submit" disabled={!selected || submitting}>
          {submitting ? 'Сохраняю…' : 'Записаться'}
        </button>
      </form>
    </section>
  )
}
