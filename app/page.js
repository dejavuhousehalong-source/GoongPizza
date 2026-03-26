'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tbebsblirpqblimwzesr.supabase.co',
  'sb_publishable_ZCs9awg61ilMjl2TP-ZTxg_RW9DZqbH'
)

// Hàm tạo các slot thời gian
function generateTimeSlots(start, end, step) {
  const times = []
  let [h, m] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)

  while (h < endH || (h === endH && m <= endM)) {
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += step
    if (m >= 60) {
      h += Math.floor(m / 60)
      m %= 60
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
  const [blockedTableSlots, setBlockedTableSlots] = useState([]) // chứa table-slot riêng
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

  // Fetch bookings khi chọn ngày
  useEffect(() => {
    if (date) fetchBookings()
  }, [date])

  async function fetchBookings() {
    if (!date) return
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('date', date)

    const blocked = []

    data?.forEach(d => {
      const startIndex = timeSlots.indexOf(d.time)
      if (startIndex !== -1) {
        // khóa khung giờ của bàn đó và 2 slot tiếp theo (tổng 3 slot)
        for (let i = startIndex; i < startIndex + 3 && i < timeSlots.length; i++) {
          blocked.push(`${d.table_number}-${timeSlots[i]}`)
        }
      }
    })

    setBlockedTableSlots([...new Set(blocked)])
  }

  // Auto chọn bàn theo số khách và slot đang chọn
  useEffect(() => {
    if (!guests || !time) return
    const guestCount = Number(guests)

    const available = Object.values(areas)
      .flat()
      .filter(t => {
        const config = tablesConfig[t] || {}
        const isBlocked = blockedTableSlots.includes(`${t}-${time}`)
        return !isBlocked && guestCount >= (config.min || 1) && guestCount <= (config.max || 99)
      })

    setSelectedTable(available.length > 0 ? available[0] : null)
  }, [guests, blockedTableSlots, time])

  async function handleBooking() {
    if (!selectedTable || !time) return

    const { error } = await supabase.from('reservations').insert([
      { name, phone, guests: Number(guests), date, time, table_number: selectedTable }
    ])

    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      fetchBookings()
    }
  }

  // Check xem slot thời gian của bàn có bị khóa không
  const isTableSlotBlocked = (table, slot) => blockedTableSlots.includes(`${table}-${slot}`)

  return (
    <div style={{ padding: 20 }}>
      <div className="booking-box">
        <h2>Thông tin đặt bàn</h2>

        <input
          type="text"
          placeholder="Chọn ngày"
          value={date}
          onFocus={e => e.target.type = 'date'}
          onChange={e => setDate(e.target.value)}
          onBlur={e => { if (!date) e.target.type = 'text' }}
        />

        <div className="time-grid">
          {timeSlots.map(t => {
            // slot disable nếu tất cả bàn đều đã block slot đó
            const allBlocked = Object.values(areas)
              .flat()
              .every(table => blockedTableSlots.includes(`${table}-${t}`))
            return (
              <button
                key={t}
                onClick={() => !allBlocked && setTime(t)}
                disabled={allBlocked}
                className={allBlocked ? 'time disabled' : time === t ? 'time active' : 'time'}
              >
                {t}
              </button>
            )
          })}
        </div>

        <input placeholder="Tên" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="SĐT" value={phone} onChange={e => setPhone(e.target.value)} />
        <input
          type="number"
          placeholder="Số khách"
          value={guests}
          onChange={e => setGuests(e.target.value)}
        />
      </div>

      {/* Chọn bàn */}
      {Object.entries(areas).map(([areaName, tables]) => (
        <div key={areaName} style={{ marginTop: 30 }}>
          <h3>{areaName}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {tables.map(t => {
              const config = tablesConfig[t] || { min: 1, max: 99 }
              const guestCount = Number(guests)
              const notEnough = guests && guestCount < config.min
              const tooMany = guests && guestCount > config.max
              const isInvalid = notEnough || tooMany
              const isBlocked = time ? isTableSlotBlocked(t, time) : false
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTable(t)}
                  disabled={isInvalid || isBlocked}
                  className={isBlocked ? 'table disabled' : selectedTable === t ? 'table active' : isInvalid ? 'table disabled' : 'table'}
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

      {selectedTable && <p className="selected">✅ Bạn đã chọn: Bàn {selectedTable}</p>}

      <div className="sticky-book">
        <button
          className="btn-book"
          onClick={handleBooking}
          disabled={!date || !time || !name || !phone || !guests || !selectedTable}
        >
          🍕 Xác nhận đặt bàn
        </button>
      </div>

      {success && <div className="popup">✅ Đặt bàn thành công!</div>}
    </div>
  )
}
