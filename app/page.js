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
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
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
  const [bookedTables, setBookedTables] = useState([]) // dạng ["1-11:00", "3-12:30"]
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
    if (date) fetchBookings()
  }, [date])

  function addMinutes(time, mins) {
    const [h, m] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(h)
    date.setMinutes(m + mins)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  async function fetchBookings() {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('date', date)

    const blockedTables = []

    data?.forEach(d => {
      const [h, m] = d.time.split(':').map(Number)
      const bookingStart = new Date()
      bookingStart.setHours(h, m, 0, 0)
      const bookingEnd = new Date(bookingStart.getTime() + 89 * 60 * 1000)

      timeSlots.forEach(slot => {
        const [sh, sm] = slot.split(':').map(Number)
        const slotTime = new Date()
        slotTime.setHours(sh, sm, 0, 0)
        // khóa bàn nếu slot bắt đầu trước booking kết thúc và sau hoặc bằng booking bắt đầu
        if (slotTime >= bookingStart && slotTime < bookingEnd) {
          blockedTables.push(`${d.table_number}-${slot}`)
        }
      })
    })

    setBookedTables([...new Set(blockedTables)])
  }

  // 🔥 Auto chọn bàn theo số khách
  useEffect(() => {
    if (!guests) return
    const available = Object.values(areas)
      .flat()
      .filter(t => {
        const config = tablesConfig[t] || {}
        return (
          guests >= (config.min || 1) &&
          guests <= (config.max || 99) &&
          !bookedTables.some(bt => bt.startsWith(t + '-'))
        )
      })
    setSelectedTable(available.length ? available[0] : null)
  }, [guests, bookedTables])

  async function handleBooking() {
    if (!selectedTable || !time) return

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
      <div className="booking
