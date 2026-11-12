/* Asset ID: SYSTEM-YY-CLASS-TYPE[-SPEC]-SERIAL
   Acuan: acuan_sistem_penamaan_inventaris_lab_geofisika.md v1.0 (10 Nov 2026), masih acuan kerja awal.
   Dipakai SIM (prototype/kodeaset.js) dan aplikasi Inventaris Lab (salinan identik; ubah keduanya).
   Kode bertanda * di bawah belum ada di kamus acuan = proposed, tunggu Master Code Dictionary. */

// kategori → SYSTEM. Instrumen lintas-metode (GPS) tetap di SYSTEM-nya sendiri.
const KODE_SYS={'Geolistrik':'ERT','Magnetik':'MAG','GPR':'GPR','Gravity':'GRV','Refraksi':'REF','Passive Seismic':'PAS','GPS':'GPS',
 'MASW':'MAS','VES':'VES','IP':'IP','Magnetotelurik':'MT','CSAMT':'CSM','UAV':'UAV',
 'Sonic Viewer':'RPH'}; // RPH* Rock Physics
const KELAS=[['MAIN','Main unit'],['RCV','Receiver / sensor'],['CBL','Kabel'],['CON','Konektor'],['BAT','Baterai'],['CHG','Charger'],
 ['PWR','Power'],['TRG','Trigger'],['COM','Komunikasi'],['STO','Penyimpanan (case/toolbox)'],['MES','Alat ukur umum'],['CAL','Kalibrasi'],
 ['TOL','Perkakas'],['SAF','Keselamatan (APD)'],['IT','Perangkat IT'],['FUR','Perabot (proposed)'],['ACC','Aksesori lain']];
// kelas + tipe bawaan per kategori. SNV*, KMP*, PC*, LPT*, KRS*, MJA* proposed.
const KAT_BAWAAN={'Sonic Viewer':['MAIN','SNV'],'Survei':['MES','KMP'],'PC':['IT','PC'],'Laptop':['IT','LPT'],'Kursi':['FUR','KRS'],'Meja':['FUR','MJA']};
// kamus TYPE acuan bab 6 (+ proposed), untuk saran isian
const TIPE_KAMUS=[['GEO','Geophone'],['ANT','Antena'],['ELE','Elektroda'],['HYD','Hydrophone'],['R10','Trimble R10'],['CG5','Scintrex CG-5'],['G857','Geometrics G-857'],
 ['TAP','Meteran'],['HLM','Helm'],['HDL','Headlamp'],['SLD','Solder'],['SCR','Obeng'],['PLI','Tang'],['WRE','Kunci'],['DMM','Multimeter digital'],['CAS','Case/toolbox'],['MEC','Trigger mekanis'],
 ['SNV','Sonic Viewer*'],['KMP','Kompas*'],['PC','PC*'],['LPT','Laptop*'],['KRS','Kursi*'],['MJA','Meja*']];
const kelasAsetTxt=k=>(KELAS.find(x=>x[0]===k)||[,k||''])[1];
const sysOf=kat=>KODE_SYS[kat]||'LAB';

// YY '??' = tahun belum diisi, 'XX' = hasil konversi kode lama tanpa tahun
const KODE_RE=/^([A-Z]{2,4})-(\d{2}|XX)-([A-Z]{2,4})-([A-Z0-9]{1,10})(?:-([A-Z0-9]{1,10}))?-(\d{3})$/;
function kodeUrai(id){const m=KODE_RE.exec(id||'');return m&&{sys:m[1],yy:m[2],kls:m[3],tipe:m[4],spec:m[5]||'',no:+m[6]}}
const kodeBersih=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');

