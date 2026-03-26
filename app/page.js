'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tbebsblirpqblimwzesr.supabase.co',
  'sb_publishable_ZCs9awg61ilMjl2TP-ZTxg_RW9DZqbH'
)

// 🔥 Tạo các khung giờ
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
    if (date) fetchBookings()
  }, [date])

  // 🔥 Hàm addMinutes
  function addMinutes(time, mins) {
    const [h, m] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(h)
    date.setMinutes(m + mins)

    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }

  // 🔥 Lấy bàn đã đặt và khóa theo 89 phút
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
      const bookingEnd = new Date(bookingStart.getTime() + 89 * 60 * 1000) // 89 phút

      timeSlots.forEach(t => {
        const [th, tm] = t.split(':').map(Number)
        const slotTime = new Date()
        slotTime.setHours(th, tm, 0, 0)

        // chỉ khóa bàn nếu slotTime < bookingEnd
        if (slotTime >= bookingStart && slotTime < bookingEnd) {
          blockedTables.push(`${d.table_number}-${t}`)
        }
      })
    })

    setBookedTables(blockedTables)
  }

  // 🔥 Auto chọn bàn theo số khách
  useEffect(() => {
    if (!guests) return

    const available = Object.values(areas)
      .flat()
      .filter(t => {
        const config = tablesConfig[t] || {}
        return (
          !bookedTables.includes(`${t}-${time}`) &&
          guests >= (config.min || 1) &&
          guests <= (config.max || 99)
        )
      })

    if (available.length > 0) {
      setSelectedTable(available[0])
    } else {
      setSelectedTable(null)
    }
  }, [guests, bookedTables, time])

  // 🔥 Xử lý đặt bàn
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

  ret
