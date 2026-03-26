'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tbebsblirpqblimwzesr.supabase.co',
  'sb_publishable_ZCs9awg61ilMjl2TP-ZTxg_RW9DZqbH'
)

export default function Home() {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [guests, setGuests] = useState('')
  const [bookedTables, setBookedTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)

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

  async function handleBooking() {
    if (!selectedTable) return alert('Chọn bàn')

    const { error } = await supabase.from('reservations').insert([
      { name, phone, guests, date, time, table_number: selectedTable }
    ])

    if (!error) {
      alert('Đặt bàn thành công!')
      fetchBookings()
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Đặt bàn nhà hàng</h1>

      {/* FORM ĐẶT BÀN */}
      <div className="booking-box">
        <h2>🍕 Thông tin đặt bàn</h2>
<input
  type="date"
  placeholder="Chọn ngày"
  onFocus={(e) => e.target.type = 'date'}
  onBlur={(e) => {
    if (!e.target.value) e.target.type = 'text'
  }}
/>
        <select onChange={e => setTime(e.target.value)}>
          <option value="">Chọn giờ</option>
          {[
            "11:00",
            "12:30",
            "14:00",
            "15:30",
            "17:00",
            "18:30",
            "20:00"
          ].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input placeholder="Tên" onChange={e => setName(e.target.value)} />
        <input placeholder="SĐT" onChange={e => setPhone(e.target.value)} />
        <input
          type="number"
          placeholder="Số khách"
          onChange={e => setGuests(e.target.value)}
        />

        <button className="btn-book" onClick={handleBooking}>
          🍕 Đặt bàn ngay
        </button>
      </div>

      {/* KHU CHỌN BÀN */}
      {Object.entries(areas).map(([areaName, tables]) => (
        <div key={areaName} style={{ marginTop: 30 }}>
          <h3>{areaName}</h3>

          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {tables.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTable(t)}
                disabled={bookedTables.includes(t)}
                style={{
                  margin: 5,
                  padding: 10,
                  background: bookedTables.includes(t)
                    ? 'gray'
                    : selectedTable === t
                    ? 'orange'
                    : 'green',
                  color: 'white'
                }}
              >
                Bàn {t}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
