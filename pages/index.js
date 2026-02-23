import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MatchCard from '../components/MatchCard';
import Link from 'next/link';

export default function Home() {
  const [tab, setTab] = useState('program');
  const [maclar, setMaclar] = useState([]);
  const [kurallar, setKurallar] = useState([]);
  const [puanDurumu, setPuanDurumu] = useState([]);
  const [yildizlar, setYildizlar] = useState(null);
  const [user, setUser] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [myMatch, setMyMatch] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerInput, setPickerInput] = useState('');
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);

  // !!! ADMİN MAİLİNİ BURAYA YAZ !!!
  const ADMIN_EMAIL = "senin-mailin@gmail.com";

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: team } = await supabase.from('basvurular').select('*').eq('kaptan_email', session.user.email).maybeSingle();
        if (team) {
          setMyTeam(team);
          fetchMyMatch(team.takim_adi);
        } else {
          // Eğer admin değilse ve takımı yoksa seçtir
          if (session.user.email !== ADMIN_EMAIL) setShowPicker(true);
        }
      }
    };
    init();
    fetchData();
  }, []);

  async function fetchData() {
    const { data: m } = await supabase.from('maclar').select('*').order('saat', { ascending: true });
    const { data: k } = await supabase.from('kurallar').select('*').order('sira', { ascending: true });
    const { data: p } = await supabase.from('basvurular').select('*').order('puan', { ascending: false });
    const { data: y } = await supabase.from('haftanin_yildizlari').select('*').eq('id', 1).maybeSingle();
    setMaclar(m || []);
    setKurallar(k || []);
    setPuanDurumu(p || []);
    setYildizlar(y || null);
  }

  async function fetchMyMatch(tName) {
    const { data } = await supabase.from('maclar').select('*').or(`takim_a.eq."${tName}",takim_b.eq."${tName}"`).order('saat', { ascending: true }).limit(1);
    if (data) setMyMatch(data[0]);
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handlePickTeam = async () => {
    const { data: teams } = await supabase.from('basvurular').select('*').ilike('takim_adi', pickerInput);
    const target = teams?.find(t => !t.kaptan_email);
    if (target) {
      await supabase.from('basvurular').update({ kaptan_email: user.email }).eq('id', target.id);
      window.location.reload();
    } else { alert("Takım bulunamadı veya bu isimde zaten bir kaptan var!"); }
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-yellow-500 pb-20 overflow-x-hidden">
      
      {/* 1. NAVİGASYON */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto relative z-50">
        <h1 className="text-3xl font-black italic text-yellow-500 tracking-tighter uppercase">Altın Pota</h1>
        <div className="flex gap-4 items-center">
          {user ? (
            <div className="flex gap-3">
              {user.email === ADMIN_EMAIL && (
                <Link href="/admin" className="text-[10px] font-black bg-yellow-500 text-black px-4 py-2 rounded-xl uppercase italic">Panel</Link>
              )}
              <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[10px] font-bold text-zinc-500 border border-zinc-800 px-4 py-2 rounded-xl uppercase hover:bg-white hover:text-black transition">Çıkış</button>
            </div>
          ) : (
            <button onClick={() => setShowLoginOverlay(true)} className="bg-white text-black px-8 py-2 rounded-full font-black text-xs uppercase italic hover:bg-yellow-500 transition shadow-xl">GİRİŞ YAP</button>
          )}
        </div>
      </nav>

      {/* 2. GİRİŞ SEÇENEKLERİ (OVERLAY) */}
      {showLoginOverlay && !user && (
        <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="max-w-4xl w-full">
              <button onClick={() => setShowLoginOverlay(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white font-black uppercase text-xs tracking-[0.3em]">KAPAT [X]</button>
              <h2 className="text-5xl md:text-7xl font-black text-center italic text-white mb-12 uppercase tracking-tighter">BÖLGENİ <span className="text-yellow-500 text-outline">SEÇ</span></h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Kaptan Seçeneği */}
                <button onClick={handleLogin} className="group bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem] text-center hover:border-yellow-500 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 text-[8rem] opacity-5 group-hover:opacity-10 transition">🏀</div>
                  <span className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-4 block italic">Katılımcı</span>
                  <p className="text-3xl font-black italic uppercase text-white group-hover:scale-105 transition">KAPTAN GİRİŞİ</p>
                  <p className="text-zinc-500 text-xs mt-4 font-bold uppercase tracking-tighter">Takımını yönet, fikstürünü takip et.</p>
                </button>
                {/* Admin Seçeneği */}
                <button onClick={handleLogin} className="group bg-white p-12 rounded-[3rem] text-center hover:bg-yellow-500 transition-all duration-500">
                  <span className="text-xs font-black text-black/40 uppercase tracking-widest mb-4 block italic">Organizasyon</span>
                  <p className="text-3xl font-black italic uppercase text-black group-hover:scale-105 transition">ADMİN PANELİ</p>
                  <p className="text-black/60 text-xs mt-4 font-bold uppercase tracking-tighter">Skorları gir, turnuvayı kontrol et.</p>
                </button>
              </div>
           </div>
        </div>
      )}

      {/* 3. HAFTANIN VİTRİNİ */}
      {yildizlar && (
        <section className="px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-4 mb-10 pt-10">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-10 rounded-[2.5rem] text-black relative group overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-black italic text-[10px] uppercase opacity-70 mb-2 tracking-widest">Haftanın Takımı</h3>
              <p className="text-5xl font-black italic uppercase leading-tight tracking-tighter">{yildizlar.takim_adi}</p>
            </div>
            <div className="absolute -right-6 -bottom-6 text-9xl opacity-20 font-black italic">WIN</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] flex items-center gap-6 group hover:border-zinc-700 transition">
            <div className="text-6xl group-hover:scale-110 transition duration-500 drop-shadow-2xl">👑</div>
            <div>
              <h3 className="font-black italic text-[10px] uppercase text-yellow-500 mb-1 tracking-widest">Haftanın MVP'si</h3>
              <p className="text-3xl font-black italic uppercase leading-none mb-1 tracking-tighter">{yildizlar.mvp_isim}</p>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{yildizlar.mvp_istatistik}</p>
            </div>
          </div>
        </section>
      )}

      {/* 4. KAPTAN DASHBOARD */}
      {myTeam && (
        <section className="px-6 max-w-6xl mx-auto mb-16 animate-in slide-in-from-bottom-10 duration-1000">
          <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-10 backdrop-blur-sm">
            <div className="text-center md:text-left">
              <p className="text-yellow-500 font-black italic text-xs mb-2 uppercase tracking-[0.3em]">Hoş Geldin Kaptan</p>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">{myTeam.takim_adi}</h2>
              <div className="flex gap-4 justify-center md:justify-start">
                 <div className="bg-black/50 px-5 py-2 rounded-xl border border-zinc-800"><p className="text-xs font-black uppercase text-zinc-500">{myTeam.puan} PUAN</p></div>
                 <div className="bg-black/50 px-5 py-2 rounded-xl border border-zinc-800"><p className="text-xs font-black uppercase text-zinc-500">{myTeam.galibiyet}G - {myTeam.maglubiyet}M</p></div>
              </div>
            </div>
            {myMatch && <div className="max-w-sm w-full"><MatchCard match={myMatch} /></div>}
          </div>
        </section>
      )}

      {/* 5. TAB MENÜ & LİSTELER */}
      <main className="max-w-6xl mx-auto px-6">
        <div className="flex justify-center gap-2 mb-12 bg-zinc-900/80 p-1.5 rounded-2xl w-fit mx-auto border border-zinc-800 backdrop-blur-xl">
          {['program', 'puan', 'kurallar'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-10 py-4 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${tab === t ? 'bg-yellow-500 text-black shadow-2xl shadow-yellow-500/20 scale-105' : 'text-zinc-500 hover:text-white'}`}>
              {t === 'program' ? 'Fikstür' : t === 'puan' ? 'Sıralama' : 'Kurallar'}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {tab === 'program' && <div className="grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-500">{maclar.map(m => <MatchCard key={m.id} match={m} />)}</div>}
          {tab === 'puan' && (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[3rem] overflow-hidden animate-in slide-in-from-left-10 duration-500">
              <table className="w-full text-left">
                <thead className="bg-zinc-900 text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                  <tr><th className="p-6">#</th><th className="p-6">Takım</th><th className="p-6 text-center">G</th><th className="p-6 text-center">M</th><th className="p-6 text-center text-yellow-500">Puan</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {puanDurumu.map((t, i) => (
                    <tr key={t.id} className="hover:bg-yellow-500/5 transition group">
                      <td className="p-6 font-black italic text-zinc-700 group-hover:text-yellow-500">{i+1}</td>
                      <td className="p-6 font-black uppercase tracking-tight text-lg">{t.takim_adi}</td>
                      <td className="p-6 text-center font-bold text-zinc-400">{t.galibiyet}</td>
                      <td className="p-6 text-center font-bold text-zinc-400">{t.maglubiyet}</td>
                      <td className="p-6 text-center font-black text-yellow-500 text-xl">{t.puan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'kurallar' && (
            <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in duration-500">
              {kurallar.map(k => (
                <details key={k.id} className="group bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
                  <summary className="p-8 cursor-pointer font-black italic uppercase text-xs flex justify-between items-center group-open:text-yellow-500 transition-all">
                    {k.baslik} <span className="transition-transform group-open:rotate-180 text-yellow-500">▼</span>
                  </summary>
                  <div className="px-8 pb-8 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/50 pt-6 italic">{k.icerik}</div>
                </details>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 6. TAKIM SEÇME MODALI */}
      {showPicker && user && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-yellow-500/20 p-12 rounded-[4rem] max-w-md w-full text-center shadow-[0_0_100px_rgba(234,179,8,0.1)]">
            <h2 className="text-4xl font-black mb-2 italic uppercase tracking-tighter">Takımını Seç</h2>
            <p className="text-zinc-500 text-[10px] mb-10 uppercase tracking-[0.3em] font-bold">Kaptan Hesabı Onaylandı</p>
            <input value={pickerInput} onChange={(e) => setPickerInput(e.target.value)} placeholder="Kayıtlı Takım Adı" className="w-full bg-black border border-zinc-800 p-6 rounded-3xl mb-6 text-center text-2xl font-black outline-none focus:border-yellow-500 uppercase transition-all placeholder:opacity-20" />
            <button onClick={handlePickTeam} className="w-full bg-yellow-500 text-black font-black py-6 rounded-3xl text-xl hover:bg-white transition uppercase italic shadow-2xl">Onaylıyorum</button>
          </div>
        </div>
      )}
    </div>
  );
}