// nomor urut = terbesar dalam kelompok + 1; nomor unit yang hilang/dihapus tidak dipakai ulang (acuan 3.1)
function kodeBuat({sys,thn,kls,tipe,spec},ids,nomor){
 const yy=/^\d{4}$/.test(thn||'')?String(thn).slice(2):thn==='XX'?'XX':'??';
 const pre=[sys,yy,kls,kodeBersih(tipe)||'??',kodeBersih(spec)].filter(Boolean).join('-')+'-';
 const n=nomor||Math.max(0,...ids.filter(i=>i.startsWith(pre)&&/^\d{3}$/.test(i.slice(pre.length))).map(i=>+i.slice(pre.length)))+1;
 return pre+String(n).padStart(3,'0');
}
// PC berpasangan: LAB-21-IT-PC-001 ↔ nama COMPGP-PC01; nomor melanjutkan yang terbesar dari keduanya (lintas tahun)
function nomorPCdari(assets){const n=assets.flatMap(a=>[(/^COMPGP-PC(\d+)$/i.exec(a.nama)||[])[1],(/^[A-Z]+-(?:\d{2}|XX)-IT-PC-(\d{3})$/.exec(a.id)||[])[1]]).filter(Boolean).map(Number);return (n.length?Math.max(...n):0)+1}

/* ---------- konversi kode lama (GP-GLS18-01A, GP-PC-001, GP-KRS-001) ---------- */
const LAMA_SYS={GLS:'ERT',PSF:'PAS',SNV:'RPH'},LAMA_KLS={A:'MAIN',B:'CBL',C:'RCV',D:'CHG',E:'ACC',F:'RCV'};
const TEBAK=[[/iris|syscal/i,'IRIS'],[/geophone/i,'GEO'],[/anten/i,'ANT'],[/elektroda|electrode/i,'ELE'],[/hydrophone/i,'HYD'],[/\bR10\b/i,'R10'],[/CG-?5/i,'CG5'],[/G-?857/i,'G857'],
 [/meteran|tape/i,'TAP'],[/helm/i,'HLM'],[/headlamp/i,'HDL'],[/solder/i,'SLD'],[/obeng/i,'SCR'],[/\btang\b/i,'PLI'],[/kunci/i,'WRE'],[/multimeter/i,'DMM'],[/\bcase\b|koper|toolbox/i,'CAS']];
// tipe dari nama; kalau tidak dikenal: 3 huruf awal nama (perlu dicek staf)
const tebakTipe=nama=>(TEBAK.find(([r])=>r.test(nama||''))||[])[1]||kodeBersih((nama||'').normalize('NFD').replace(/[^A-Za-z]/g,'')).slice(0,3)||'UNK';
// hasil: {kodeLama: kodeBaru}; aset berkode non-GP tidak disentuh
function petaKodeLama(assets){
 const peta={},ids=assets.map(a=>a.id).filter(i=>!/^GP-/.test(i));
 assets.filter(a=>/^GP-/.test(a.id)).sort((a,b)=>a.id.localeCompare(b.id)).forEach(a=>{
  const m=/^GP-([A-Z]+)(\d{2})-\d+([A-F])$/.exec(a.id),b=KAT_BAWAAN[a.kat];
  let s,nomor;
  if(m)s={sys:LAMA_SYS[m[1]]||m[1],thn:'20'+m[2],kls:LAMA_KLS[m[3]],tipe:b&&m[3]==='A'?b[1]:tebakTipe(a.nama)};
  else if(/^GP-[A-Z]+-\d+$/.test(a.id)){
   s={sys:sysOf(a.kat),thn:/^\d{4}$/.test(a.tahun||'')?a.tahun:'XX',kls:b?b[0]:a.jenis==='Alat ukur'?'MAIN':'ACC',tipe:b?b[1]:tebakTipe(a.nama)};
   if(a.kat==='PC')nomor=+a.id.split('-')[2];
  }else return;
  ids.push(peta[a.id]=kodeBuat(s,ids,nomor));
 });
 return peta;
}
// ganti kode di daftar aset + kunci foto; kode lama dicatat di riwayat. Hasil: peta {lama: baru}
function migrasiKodeAset(assets,foto){
 const peta=petaKodeLama(assets),tgl=new Date().toISOString().slice(0,10);
 assets.forEach((a,i)=>{const n=peta[a.id];if(!n)return;const yy=n.split('-')[1];
  if(foto&&foto[a.id]){foto[n]=foto[a.id];delete foto[a.id]}
  a.riwayat=(a.riwayat||[]).concat({id:'rk'+Date.now().toString(36)+i,tgl,isi:`Kode lama ${a.id} diganti ${n} mengikuti acuan penamaan aset (10 Nov 2026).`});
  if(!a.tahun&&/^\d{2}$/.test(yy))a.tahun='20'+yy;
  delete a.tipe;a.id=n});
 return peta;
}
