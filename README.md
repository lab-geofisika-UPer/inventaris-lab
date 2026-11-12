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
- Kode aset disarankan otomatis mengikuti `acuan_sistem_penamaan_inventaris_lab_geofisika.md` (v1.0, 10 Nov 2026), aturannya di `kodeaset.js` (salinan identik dengan SIM `prototype/kodeaset.js`):
  - Format `SISTEM-TAHUN-KELAS-TIPE[-SPESIFIKASI]-NOMOR`, mis. `REF-18-RCV-GEO-V14-001`, `GPS-25-MAIN-R10-001`, `LAB-25-MES-TAP-50M-001`.
  - Sistem dari kategori: Geolistrik ERT, Magnetik MAG, GPR GPR, Gravity GRV, Refraksi REF, Passive Seismic PAS, GPS GPS, Sonic Viewer RPH (proposed), lainnya LAB. GPS tetap di sistem GPS walaupun dipakai survei lain.
  - Kelas: MAIN, RCV, CBL, CON, BAT, CHG, PWR, TRG, COM, STO, MES, CAL, TOL, SAF, IT, ACC, FUR (proposed, perabot).
  - Nomor urut = identitas unit, bukan jumlah; nomor yang dihapus tidak dipakai ulang.
  - PC: kode `LAB-21-IT-PC-001` dengan nama `COMPGP-PC01` (nomor selalu sama). Laptop `LAB-yy-IT-LPT-001`, kursi `LAB-yy-FUR-KRS-001`, meja `LAB-yy-FUR-MJA-001`.
  - Data berkode lama (`GP-GLS18-01A`, `GP-PC-001`, dst.) dikonversi otomatis saat aplikasi dibuka atau cadangan lama dipulihkan. Kode lama dicatat di riwayat aset. Kode tanpa tahun menjadi `XX` dan harus dilengkapi lewat Edit.
- Kolom tambahan: tahun pengadaan (juga ada di SIM). Rekap CSV memuat kolom Sistem, Kelas, Tipe, dan Spesifikasi kode.
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
