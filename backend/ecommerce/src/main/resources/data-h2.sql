INSERT INTO roles (id, name) VALUES
  (1, 'customer'),
  (2, 'staff'),
  (3, 'admin');

INSERT INTO category (id, name) VALUES
  (1, 'Laptop'),
  (2, 'Screen'),
  (3, 'Phone'),
  (4, 'Headphone'),
  (5, 'Accessories');

INSERT INTO users (id, email, password, username, full_name, phone, address_text, avatar_url, role_id) VALUES
  (1, 'customer@technest.local', '$2y$10$3Y86CcSLram.hiId6T56H.MSrup7dzqgsQyKgzXBMerkBlnR1AG7a', 'customer@technest.local', 'TechNest Customer', '0900000001', '123 Nguyen Hue, Da Nang', NULL, 1),
  (2, 'staff@technest.local', '$2y$10$3Y86CcSLram.hiId6T56H.MSrup7dzqgsQyKgzXBMerkBlnR1AG7a', 'staff@technest.local', 'TechNest Staff', '0900000002', '456 Le Loi, Da Nang', NULL, 2),
  (3, 'admin@technest.local', '$2y$10$3Y86CcSLram.hiId6T56H.MSrup7dzqgsQyKgzXBMerkBlnR1AG7a', 'admin@technest.local', 'TechNest Admin', '0900000003', '789 Tran Phu, Da Nang', NULL, 3),
  (4, 'testuser@example.com', '$2a$10$RhGnLefP6mxOtOGWrOc0I.yD5M0rGVjsVDA60pZESAZkueXgB.G7.', 'testuser@example.com', 'Nguyen Dong', '123', '', NULL, 2),
  (5, 'dongnguyen290104@gmail.com', '$2a$10$2H61HCXx6.vFnLrrYKceSOKk.pW8NHbdIs6p8KlXfUSAE0m9gwtRm', 'dongnguyen290104@gmail.com', 'Tin', NULL, NULL, NULL, 3),
  (6, 'dongnguyen@gmail.com', '$2a$10$.zSF2PKEbKjwqrY9v.ZgZ.uVSvmDTBfNozvgYJlcKQGn5GW7ZaEPm', 'dongnguyen@gmail.com', 'Dong Nguyen', '123123', '20 hoang hoa tham', 'https://i.pinimg.com/736x/f0/21/2b/f0212bac3c7446931b1fbf2fbbe49936.jpg', 1),
  (7, 'cong@gmail.com', '$2a$10$HLcuQoJK0YBqxjSOt/NN0.LIOxIa.ahG.NZi8Luaokrz04ji5Jxu6', 'cong@gmail.com', 'Cong', '', '', NULL, 1);

