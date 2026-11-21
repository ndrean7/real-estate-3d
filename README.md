# 0x ESTATE — Perumahan Modern 3D

Showcase perumahan modern 3D interaktif: 6 rumah, jalan, taman, dan kolam — semuanya
procedural (Three.js), tanpa aset eksternal dan tanpa CDN.

Buka `index.html` di Chrome (atau jalankan server lokal apa pun). Seret untuk memutar,
cubit/scroll untuk zoom, ketuk rumah atau kartu untuk melihat harga dan detail.

- 6 unit: Villa Kenanga, Rumah Asri 01, Kubus Senja, Townhouse Melati, Rumah Asri 02, Villa Anggrek
- Harga yang ditampilkan adalah **harga demo** untuk keperluan showcase — bukan penawaran resmi
- Suasana siang/senja (tombol di kanan atas), bayangan lembut, tekstur prosedural

## Struktur

- `index.html` — hasil build (Three.js r147 inline)
- `index.template.html` — template sumber (`/*__THREE_SRC__*/` = placeholder Three.js)
- `style.css` — tampilan premium (netral hangat + aksen terakota)
- `script.js` — scene, interaksi, dan kontrol orbit
- `vendor/three147.min.js` — Three.js r147 (MIT)
- `build.py` — build `index.html` dari template + vendor: `python3 build.py`

Original build for ndrean7 / 0xndrean7.
