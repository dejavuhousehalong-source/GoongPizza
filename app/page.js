'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tbebsblirpqblimwzesr.supabase.co',
  'sb_publishable_ZCs9awg61ilMjl2TP-ZTxg_RW9DZqbH'
)

// ===== TIME SLOT =====
function generateTimeSlots(start, end, step) {
  const times = []
  let [h, m] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)

  while (h < endH || (h === endH && m <= endM)) {
    times.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    m += step
    if(m >= 60){ h += Math.floor(m/60); m %= 60 }
  }
  return times
}

const timeSlots = generateTimeSlots("11:00","20:30",30)

// ===== MAIN =====
export default function Home() {

  // ===== STATE =====
  const [date,setDate] = useState('')
  const [time,setTime] = useState('')
  const [guests,setGuests] = useState('')
  const [name,setName] = useState('')
  const [phone,setPhone] = useState('')
  const [selectedTable,setSelectedTable] = useState(null)

  const [bookedTableSlots,setBookedTableSlots] = useState({})
  const [success,setSuccess] = useState(false)

  const [otpSent,setOtpSent] = useState(false)
  const [otpVerified,setOtpVerified] = useState(false)
  const [otpCode,setOtpCode] = useState('')

  // ===== CONFIG =====
  const tablesConfig = {
    1:{min:2,max:4},2:{min:2,max:4},3:{min:4,max:8},
    4:{min:2,max:4},5:{min:2,max:4},6:{min:2,max:4},
    7:{min:2,max:4},8:{min:3,max:6},
    9:{min:2,max:4},10:{min:2,max:4},11:{min:2,max:4},12:{min:2,max:4}
  }

  const areas = {
    'Tầng 1':Array.from({length:8},(_,i)=>i+1),
    'Tầng 5':Array.from({length:4},(_,i)=>i+9)
  }

  // ===== HELPER =====
  function getSlotsToBlock(startTime){
    const index = timeSlots.indexOf(startTime)
    const arr=[]
    for(let i=index;i<index+3 && i<timeSlots.length;i++){
      arr.push(timeSlots[i])
    }
    return arr
  }

  function isPastSlot(t){
    if(!date) return false
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    if(date !== today) return false

    const [h,m] = t.split(':').map(Number)
    const slotDate = new Date()
    slotDate.setHours(h,m,0)

    return slotDate < now
  }

  // ===== FETCH BOOKING =====
  useEffect(()=>{
    if(date){
      fetchBookings()
      setTime('')
      setSelectedTable(null)
    }
  },[date])

  async function fetchBookings(){
    const {data} = await supabase
      .from('reservations')
      .select('*')
      .eq('date',date)

    const booked={}

    data?.forEach(d=>{
      const slots = getSlotsToBlock(d.time)
      booked[d.table_number] = booked[d.table_number]
        ? [...new Set([...booked[d.table_number],...slots])]
        : slots
    })

    setBookedTableSlots(booked)
  }

  // ===== AVAILABLE TABLES =====
  function getAvailableTables(){
    if(!date || !time || !guests) return []

    const guestCount = Number(guests)

    return Object.values(areas).flat().filter(t=>{
      const config = tablesConfig[t]
      const invalid = guestCount < config.min || guestCount > config.max
      const booked = bookedTableSlots[t]?.includes(time)
      return !invalid && !booked
    })
  }

  const availableTables = getAvailableTables()

  // ===== OTP =====
  async function sendOtp(){
    if(!phone) return alert('Nhập SĐT')

    const res = await fetch('https://tbebsblirpqblimwzesr.supabase.co/functions/v1/send-otp',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ phone })
    })

    if(res.ok){
      setOtpSent(true)
      setOtpVerified(false)
    }
  }

  async function verifyOtp(){
    const res = await fetch('https://tbebsblirpqblimwzesr.supabase.co/functions/v1/verify-otp',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ identifier: phone, otp: otpCode })
    })

    const data = await res.json()

    if(data.verified){
      setOtpVerified(true)
      alert('OTP đúng')
    }else{
      alert('OTP sai')
    }
  }

  // ===== BOOKING =====
  async function handleBooking(){

    if(!selectedTable || !otpVerified) return

    // check lại backend chống double booking
    const {data:check} = await supabase
      .from('reservations')
      .select('*')
      .eq('date',date)
      .eq('time',time)
      .eq('table_number',selectedTable)

    if(check.length > 0){
      alert('Bàn vừa bị đặt, vui lòng chọn lại')
      fetchBookings()
      return
    }

    const {error} = await supabase.from('reservations').insert([
      {name,phone,guests:Number(guests),date,time,table_number:selectedTable}
    ])

    if(!error){
      setSuccess(true)
      setTimeout(()=>setSuccess(false),3000)

      const slots = getSlotsToBlock(time)

      setBookedTableSlots(prev=>({
        ...prev,
        [selectedTable]: prev[selectedTable]
          ? [...new Set([...prev[selectedTable],...slots])]
          : slots
      }))
    }
  }

  // ===== UI =====
  return (
    <div style={{padding:20}}>

      <div className="booking-box">
        <h2>Thông tin đặt bàn</h2>

        {/* DATE */}
        <input
          type="date"
          value={date}
          onChange={e=>setDate(e.target.value)}
        />

        {/* GUEST */}
        <input
          type="number"
          placeholder="Số khách"
          value={guests}
          onChange={e=>setGuests(e.target.value)}
        />

        {/* TIME */}
        <div className="time-grid">
          {timeSlots.map(t=>{
            const disabled = !date || !guests || isPastSlot(t)
            return (
              <button
                key={t}
                disabled={disabled}
                onClick={()=>setTime(t)}
                className={
                  isPastSlot(t) ? 'time disabled'
                  : time===t ? 'time active'
                  : 'time'
                }
              >
                {t}
              </button>
            )
          })}
        </div>

        {/* INFO */}
        <input placeholder="Tên" onChange={e=>setName(e.target.value)} />
        <input placeholder="SĐT" onChange={e=>setPhone(e.target.value)} />

        {/* OTP */}
        {!otpSent && <button onClick={sendOtp}>Gửi OTP</button>}

        {otpSent && !otpVerified && (
          <div>
            <input value={otpCode} onChange={e=>setOtpCode(e.target.value)} />
            <button onClick={verifyOtp}>Xác nhận OTP</button>
          </div>
        )}
      </div>

      {/* TABLE */}
      {time && guests && (
        <>
          {availableTables.length===0 && <p>❌ Hết bàn</p>}

          {Object.entries(areas).map(([nameArea,tables])=>(
            <div key={nameArea}>
              <h3>{nameArea}</h3>
              <div style={{display:'flex',flexWrap:'wrap'}}>
                {tables.map(t=>{
                  const config = tablesConfig[t]
                  const guestCount = Number(guests)

                  const invalid = guestCount < config.min || guestCount > config.max
                  const booked = bookedTableSlots[t]?.includes(time)

                  const disabled = !time || invalid || booked

                  return (
                    <button
                      key={t}
                      disabled={disabled}
                      onClick={()=>setSelectedTable(t)}
                      className={
                        selectedTable===t ? 'table active'
                        : disabled ? 'table disabled'
                        : 'table'
                      }
                    >
                      Bàn {t}
                      <div>{config.min}-{config.max}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* SELECTED */}
      {selectedTable && (
        <p>✅ Bàn {selectedTable} - {time}</p>
      )}

      {/* BUTTON */}
      <div className="sticky-book">
        <button
          onClick={handleBooking}
          disabled={
            !date || !time || !guests || !name || !phone || !selectedTable || !otpVerified
          }
        >
          Xác nhận đặt bàn
        </button>
      </div>

      {/* SUCCESS */}
      {success && <div className="popup">Đặt bàn thành công</div>}

    </div>
  )
}
