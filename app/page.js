'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(
  'https://tbebsblirpqblimwzesr.supabase.co',
  'sb_publishable_ZCs9awg61ilMjl2TP-ZTxg_RW9DZqbH'
)

// 🔹 Hàm tạo danh sách khung giờ
const TIME_SLOT_STEP = 30
function generateTimeSlots(start, end, step) {
  const times = []
  let [h, m] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  while (h < endH || (h === endH && m <= endM)) {
    times.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    m += step
    if (m >= 60) {
      h += Math.floor(m / 60)
      m = m % 60
    }
  }
  return times
}

const timeSlots = generateTimeSlots("11:00","20:30",TIME_SLOT_STEP)

export default function Home() {
  // 🔹 State form
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [guests, setGuests] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [bookedTableSlots, setBookedTableSlots] = useState({})
  const [selectedTable, setSelectedTable] = useState(null)
  const [success, setSuccess] = useState(false)

  // 🔹 Cấu hình bàn
  const tablesConfig = {
    1:{min:2,max:4},2:{min:2,max:4},3:{min:4,max:8},4:{min:2,max:4},
    5:{min:2,max:4},6:{min:2,max:4},7:{min:2,max:4},8:{min:3,max:6},
    9:{min:2,max:4},10:{min:2,max:4},11:{min:2,max:4},12:{min:2,max:4}
  }

  const areas = {
    'Tầng 1': Array.from({length:8},(_,i)=>i+1),
    'Tầng 5': Array.from({length:4},(_,i)=>i+9)
  }

  // 🔹 Fetch booking khi chọn ngày
  useEffect(()=>{
    if(date) fetchBookings()
  },[date])

  async function fetchBookings() {
    const { data } = await supabase.from('reservations').select('*').eq('date', date)
    const booked = {}
    data?.forEach(d => {
      const startIndex = timeSlots.indexOf(d.time)
      if(startIndex!==-1){
        const slots = []
        for(let i=startIndex;i<startIndex+3 && i<timeSlots.length;i++)
          slots.push(timeSlots[i])
        booked[d.table_number] = booked[d.table_number] ? [...booked[d.table_number], ...slots] : slots
      }
    })
    setBookedTableSlots(booked)
  }

  // 🔹 Auto chọn bàn khi đủ thông tin
  useEffect(()=>{
    if(!date || !time || !guests){ setSelectedTable(null); return }
    const available = Object.values(areas).flat().filter(t=>{
      const config = tablesConfig[t]||{}
      const g = Number(guests)
      const invalid = g<(config.min||1) || g>(config.max||99)
      const isBooked = bookedTableSlots[t]?.includes(time)
      return !invalid && !isBooked
    })
    if(available.length>0) setSelectedTable(available[0])
    else setSelectedTable(null)
  },[date,time,guests,bookedTableSlots])

  // 🔹 OTP email
  async function sendOtp() {
    if(!email) return alert('Nhập email để nhận OTP')
    const code = Math.floor(100000+Math.random()*900000).toString()
    localStorage.setItem('otp_code',code)
    setOtpSent(true)
    const { error } = await supabase.functions.invoke('send_otp_email',{body:{email,code}})
    if(error) alert('Gửi OTP lỗi')
    else alert('OTP đã gửi, kiểm tra email')
  }

  function verifyOtp() {
    const code = localStorage.getItem('otp_code')
    if(code===otp){ setOtpVerified(true); alert('OTP xác nhận thành công') }
    else alert('OTP không đúng')
  }

  // 🔹 Đặt bàn
  async function handleBooking() {
    if(!selectedTable||!time||!otpVerified) return alert('Xác nhận OTP và chọn bàn')
    const { data: existing } = await supabase.from('reservations')
      .select('*').eq('date',date).eq('time',time).eq('table_number',selectedTable)
    if(existing?.length>0) return alert('Bàn đã được đặt, chọn bàn khác')

    const { error } = await supabase.from('reservations').insert([
      { name,email,guests:Number(guests),date,time,table_number:selectedTable }
    ])
    if(!error){
      setSuccess(true)
      setTimeout(()=>setSuccess(false),3000)
      const startIndex=timeSlots.indexOf(time)
      const slotsToBlock=[]
      for(let i=startIndex;i<startIndex+3 && i<timeSlots.length;i++)
        slotsToBlock.push(timeSlots[i])
      setBookedTableSlots(prev=>({
        ...prev,
        [selectedTable]: prev[selectedTable] ? [...prev[selectedTable], ...slotsToBlock] : slotsToBlock
      }))
    }
  }

  // 🔹 Render
  return (
    <div style={{padding:20}}>
      <h2>Đặt bàn nhà hàng</h2>

      <input type="text" placeholder="Chọn ngày"
        value={date} onFocus={e=>e.target.type='date'}
        onChange={e=>setDate(e.target.value)}
        onBlur={e=>{if(!date)e.target.type='text'}}
      />

      <div className="time-grid">
        {timeSlots.map(t=>{
          const isBlocked = selectedTable && bookedTableSlots[selectedTable]?.includes(t)
          const disabled = !date || !guests || isBlocked
          return <button key={t} disabled={disabled}
            className={isBlocked?'time disabled':time===t?'time active':'time'}
            onClick={()=>!disabled&&setTime(t)}>{t}</button>
        })}
      </div>

      <input placeholder="Tên" onChange={e=>setName(e.target.value)} />
      <input placeholder="Email" onChange={e=>setEmail(e.target.value)} />
      {!otpVerified && <button onClick={sendOtp}>📩 Gửi OTP</button>}
      {otpSent && !otpVerified && (
        <div>
          <input placeholder="Nhập OTP" onChange={e=>setOtp(e.target.value)} />
          <button onClick={verifyOtp}>✅ Xác nhận OTP</button>
        </div>
      )}

      <input type="number" placeholder="Số khách" onChange={e=>setGuests(e.target.value)} />

      {Object.entries(areas).map(([areaName,tables])=>(
        <div key={areaName} style={{marginTop:30}}>
          <h3>{areaName}</h3>
          <div style={{display:'flex',flexWrap:'wrap'}}>
            {tables.map(t=>{
              const config=tablesConfig[t]||{min:1,max:99}
              const g = Number(guests)
              const invalid = (guests && (g<config.min || g>config.max))
              const booked = bookedTableSlots[t]?.includes(time)
              const canSelect = date && time && guests && otpVerified && !invalid && !booked
              return (
                <button key={t} disabled={!canSelect}
                  className={selectedTable===t?'table active':!canSelect?'table disabled':'table'}
                  onClick={()=>canSelect&&setSelectedTable(t)}
                >
                  Bàn {t} <div style={{fontSize:12}}>{config.min}-{config.max} khách</div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {selectedTable && time && <p>✅ Bạn đã chọn: Bàn {selectedTable} - {time}</p>}

      <button onClick={handleBooking} disabled={!date||!time||!name||!email||!guests||!selectedTable||!otpVerified}>
        🍕 Xác nhận đặt bàn
      </button>

      {success && <div>✅ Đặt bàn thành công!</div>}
    </div>
  )
}
