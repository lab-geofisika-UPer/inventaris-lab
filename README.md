# Inventaris Lab

Aplikasi pendata inventaris Lab Teknik Geofisika untuk HP. Dipakai selama SIM belum online.
Satu file `index.html`, tanpa server dan tanpa login. Data tersimpan di **IndexedDB browser perangkat itu saja**.

## Fitur
- Tambah, edit, dan hapus aset dengan kolom yang sama seperti Inventaris di SIM: kode, nama, jenis, kategori, no. inventaris, kondisi, mode pemakaian, lokasi 7101/7306, kalibrasi, no. seri, spesifikasi, garansi, jumlah, dan kelengkapan.
- Kolom tambahan:
  - jumlah rusak dan perlu servis untuk barang banyak,
  - aplikasi terpasang untuk komputer,
  - catatan,
  - riwayat catatan bertanggal.
- Foto alat diperkecil ke 640 px. Tombol **Foto label, isi otomatis** membaca pelat nama dengan OCR (`fotoscan.js`, salinan dari SIM).
- Kode aset disarankan otomatis mengikuti Excel stok opname:
  - Alat ukur: `GP-[metode][2 digit tahun pengadaan]-[nomor][jenis komponen]`, mis. `GP-GLS18-01A`. Metode: GLS, MAG, GPR, GRV, REF, PSF, GPS, SNV. Jenis komponen: A main unit, B kabel, C elektroda/geophone, D charger, E aksesoris, F sensor.
  - PC: kode `GP-PC-001` dengan nama `COMPGP-PC01` (nomor selalu sama).
  - Lainnya: `GP-LPT-001`, `GP-KRS-001`, `GP-MJA-001`.
- Kolom tambahan: tahun pengadaan dan jenis komponen (keduanya juga ada di SIM).
- Label QR 85 × 38 mm, 2 kolom per A4, dengan desain yang sama seperti label SIM.
- Pindai QR atau barcode dari foto (Chrome Android, lewat `BarcodeDetector`).
- Menu ⋯:
  - **Rekap ke Excel**: teks bertab UTF-16, langsung terbuka per kolom di Excel.
  - **Cadangkan / ekspor untuk SIM** (JSON).
  - **Pulihkan dari cadangan**.

## Format ekspor (untuk integrasi ke SIM)
```
{ sumber, format: 1, dibuat, kategori: [{n, j}], assets: [...], foto: {kode: dataURL} }
```
- `assets` berbentuk sama dengan `db.assets` di `prototype/inventaris.js`.
- `kategori` sama dengan `db.kategori`.
- `foto` sama dengan `FOTO` di `prototype/foto.js`.

Field tambahan yang belum dikenal SIM: `catatan`, `riwayat [{id, tgl, isi}]`, `aplikasi`, `jmlRusak`, `jmlServis`, dan `diubah`.

## Batasan
- Data hanya ada di satu perangkat. Cadangkan berkala; aplikasi memberi peringatan bila ada perubahan yang belum dicadangkan.
- Jangan dibuka dalam mode penyamaran (incognito), karena data akan hilang saat tab ditutup.
- QR berisi alamat aplikasi + `#a/KODE`. Kalau alamat aplikasi pindah (mis. ke subdomain SIM), label perlu dicetak ulang.
