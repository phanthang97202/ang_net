-- Them key "extraFee" (VND, phu thu qua gio - ap dung cho ca nhan phong som
-- lan tra phong muon) vao tung dong phong trong tham so he thong
-- SHIFT_ROOM_PRICES. Muc extraFee theo loai phong:
--   Phong don thuong / don vip / doi thuong : 50.000
--   Phong 3                                  : 60.000
--   Phong 4                                  : 70.000
--   Phong gia dinh                           : 100.000
--
-- Dung UPDATE ghi de ca cot Vi/En vi noi dung tham so nay khong phan biet
-- ngon ngu (chi la mang cau hinh gia phong).
UPDATE "SysParameter"
SET
    "ParameterValueVi" = '[
  { "roomNumber": "202", "roomType": "Phòng đơn thường", "dayPrice": 550000, "nightPrice": 500000, "hourPrice": 230000, "extraFee": 50000 },
  { "roomNumber": "302", "roomType": "Phòng đơn thường", "dayPrice": 550000, "nightPrice": 500000, "hourPrice": 230000, "extraFee": 50000 },
  { "roomNumber": "303", "roomType": "Phòng đơn thường", "dayPrice": 550000, "nightPrice": 500000, "hourPrice": 230000, "extraFee": 50000 },
  { "roomNumber": "203", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "402", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "403", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "502", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "503", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "602", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "603", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "703", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "702", "roomType": "Phòng đôi thường", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "802", "roomType": "Phòng đôi thường", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "803", "roomType": "Phòng đôi thường", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "201", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "401", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "501", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "601", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "701", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "801", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "301", "roomType": "Phòng 4", "dayPrice": 900000, "nightPrice": 850000, "hourPrice": 370000, "extraFee": 70000 },
  { "roomNumber": "902", "roomType": "Phòng gia đình", "dayPrice": 1050000, "nightPrice": 950000, "hourPrice": 450000, "extraFee": 100000 }
]',
    "ParameterValueEn" = '[
  { "roomNumber": "202", "roomType": "Phòng đơn thường", "dayPrice": 550000, "nightPrice": 500000, "hourPrice": 230000, "extraFee": 50000 },
  { "roomNumber": "302", "roomType": "Phòng đơn thường", "dayPrice": 550000, "nightPrice": 500000, "hourPrice": 230000, "extraFee": 50000 },
  { "roomNumber": "303", "roomType": "Phòng đơn thường", "dayPrice": 550000, "nightPrice": 500000, "hourPrice": 230000, "extraFee": 50000 },
  { "roomNumber": "203", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "402", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "403", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "502", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "503", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "602", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "603", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "703", "roomType": "Phòng đơn vip", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "702", "roomType": "Phòng đôi thường", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "802", "roomType": "Phòng đôi thường", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "803", "roomType": "Phòng đôi thường", "dayPrice": 600000, "nightPrice": 550000, "hourPrice": 260000, "extraFee": 50000 },
  { "roomNumber": "201", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "401", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "501", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "601", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "701", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "801", "roomType": "Phòng 3", "dayPrice": 750000, "nightPrice": 700000, "hourPrice": 350000, "extraFee": 60000 },
  { "roomNumber": "301", "roomType": "Phòng 4", "dayPrice": 900000, "nightPrice": 850000, "hourPrice": 370000, "extraFee": 70000 },
  { "roomNumber": "902", "roomType": "Phòng gia đình", "dayPrice": 1050000, "nightPrice": 950000, "hourPrice": 450000, "extraFee": 100000 }
]',
    "UpdatedBy" = 'system',
    "UpdatedDTime" = now()
WHERE "ParameterCode" = 'SHIFT_ROOM_PRICES';
