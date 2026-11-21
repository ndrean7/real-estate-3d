# 0x ESTATE — Perumahan Modern 3D

Showcase perumahan modern 3D interaktif: 6 rumah, jalan, taman, dan kolam — dibangun
dengan Three.js. Tekstur foto asli (CC0, lokal di `textures/`), sisanya prosedural.
Tanpa CDN dan tanpa hotlink.

Buka `index.html` di Chrome (atau jalankan server lokal apa pun). Seret untuk memutar,
cubit/scroll untuk zoom, ketuk rumah atau kartu untuk melihat harga dan detail.

- 6 unit: Villa Kenanga, Rumah Asri 01, Kubus Senja, Townhouse Melati, Rumah Asri 02, Villa Anggrek
- Harga yang ditampilkan adalah **harga demo** untuk keperluan showcase — bukan penawaran resmi
- Suasana siang/senja (tombol di kanan atas), bayangan lembut, environment map, tekstur foto
- Kamera default setinggi mata di jalan (bukan isometrik dari atas); langit + awan, bukit dan
  siluet kota di kejauhan, pepohonan, pejalan kaki, mobil parkir, dan papan nama jalan

## Catatan Round 2 (realisme)

Kamera default diturunkan ke sudut pandang jalan; matahari siang direndahkan supaya
bayangan lebih panjang. Rumput/pohon dibuat lebih hidup (tekstur kulit kayu, kanopi
5 gumpal + sisi bawah gelap, bunga liar dan kerikil). Rumput tuft instanced sempat
dicoba tapi dihapus — di render headless warnanya jadi putih dan terlihat seperti
sampah di halaman. InstancedMesh di proyek ini memakai warna material tetap
(per-mesh), bukan `setColorAt`, karena `setColorAt` tidak terbaca di headless.

## Tekstur (CC0 — Poly Haven, https://polyhaven.com)

Foto tekstur di `textures/` (512px, diffuse + roughness) dilisensikan CC0 oleh
Poly Haven — bebas dipakai tanpa atribusi: `asphalt_01`, `medieval_red_brick`,
`roof_tiles`, `ceramic_roof_01`, `cobblestone_01`, `concrete_floor_01`,
`oak_veneer_01`, `wooden_floor_01`. Rumput dan plester tetap prosedural (canvas).

## Struktur

- `index.html` — hasil build (Three.js r147 inline)
- `index.template.html` — template sumber (`/*__THREE_SRC__*/` = placeholder Three.js)
- `style.css` — tampilan premium (netral hangat + aksen terakota)
- `script.js` — scene, interaksi, dan kontrol orbit
- `textures/` — tekstur foto CC0 (Poly Haven) + roughness map, 512px
- `vendor/three147.min.js` — Three.js r147 (MIT)
- `build.py` — build `index.html` dari template + vendor: `python3 build.py`

Original build for ndrean7 / 0xndrean7.
