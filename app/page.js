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
    times.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    m += step
    if(m>=60){ h+=Math.floor(m/60); m%=60 }
  }
  return times
}

const timeSlots = generateTimeSlots("11:00","20:30",30)

export default function Home() {
  const [date,setDate] = useState('')
  const [time,setTime] = useState('')
  const [name,setName] = useState('')
  const [phone,setPhone] = useState('')
  const [guests,setGuests] = useState('')
  const [bookedTableSlots,setBookedTableSlots] = useState({}) // {table_number: [slots]}
  const [selectedTable,setSelectedTable] = useState(null)
  const [success,setSuccess] = useState(false)

  const tablesConfig = {
    1:{min:2,max:4},2:{min:2,max:4},3:{min:4,max:8},4:{min:2,max:4},
    5:{min:2,max:4},6:{min:2,max:4},7:{min:2,max:4},8:{min:3,max:6},
    9:{min:2,max:4},10:{min:2,max:4},11:{min:2,max:4},12:{min:2,max:4}
  }

  const areas = {
    'Tầng 1': Array.from({length:8},(_,i)=>i+1),
    'Tầng 5': Array.from({length:4},(_,i)=>i+9)
  }

  useEffect(()=>{
    if(date) fetchBookings()
  },[date])

  async function fetchBookings(){
    if(!date) return
    const { data } = await supabase.from('reservations').select('*').eq('date',date)
    const booked = {}
    data?.forEach(d=>{
      const startIndex = timeSlots.indexOf(d.time)
      if(startIndex!==-1){
        const slots = []
        for(let i=startIndex;i<startIndex+3 && i<timeSlots.length;i++){
          slots.push(timeSlots[i])
        }
        booked[d.table_number] = booked[d.table_number]? [...booked[d.table_number],...slots] : slots
      }
    })
    setBookedTableSlots(booked)
  }

  async function handleBooking(){
    if(!selectedTable||!time) return
    const { error } = await supabase.from('reservations').insert([
      {name,phone,guests:Number(guests),date,time,table_number:selectedTable}
    ])
    if(!error){
      setSuccess(true)
      setTimeout(()=>setSuccess(false),3000)
      fetchBookings()
    }
  }

  return (
    <div style={{padding:20}}>
      <div className="booking-box">
        <h2>Thông tin đặt bàn</h2>
        <input
          type="text"
          placeholder="Chọn ngày"
          value={date}
          onFocus={e=>e.target.type='date'}
          onChange={e=>setDate(e.target.value)}
          onBlur={e=>{if(!date)e.target.type='text'}}
        />
        <div className="time-grid">
          {timeSlots.map(t=>{
            const isBlocked = bookedTableSlots[selectedTable]?.includes(t)
            return (
              <button
                key={t}
                onClick={()=>!isBlocked && setTime(t)}
                disabled={isBlocked}
                className={isBlocked?'time disabled':time===t?'time active':'time'}
              >
                {t}
              </button>
            )
          })}
        </div>

        <input placeholder="Tên" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="SĐT" value={phone} onChange={e=>setPhone(e.target.value)} />
        <input type="number" placeholder="Số khách" value={guests} onChange={e=>setGuests(e.target.value)} />
      </div>

      {Object.entries(areas).map(([areaName,tables])=>(
        <div key={areaName} style={{marginTop:30}}>
          <h3>{areaName}</h3>
          <div style={{display:'flex',flexWrap:'wrap'}}>
            {tables.map(t=>{
              const config = tablesConfig[t]||{min:1,max:99}
              const guestCount = Number(guests)
              const isInvalid = guests && (guestCount<config.min||guestCount>config.max)
              return (
                <button
                  key={t}
                  onClick={()=>setSelectedTable(t)}
                  disabled={isInvalid}
                  className={selectedTable===t?'table active':isInvalid?'table disabled':'table'}
                >
                  Bàn {t}
                  <div style={{fontSize:12}}>{config.min}-{config.max} khách</div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {selectedTable && <p className="selected">✅ Bạn đã chọn: Bàn {selectedTable} - {time}</p>}

      <div className="sticky-book">
        <button
          className="btn-book"
          onClick={handleBooking}
          disabled={!date||!time||!name||!phone||!guests||!selectedTable}
        >
          🍕 Xác nhận đặt bàn
        </button>
      </div>

      {success && <div className="popup">✅ Đặt bàn thành công!</div>}
    </div>
  )
}
