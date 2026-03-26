'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tbebsblirpqblimwzesr.supabase.co',
  'sb_publishable_ZCs9awg61ilMjl2TP-ZTxg_RW9DZqbH'
)
function generateTimeSlots(start, end, step) {
  const times = []
  let [h, m] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)

  while (h < endH || (h === endH && m <= endM)) {
    times.push(
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    )
    m += step
    if (m >= 60) {
      h += Math.floor(m / 60)
      m = m % 60
    }
  }
  return times
}
const timeSlots = generateTimeSlots("11:00", "20:30", 30)

export default function Home() {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [guests, setGuests] = useState('')
  const [bookedTables, setBookedTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [success, setSuccess] = useState(false)

  const tablesConfig = {
  1: { min: 2, max: 4 },
  2: { min: 2, max: 4 },
  3: { min: 4, max: 8 },
  4: { min: 2, max: 4 },
  5: { min: 2, max: 4 },
  6: { min: 2, max: 4 },
  7: { min: 2, max: 4 },
  8: { min: 3, max: 6 },
  9: { min: 2, max: 4 },
  10: { min: 2, max: 4 },
  11: { min: 2, max: 4 },
  12: { min: 2, max: 4 }
}

const areas = {
  'Tầng 1': Array.from({ length: 8 }, (_, i) => i + 1),
  'Tầng 5': Array.from({ length: 4 }, (_, i) => i + 9)
}
  useEffect(() => {
    if (date && time) fetchBookings()
  }, [date, time])
function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(h)
  date.setMinutes(m + mins)

  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')

  return `${hh}:${mm}`
}
async function fetchBookings() {
  const { data } = await supabase
    .from('reservations')
    .select('*')
    .eq('date', date)

  const filtered = data?.filter(d => {
    const [h1, m1] = d.time.split(':').map(Number)
    const [h2, m2] = time.split(':').map(Number)

    const bookingStart = new Date()
    bookingStart.setHours(h1, m1, 0, 0)
    const bookingEnd = new Date(bookingStart.getTime() + 90 * 60 * 1000)

    const selectedStart = new Date()
    selectedStart.setHours(h2, m2, 0, 0)
    const selectedEnd = new Date(selectedStart.getTime() + 90 * 60 * 1000)

    return bookingStart < selectedEnd && bookingEnd > selectedStart
  }) || []

  setBookedTables(filtered.map(d => d.table_number))
}

  // 🔥 Auto chọn bàn theo số khách
useEffect(() => {
  if (!guests) return

  const available = Object.values(areas)
    .flat()
    .filter(t => {
      const config = tablesConfig[t] || {}
      return (
        !bookedTables.includes(t) &&
        guests >= (config.min || 1) &&
        guests <= (config.max || 99)
      )
    })

  if (available.length > 0) {
    setSelectedTable(available[0])
  } else {
    setSelectedTable(null)
  }
}, [guests, bookedTables])
  async function handleBooking() {
    if (!selectedTable) return

    const { error } = await supabase.from('reservations').insert([
      { name, phone, guests, date, time, table_number: selectedTable }
    ])
    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      fetchBookings()
    }
  }

  return (
    <div style={{ padding: 20 }}>
      {/* FORM */}
      <div className="booking-box">
        <h2>Thông tin đặt bàn</h2>

        <input
          type="text"
          placeholder="Chọn ngày"
          value={date}
          onFocus={(e) => e.target.type = 'date'}
          onChange={(e) => setDate(e.target.value)}
          onBlur={(e) => {
            if (!date) e.target.type = 'text'
          }}
        />
        <div className="time-grid">
  {timeSlots.map(t => {
const isDisabled = false
    return (
      <button
        key={t}
        onClick={() => setTime(t)}
        disabled={isDisabled}
        className={
          isDisabled
            ? 'time disabled'
            : time === t
            ? 'time active'
            : 'time'
        }
      >
        {t}
      </button>
    )
  })}
</div>
        <input placeholder="Tên" onChange={e => setName(e.target.value)} />
        <input placeholder="SĐT" onChange={e => setPhone(e.target.value)} />
        <input
          type="number"
          placeholder="Số khách"
          onChange={e => setGuests(e.target.value)}
        />
      </div>
      {/* CHỌN BÀN */}
      {Object.entries(areas).map(([areaName, tables]) => (
        <div key={areaName} style={{ marginTop: 30 }}>
          <h3>{areaName}</h3>

          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
{tables.map(t => {
  const config = tablesConfig[t] || { min: 1, max: 99 }

  const notEnoughGuests = guests && guests < config.min
  const tooManyGuests = guests && guests > config.max
  const isInvalid = notEnoughGuests || tooManyGuests
  return (
    <button
      key={t}
      onClick={() => setSelectedTable(t)}
      disabled={bookedTables.includes(t) || isInvalid}
      className={
        bookedTables.includes(t)
          ? 'table disabled'
          : selectedTable === t
          ? 'table active'
          : isInvalid
          ? 'table disabled'
          : 'table'
      }
    >
      Bàn {t}
      <div style={{ fontSize: 12 }}>
        {config.min} - {config.max} khách
      </div>
    </button>
  )
})}
          </div>
        </div>
      ))}
      {/* HIỂN THỊ ĐÃ CHỌN */}
      {selectedTable && (
        <p className="selected">
          ✅ Bạn đã chọn: Bàn {selectedTable}
        </p>
      )}
      {/* 🔥 NÚT STICKY */}
      <div className="sticky-book">
        <button
          className="btn-book"
          onClick={handleBooking}
          disabled={!date || !time || !name || !phone || !guests || !selectedTable}
        >
          🍕 Xác nhận đặt bàn
        </button>
      </div>
      {/* 🔥 POPUP SUCCESS */}
      {success && (
        <div className="popup">
          ✅ Đặt bàn thành công!
        </div>
      )}
    </div>
  )
}