INSERT INTO product (id, name, price, image_url, category_id, quantity, description_short, description_long, brand) VALUES
  (9, 'Laptop Asus TUF', 19000000.00, 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcShC7z7SE24Fwr1rw5UnJffjeKABrqVLQceAMJ_cLRYEXJpz1_egAG5axxRzmJ8unG9hUrKIKWHf-Ed9d6vlDge-h_mcGNuOlll-tfqgrxUzvzh-oOotqyBks6-GSyQFwBVQ3fC3A&usqp=CAc', 1, 19, 'CPU Ryzen 7 7840HS\nGPU RTX 4060\nRAM 16GB\nSSD 512GB\nMan hinh 15.6\" 144Hz\nPin 90Wh', 'Laptop Asus TUF so huu hieu nang manh me voi CPU Ryzen va GPU RTX 4060, phu hop game thu va nguoi lam do hoa.', 'Asus'),
  (12, 'iPhone 15 Pro Max', 34900000.00, 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTuRMZseIyw4IWY0MtHVpuZC_PGkeX_iOx6rUx1ryDy6HuUmpf9anvthV2MXmHLAiXBF7NmkPl2p0ER3qhoRblhx0ba2oSUthhqiNeFUHbQpevopxBXCm6xRQ', 3, 20, 'Chip A17 Pro\nMan hinh 6.7\"\nCamera 48MP\nUSB-C', 'Flagship Apple voi khung titan, camera cao cap va hieu nang manh cho quay chup va choi game.', 'Apple'),
  (13, 'Samsung Galaxy S24 Ultra', 28900000.00, 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTm5st6VfI9dcA9YWh34AkXHVGz2xEUcgGRpjLM0frPBrl_5bC6ZP4nL5eD3g0R7FLWDxnQb8lGiUlnY7yWFy_bsTO6abKq3bk1xgNC7ZFWR5-sMX12G9OaRA', 3, 15, 'Chip Snapdragon 8 Gen 3\nMan hinh 6.8\" AMOLED\nCamera 200MP', 'Galaxy S24 Ultra co camera 200MP, AI cho chup anh va but S-Pen tich hop.', 'Samsung'),
  (14, 'Xiaomi 14 Pro', 19900000.00, 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSx4815HRYfu8cYmronutEblGqz1RhFGRLK9deut9e5v1I8YBcbN7X5nuAhMM3n2icUXEl6-bzujMqtQcXDLP55crmGUkm2GeXOqbk6xOkJthtbnbmlM8QWtQ', 3, 30, 'Chip Snapdragon 8 Gen 3\nCamera Leica 50MP\nSac nhanh 120W', 'Flagship Xiaomi voi camera Leica va hieu nang cao cap.', 'Xiaomi'),
  (16, 'MacBook Pro 14\" M3', 40000000.00, 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTD6u24NtqraFpEJORwy_WiFjfS99zPQkA-rbgVuBOXTNYahn7G4qqMzaef0dyvjTSkQ0gHx0E9mKe5-3hyHgGx_AlpdQK7Njp7YoIdDvYXZAbsus9S6LrF', 1, 10, 'Chip Apple M3\nSSD 512GB\nMan hinh Liquid Retina XDR', 'MacBook Pro 14\" M3 phu hop lap trinh vien va dan sang tao voi pin lau va man hinh dep.', 'Apple'),
  (17, 'ASUS ROG Strix G16', 37900000.00, 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQj_s3zMjfIxtB31KEGoZEQlfWntTy5MmY4KNCxbkmC1NsKXkkZIQC0Xk-vzuAV2aIafBe4id2MoaUlGyK2KFrhJ7OucyFkcfO7z4za4vvEfU49sTeXXkbq6SHWc_l66dN4Pno5GET3bg&usqp=CAc', 1, 10, 'CPU i7-13650HX\nGPU RTX 4060\nMan hinh 16\" 165Hz', 'ROG Strix G16 la laptop gaming manh me voi thiet ke dam chat gaming.', 'Asus'),
  (18, 'Lenovo IdeaPad 5 Pro', 19900000.00, 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcR53x48cNwved73-TktP5v75Wn6haKRQBmJni2j1jAeciF1XgFU5Ic-sZx4FNB5nqIBvNATGGVeumAKlIWk6LGW1N8bGY25dStHYBW1U0ndekHVYTHn6NXYQbZ3vZlt8YS9OmKINL5khQ&usqp=CAc', 1, 25, 'CPU Ryzen 7 5800H\nRAM 16GB\nMan hinh 16\" 2.5K', 'IdeaPad 5 Pro la laptop mong nhe, phu hop sinh vien va van phong.', 'Lenovo'),
  (20, 'LG UltraGear 27\" 144Hz', 6990000.00, 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcT0zpwpaRzgfyOCDYOcYDAAnEkE7Uryi-Yv0ZAQ91c1r_jTlGtuUQVXV3svlTBS2phsuGw7AF_9ee2k1bWZwhj5vNMuWxLedz3ps8XRYJPwBabYajzTMGIU', 2, 18, '27\"\n144Hz\nIPS\n1ms', 'Man hinh gaming LG UltraGear cho trai nghiem muot ma, goc nhin rong.', 'LG'),
  (21, 'Samsung Odyssey G5 32\"', 8990000.00, 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTsGYtMFKH9y-n64SHw-ILQZQTNi2N3Z_jkvq0nvrse16dAmNAAipksKPWTCVzCXqH5qNwL7zwEPMTguve22pF3BHeBLAwUKftzrF0HLfwtmhzIu5Np0OzBW0EpoXi24IeGptD1A0jDnA&usqp=CAc', 2, 14, 'Man hinh cong 1000R\nQHD\n144Hz', 'Odyssey G5 man hinh cong cho game thu thich trai nghiem chim dam.', 'Samsung'),
  (24, 'Sony WH-1000XM5', 7990000.00, 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSB1JSOhSb5kiJidtfXs4twTk7vCt4dEyvnAVNhEtBsDtCfAGSWUL1RukgP0YHh2tSiVQFLH1S0jQsFBIFQdjISyzZWQSoc5HmqBfg6Zl9m_CVkJtP8CFYR', 4, 30, 'Chong on ANC\nHi-Res\nPin 30 gio', 'Sony WH-1000XM5 la tai nghe chong on cao cap phu hop di chuyen va lam viec.', 'Sony'),
  (25, 'AirPods Pro 2', 5290000.00, 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcT6cctNkHAaY7xBRdI4qJxE26zMJ0ZNaWAx1_jbynyVgGR40Zx6LpjXvCj9JxOSYDMjGB7RW0KF2Thfo-yNTkmtLJyad0YorQVz9jYke9eUWHXe9e3t_hF67w', 4, 28, 'Chip H2\nANC\nAdaptive Transparency', 'AirPods Pro 2 mang lai trai nghiem am thanh tot va ket noi sau voi he sinh thai Apple.', 'Apple'),
  (29, 'Logitech MX Master 3S', 2490000.00, 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTxLAgXU82Gxrvpb-D4VzisoOHjxJbe4l_ThONMmqdrJwkKwQWVwwu8648naF6R-_ArkyxKmZ77gF_s8oB4ZTfEleGJyONca8NhHVGYVJT6pkkcakvZz6Xt', 5, 20, 'Cam bien 8K DPI\nMagSpeed\nUSB-C', 'MX Master 3S la chuot van phong cao cap, cuon muot va pin lau.', 'Logitech'),
  (42, 'iPhone 17 Pro Max', 37990000.00, 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQJBnl2gcnIaPMidDJBtvwQ_Jj9YUW4iCkBoa5nuxQwPKs-QrHoqPG2bogeuh90rhH48hWCUjczH7Bf8inLkV8W2Rwr53sP4Bcr1BbwXpHYrzq1cHllCk7RlVOtbU6oKyUBCc2AjA&usqp=CAc', 3, 10, 'Chip A19 Bionic\nMan hinh 6.9\"\nCamera 48MP', 'iPhone 17 Pro Max la san pham flagship gia lap cho local catalog testing.', 'Apple');
