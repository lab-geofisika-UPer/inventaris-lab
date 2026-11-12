/* Penghubung ke Google Sheet + Drive lewat web app Apps Script (apps-script/Kode.gs). Pola sama dengan Timesheet Asisten.
   INV_API di config.js kosong = mode offline (data hanya di HP ini, seperti sebelumnya).
   Mode online: HP tetap menyimpan salinan di IndexedDB (bisa dipakai tanpa sinyal); perubahan dikirim ke Sheet,
   saat dibuka data terbaru ditarik dari Sheet. Dua staf mengubah aset yang sama = simpanan terakhir yang dipakai. */
const ONLINE = typeof INV_API === 'string' && /^https:\/\/script\.google\.com\//.test(INV_API);
const SYNC = (() => {
  const run = async (fn, ...args) => {
    const r = await fetch(INV_API, {method: 'POST', body: JSON.stringify({fn, args}), headers: {'Content-Type': 'text/plain;charset=utf-8'}});
    const j = await r.json(); if (!j.ok) throw new Error(j.error); return j.data;
  };
  const pesan = x => String((x && x.message) || x).replace(/^(Error|Exception):\s*/, '');
  const h = s => { let x = 5381; for (let i = 0; i < s.length; i++) x = (x * 33 ^ s.charCodeAt(i)) >>> 0; return s.length + '.' + x.toString(36); };
  // sidik = ringkasan isi aset + fotonya; dibandingkan dengan sidik saat terakhir tersimpan di Sheet (META.srv)
  const tanpaId = a => { const {fotoId, ...b} = a; return b; };
  const sidik = a => h(JSON.stringify(tanpaId(a))) + '|' + h(FOTO[a.id] || '');
  const lokal = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { return ''; } };
  let sandi = '', antre = Promise.resolve(), tunda, menunggu = false, status = 'Belum tersambung';
  const tandai = t => { status = t; const e = document.getElementById('sinkron'); if (e) e.textContent = t; };

  async function masuk() {
    sandi = lokal('inv-sandi');
    while (true) {
      if (!sandi) sandi = prompt('Sandi staf Inventaris Lab:') || '';
      if (!sandi) return false;
      try { await run('masuk', sandi); lokal('inv-sandi', sandi); return true; }
      catch (x) { lokal('inv-sandi', ''); sandi = ''; if (!/sandi staf salah/i.test(pesan(x))) throw x; alert(pesan(x)); }
    }
  }
  function kirim() {
    menunggu = false;
    return (antre = antre.then(async () => {
      if (!sandi) return;
      const srv = META.srv || {}, ada = new Set(A.map(a => a.id)), ubah = [];
      A.forEach(a => { const s = sidik(a); if (srv[a.id] === s) return;
        const fotoSama = srv[a.id] && srv[a.id].split('|')[1] === s.split('|')[1];
        ubah.push({a: tanpaId(a), foto: fotoSama ? undefined : (FOTO[a.id] || null), s}); });
      const hapus = Object.keys(srv).filter(id => !ada.has(id)), katS = h(JSON.stringify(META.kategori)), kat = META.srvKat !== katS ? META.kategori : undefined;
      if (!ubah.length && !hapus.length && !kat) return tandai('Tersimpan di Google Sheet');
      tandai('Menyimpan ke Google Sheet…');
      try {
        for (let i = 0; i < Math.max(1, ubah.length); i += 15) { // per 15 aset agar permintaan berfoto tidak terlalu besar
          const bag = ubah.slice(i, i + 15);
          const r = await run('simpan', sandi, {ubah: bag.map(u => ({a: u.a, foto: u.foto})), hapus: i ? [] : hapus, kategori: i ? undefined : kat});
          const fid = META.fotoId = META.fotoId || {};
          bag.forEach(u => { const a = A.find(x => x.id === u.a.id); if (a) a.fotoId = r.foto[a.id] || ''; if (u.foto !== undefined) fid[u.a.id] = r.foto[u.a.id] || ''; srv[u.a.id] = u.s; });
          if (!i) { hapus.forEach(id => delete srv[id]); if (kat) META.srvKat = katS; }
          META.srv = srv; await simpanMeta();
        }
        tandai('Tersimpan di Google Sheet');
      } catch (x) { menunggu = true; tandai('Belum terkirim (offline?). Dicoba lagi saat ada perubahan atau dibuka ulang.'); toast('Gagal menyimpan ke Google Sheet: ' + pesan(x)); }
    }));
  }
  async function tarik() {
    tandai('Memuat dari Google Sheet…');
    const d = await run('semua', sandi), fid = META.fotoId || {};
    A = d.aset; if (d.kategori.length) META.kategori = d.kategori;
    // foto di HP yang bukan versi Sheet dibuang (nanti diambil ulang oleh fotoLatar)
    Object.keys(FOTO).forEach(id => { const a = A.find(x => x.id === id); if (!a || !a.fotoId || fid[id] !== a.fotoId) delete FOTO[id]; });
    META.srv = Object.fromEntries(A.map(a => [a.id, sidik(a)]));
    META.srvKat = h(JSON.stringify(META.kategori));
    await tx(['aset', 'foto'], (s, f) => { s.clear(); f.clear(); A.forEach(a => s.put(a)); Object.entries(FOTO).forEach(([k, v]) => f.put(v, k)); });
    await simpanMeta(); tandai('Tersimpan di Google Sheet');
  }
  // foto yang belum ada di HP diambil di latar belakang setelah daftar tampil
  async function fotoLatar() {
    const fid = META.fotoId = META.fotoId || {}, perlu = A.filter(a => a.fotoId && (fid[a.id] !== a.fotoId || !FOTO[a.id]));
    for (let i = 0; i < perlu.length; i += 10) {
      tandai(`Mengambil foto ${i + 1}–${Math.min(i + 10, perlu.length)} dari ${perlu.length}…`);
      const bag = perlu.slice(i, i + 10), r = await run('foto', sandi, bag.map(a => a.fotoId));
      bag.forEach(a => { if (r[a.fotoId]) { FOTO[a.id] = r[a.fotoId]; fid[a.id] = a.fotoId; META.srv[a.id] = sidik(a); } });
      await tx('foto', f => bag.forEach(a => FOTO[a.id] && f.put(FOTO[a.id], a.id))); await simpanMeta(); render();
    }
    Object.keys(fid).forEach(id => { if (!A.some(a => a.id === id && a.fotoId)) delete fid[id]; });
    tandai('Tersimpan di Google Sheet');
  }
  // dipanggil sekali setelah data HP dimuat
  async function mulai() {
    try {
      if (!await masuk()) return tandai('Belum masuk. Data hanya di HP ini.');
      // pertama kali tersambung: data yang sudah ada di HP boleh dikirim ke Sheet atau diganti data Sheet
      if (!META.srv && A.length && !confirm(`HP ini punya ${A.length} aset yang belum ada di Google Sheet.\n\nOK = kirim ke Google Sheet (aset dengan kode sama di Sheet akan ditimpa).\nBatal = abaikan, pakai data dari Google Sheet saja.`)) META.srv = Object.fromEntries(A.map(a => [a.id, sidik(a)]));
      if (!META.srv) META.srv = {};
      await kirim(); await tarik(); render(); fotoLatar().catch(x => tandai('Foto belum lengkap: ' + pesan(x)));
    } catch (x) { tandai('Tidak tersambung ke Google Sheet: ' + pesan(x) + '. Memakai data di HP ini.'); }
  }
  async function muatUlang() { await kirim(); await tarik(); render(); fotoLatar().catch(() => {}); }
  function keluar() { lokal('inv-sandi', ''); sandi = ''; tandai('Keluar. Buka ulang aplikasi untuk masuk lagi.'); }
  function simpan() { menunggu = true; clearTimeout(tunda); tunda = setTimeout(kirim, 800); }
  window.addEventListener('beforeunload', ev => { if (menunggu) { kirim(); ev.preventDefault(); ev.returnValue = ''; } });
  return {mulai, simpan, muatUlang, keluar, status: () => status};
})();
