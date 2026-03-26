return (
  <div style={{ padding: 20 }}>
    <h1>Đặt bàn nhà hàng</h1>

    {/* FORM ĐẶT BÀN */}
    <div className="booking-box">
      <h2>🍕 Đặt bàn ngay</h2>

      <input type="date" onChange={e => setDate(e.target.value)} />

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
