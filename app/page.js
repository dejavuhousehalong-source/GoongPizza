'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tbebsblirpqblimwzesr.supabase.co',
  'sb_publishable_ZCs9awg61ilMjl2TP-ZTxg_RW9DZqbH'
)

function generateTimeSlots(start, end, step){
  const times=[]
  let [h,m]=start.split(':').map(Number)
  const [endH,endM]=end.split(':').map(Number)
  while(h<endH||(h===endH&&m<=endM)){
    times.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    m+=step
    if(m>=60){
      h+=Math.floor(m/60)
      m=m%60
    }
  }
  return times
}

const timeSlots = generateTimeSlots("11:00","20:30",30)

export default function Home(){
  const [date,setDate]=useState('')
  const [time,setTime]=useState('')
  const [name,setName]=useState('')
  const [phone,setPhone]=useState('')
  const [email,setEmail]=useState('')
  const [guests,setGuests]=useState('')
  const [otp,setOtp]=useState('')
  const [otpSent,setOtpSent]=useState(false)
  const [otpVerified,setOtpVerified]=useState(false)
  const [bookedTables,setBookedTables]=useState({})
  const [selectedTable,setSelectedTable]=useState(null)
  const [success,setSuccess]=useState(false)

  const tablesConfig = {
    1:{min:2,max:4},2:{min:2,max:4},3:{min:4,max:8},4:{min:2,max:4},
    5:{min:2,max:4},6:{min:2,max:4},7:{min:2,max:4},8:{min:3,max:6},
    9:{min:2,max:4},10:{min:2,max:4},11:{min:2,max:4},12:{min:2,max:4}
  }

  const areas={
    'Tầng 1':Array.from({length:8},(_,i)=>i+1),
    'Tầng 5':Array.from({length:4},(_,i)=>i+9)
  }

  useEffect(()=>{
    if(date) fetchBookings()
  },[date])

  async function fetchBookings(){
    const {data}=await supabase.from('reservations').select('*').eq('date',date)
    const blocked={}
    data?.forEach(d=>{
      const startIdx=timeSlots.indexOf(d.time)
      if(startIdx!==-1){
        const slots=[]
        for(let i=startIdx;i<startIdx+3&&i<timeSlots.length;i++)
          slots.push(timeSlots[i])
        blocked[d.table_number]=blocked[d.table_number]? [...blocked[d.table_number], ...slots]: slots
      }
    })
    setBookedTables(blocked)
  }

  // auto chọn bàn khi đủ info date/time/guests
  useEffect(()=>{
    if(!date || !time || !guests){
      setSelectedTable(null)
      return
    }
    const available = Object.values(areas).flat().filter(t=>{
      const config = tablesConfig[t] || {}
      const g = Number(guests)
      const invalid = g < (config.min || 1) || g > (config.max || 99)
      const booked = bookedTables[t]?.includes(time)
      return !invalid && !booked
    })
    if(available.length>0) setSelectedTable(available[0])
    else setSelectedTable(null)
  },[date,time,guests,bookedTables])

  async function sendOtp(){
    if(!email) return alert('Nhập email để nhận OTP')
    const code=Math.floor(100000+Math.random()*900000).toString()
    localStorage.setItem('otp_code',code)
    setOtpSent(true)
    const {error}=await supabase.functions.invoke('send_otp_email',{body:{email,code}})
    if(error) alert('Gửi OTP lỗi')
    else alert('OTP đã gửi, kiểm tra email')
  }

  function verifyOtp(){
    const code=localStorage.getItem('otp_code')
    if(code===otp){ setOtpVerified(true); alert('OTP xác nhận thành công') }
    else alert('OTP không đúng')
  }

  async function handleBooking(){
    if(!selectedTable||!time) return alert('Chọn bàn & slot giờ trước')
    if(!otpVerified) return alert('Bạn cần xác nhận OTP trước khi đặt bàn')
    const {data:exist}=await supabase.from('reservations')
      .select('*').eq('date',date).eq('time',time).eq('table_number',selectedTable)
    if(exist?.length>0) return alert('Bàn đã được đặt, chọn bàn khác')

    const {error}=await supabase.from('reservations').insert([
      {name,phone,email,guests:Number(guests),date,time,table_number:selectedTable}
    ])
    if(!error){
      setSuccess(true)
      setTimeout(()=>setSuccess(false),3000)
      const startIdx=timeSlots.indexOf(time)
      const slotsToBlock=[]
      for(let i=startIdx;i<startIdx+3&&i<timeSlots.length;i++)
        slotsToBlock.push(timeSlots[i])
      setBookedTables(prev=>({
        ...prev,
        [selectedTable]: prev[selectedTable]? [...prev[selectedTable], ...slotsToBlock]: slotsToBlock
      }))
    }
  }

  return (
    <div style={{padding:20}}>
      <div className="booking-box">
        <h2>Thông tin đặt bàn</h2>

        <input type="text" placeholder="Chọn ngày"
          value={date} onFocus={e=>e.target.type='date'}
          onChange={e=>setDate(e.target.value)}
          onBlur={e=>{if(!date)e.target.type='text'}}
        />

        <div className="time-grid">
          {timeSlots.map(t=>{
            let isBlocked=false
            if(selectedTable) isBlocked=bookedTables[selectedTable]?.includes(t)
            const disabled=!date||!guests||isBlocked
            return (
              <button key={t}
                disabled={disabled}
                className={isBlocked?'time disabled':time===t?'time active':'time'}
                onClick={()=>!disabled&&setTime(t)}
              >{t}</button>
            )
          })}
        </div>

        <input placeholder="Tên" onChange={e=>setName(e.target.value)} />
        <input placeholder="SĐT" onChange={e=>setPhone(e.target.value)} />
        <input placeholder="Email" onChange={e=>setEmail(e.target.value)} />

        {!otpVerified && <button onClick={sendOtp}>📩 Gửi OTP</button>}
        {otpSent && !otpVerified && (
          <div>
            <input placeholder="Nhập OTP" onChange={e=>setOtp(e.target.value)} />
            <button onClick={verifyOtp}>✅ Xác nhận OTP</button>
          </div>
        )}

        <input type="number" placeholder="Số khách" onChange={e=>setGuests(e.target.value)} />
      </div>

      {Object.entries(areas).map(([areaName,tables])=>(
        <div key={areaName} style={{marginTop:30}}>
          <h3>{areaName}</h3>
          <div style={{display:'flex',flexWrap:'wrap'}}>
            {tables.map(t=>{
              const config=tablesConfig[t]||{min:1,max:99}
              const g=Number(guests)
              const invalid=guests&&(g<config.min||g>config.max)
              const booked=bookedTables[t]?.includes(time)
              const canSelect=date&&time&&guests&&!invalid&&!booked
              return (
                <button key={t} disabled={!canSelect}
                  className={booked?'table disabled':selectedTable===t?'table active':!canSelect?'table disabled':'table'}
                  onClick={()=>canSelect&&setSelectedTable(t)}
                >
                  Bàn {t}
                  <div style={{fontSize:12}}>{config.min}-{config.max} khách</div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {selectedTable && time && (
        <p className="selected">✅ Bạn đã chọn: Bàn {selectedTable} - {time}</p>
      )}

      <div className="sticky-book">
        <button className="btn-book"
          onClick={handleBooking}
          disabled={!date||!time||!name||!phone||!email||!guests||!selectedTable||!otpVerified}
        >🍕 Xác nhận đặt bàn</button>
      </div>

      {success && <div className="popup">✅ Đặt bàn thành công!</div>}
    </div>
  )
}
