'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tbebsblirpqblimwzesr.supabase.co',
  'sb_publishable_ZCs9awg61ilMjl2TP-ZTxg_RW9DZqbH'
)

const timeSlots = [
  "11:00","12:30","14:00","15:30","17:00","18:30","20:00"
]

export default function Home() {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [guests, setGuests] = useState('')
  const [bookedTables, setBookedTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [success, setSuccess] = useState(false)

  const areas = {
    'Tầng 1': Array.from({ length: 8 }, (_, i) => i + 1),
    'Tầng 5': Array.from({ length: 4 }, (_, i) => i + 9)
  }

  useEffect(() => {
    if (date && time) fetchBookings()
  }, [date, time])

  async function fetchBookings() {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('date', date)
      .eq('time', time)

    setBookedTables(data?.map(d => d.table_number) || [])
  }

  // 🔥 Auto chọn bàn theo số khách
  useEffect(() => {
    if (!guests) return

    const available = Object.values(areas).flat().filter(
      t => !bookedTables.includes(t)
    )

    if (available.length > 0) {
      setSelectedTable(available[0])
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
      <h1>Đặt bàn nhà hàng</h1>

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

        {/* 🔥 Chọn giờ dạng button */}
        <div className="time-grid">
          {timeSlots.map(t => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={time === t ? 'time active' : 'time'}
            >
              {t}
            </button>
          ))}
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
            {tables.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTable(t)}
                disabled={bookedTables.includes(t)}
                className={
                  bookedTables.includes(t)
                    ? 'table disabled'
                    : selectedTable === t
                    ? 'table active'
                    : 'table'
                }
              >
                Bàn {t}
              </button>
            ))}
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
