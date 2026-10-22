/* Foto alat → isi otomatis form Tambah Aset (19 Okt 2026).
   Teks label dibaca di browser dengan Tesseract.js (OCR), jadi foto tidak dikirim ke mana pun.
   Hasilnya hanya usulan: kolom yang terisi disorot dan staf wajib memeriksa sebelum simpan.
   Nomor inventaris kampus tetap diisi manual.
   shortcut: OCR hanya membaca tulisan, tidak mengenali alat dari bentuknya; ganti ke AI pengenal gambar lewat server saat SIM online. */
const OCR_JS='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
let scanFoto=null; // foto hasil pindai, disimpan sebagai foto aset saat form disimpan

// kata kunci di label → [jenis, kategori]; urutan penting: yang lebih khusus di atas
const SCAN_KAT=[
 [/G-?85[678]|GSM-?19|PPM|MAGNETOMET|PROTON/i,'Alat ukur','Magnetik'],
 [/SYSCAL|SUPERSTING|TERRAMETER|ABEM|NANIURA|RESISTIVITY|GEOLISTRIK/i,'Alat ukur','Geolistrik'],
 [/\bGPR\b|MAL[AÅ]\b|GSSI|PULSE ?EKKO|NOGGIN|GROUND PENETRATING/i,'Alat ukur','GPR'],
 [/SEISMOMET|GURALP|LENNARTZ|NANOMETRICS|SHORT PERIOD/i,'Alat ukur','Seismometer'],
 [/GEODE|SEISMOGRA|SMARTSEIS|SEISTRONIX|GEOPHONE/i,'Alat ukur','Seismik'],
 [/CG-?[56]\b|SCINTREX|LACOSTE|GRAVIMET/i,'Alat ukur','Gayaberat'],
 [/\bGPS\b|GNSS|GARMIN|TRIMBLE|TOPCON|LEICA|TOTAL STATION|KOMPAS|COMPASS/i,'Alat ukur','Survei'],
 [/LAPTOP|NOTEBOOK|THINKPAD|ZBOOK|LATITUDE|MACBOOK/i,'Komputer','Laptop'],
 [/DESKTOP|OPTIPLEX|THINKCENTRE|PRODESK|\bPC\b/i,'Komputer','PC']
];
const SCAN_MEREK=/GEOMETRICS|IRIS|AGI|ABEM|GEM SYSTEMS|MAL[AÅ]|GSSI|SENSORS ?& ?SOFTWARE|TRIMBLE|GARMIN|TOPCON|LEICA|SCINTREX|LACOSTE|GURALP|LENNARTZ|NANOMETRICS|LENOVO|DELL|HP\b|ASUS|ACER|APPLE/i;

// teks OCR → {nama, seri, jenis, kat}; kolom yang tidak ketemu dibiarkan kosong
function parseLabel(text){
 const lines=text.split(/\r?\n/).map(s=>s.replace(/\s+/g,' ').trim()).filter(s=>s.length>2);
 const sn=text.match(/(?:S\/?N|SER(?:IAL|\.)?\s*(?:NO|NUMBER|NUM)?)\.?\s*[:#.]?\s*([A-Z0-9][A-Z0-9\-\/]{2,})/i);
 const k=SCAN_KAT.find(([re])=>re.test(text));
 const i=lines.findIndex(s=>SCAN_MEREK.test(s)||(k&&k[0].test(s)));
 // baris merek saja ("GEOMETRICS") digabung dengan baris model di bawahnya
 const baris=i<0?'':lines[i].split(' ').length<=2&&lines[i+1]?lines[i]+' '+lines[i+1]:lines[i];
 const nama=baris?baris.replace(/(?:S\/?N|SERIAL).*$/i,'').replace(/[^\w\s\-\/&().]/g,'').trim().slice(0,60):'';
 return {nama,seri:sn?sn[1].toUpperCase():'',jenis:k?k[1]:'',kat:k?k[2]:''};
}

function ocrLoad(){
 if(window.Tesseract)return Promise.resolve();
 return new Promise((ok,gagal)=>{const s=document.createElement('script');s.src=OCR_JS;s.onload=ok;s.onerror=gagal;document.head.appendChild(s)});
}

function scanAlat(){
 const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.capture='environment';
 inp.onchange=async()=>{
  const f=inp.files&&inp.files[0];if(!f)return;
  const st=$('#scanSt');
  st.innerHTML='Membaca label… (pertama kali butuh internet untuk memuat pembaca teks)';
  try{
   const [besar,kecil]=await Promise.all([fotoKecil(f,1600,.9),fotoKecil(f)]);
   scanFoto=kecil;
   $('#scanPrev').innerHTML=`<img src="${kecil}" alt="Foto alat">`;
   await ocrLoad();
   const {data}=await Tesseract.recognize(besar,'eng');
   const r=parseLabel(data.text);
   const isi=[];
   const set=(id,v,lbl)=>{const e=$(id);if(v&&e&&!e.value.trim()){e.value=v;e.classList.add('scan-hit');isi.push(lbl)}};
   if(r.jenis){$('#f-jenis').value=r.jenis;$('#f-jenis').onchange();
    const s=$('#f-kat');if(![...s.options].some(o=>o.value===r.kat))s.insertAdjacentHTML('afterbegin',`<option>${esc(r.kat)}</option>`);
    s.value=r.kat;if(s.onchange)s.onchange();s.classList.add('scan-hit');isi.push('jenis & kategori')}
   set('#f-nama',r.nama,'nama');set('#f-seri',r.seri,'nomor seri');
   st.innerHTML=isi.length?`<b>Terisi otomatis:</b> ${isi.join(', ')}. Periksa kolom yang disorot, lalu lengkapi kode aset dan nomor inventaris.`
    :'Tulisan di label tidak terbaca. Foto lebih dekat ke pelat nama alat, atau isi manual. Foto tetap dipakai sebagai foto aset.';
  }catch(e){st.textContent=scanFoto?'Pembaca teks tidak bisa dimuat (cek internet). Foto tetap dipakai sebagai foto aset; isi kolom manual.':'Foto tidak bisa dibaca. Coba file lain.'}
 };
 inp.click();
}
