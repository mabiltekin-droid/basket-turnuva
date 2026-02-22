import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MatchCard from '../components/MatchCard';
import Link from 'next/link';

export default function Home() {
  const [tab, setTab] = useState('program');
  const [maclar, setMaclar] = useState([]);
  const [kurallar, setKurallar] = useState([]);
  const [basvurular, setBasvurular] = useState([]);
  const [yildizlar, setYildizlar] = useState(null);
  const [user, setUser] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [myMatch, setMyMatch] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerInput, setPickerInput] = useState('');
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: team } = await supabase.from('basvurular').select('*').eq('kaptan_email', session.user.email).maybeSingle();
        if (team) { setMyTeam(team); fetchMyMatch(team.takim_adi); } 
        else { setShowPicker(true); }
      }
    };
    init();
    fetchMaclar();
    fetchKurallar();
    fetchStandings();
    fetchYildizlar();

    const target = new Date("2026-06-15T10:00:00");
    const timer = setInterval(() => {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) { setTimeLeft("CANLI"); clearInterval(timer); }
      else {
        const gun = Math.floor(diff / (1000 * 60 * 60 * 24));
        const saat = Math.floor((diff / (1000 * 60 * 60)) % 24);
        setTimeLeft(`${gun}G ${saat}S KALDI`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchMaclar() { const { data } = await supabase.from('maclar').select('*').order('saat', { ascending: true }); setMaclar(data || []); }
  async function fetchKurallar() { const { data } = await supabase.from('kurallar').select('*').order('sira', { ascending: true }); setKurallar(data || []); }
  async function fetchStandings() { const { data } = await supabase.from('basvurular').select('*').order('puan', { ascending: false }); setBasvurular(data || []); }
  async function fetchYildizlar() { const { data } = await supabase.from('haftanin_yildizlari').select('*').eq('id', 1).maybeSingle(); setYildizlar(data); }
  async function fetchMyMatch(tAdi) {
    const { data } = await supabase.from('maclar').select('*').or(`takim_a.eq."${tAdi}",takim_b.eq."${tAdi}"`).order('saat', { ascending: true }).limit(1);
    if (data) setMyMatch(data[0]);
  }

  const handlePickTeam = async () => {
    const { data: teams } = await supabase.from('basvurular').select('*').ilike('takim_adi', pickerInput);
    const target = teams?.find(t => !t.kaptan_email);
    if (target) {
      await supabase.from('basvurular').update({ kaptan_email: user.email }).eq('id', target.id);
      window.location.reload();
    } else { alert("Takım bulunamadı veya zaten dolu!"); }
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-yellow-500 selection:text-black pb-20">
      
      {/* 1. ÜST BAND */}
      <div className="bg-yellow-500 text-black text-[10px] font-black py-1.5 text-center uppercase tracking-[0.4em]">
        ⚡ PENDİK SAHİL 3X3 ARENA - {timeLeft}
      </div>

      {/* Navigasyon */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-3xl font-black italic text-yellow-500 tracking-tighter">ALTIN POTA</h1>
        <div className="flex gap-4">
          {user ? (
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="bg-zinc-900 border border-zinc-800 px-5 py-2 rounded-2xl text-[10px] font-bold uppercase hover:bg-red-500/10 hover:text-red-500 transition">Çıkış Yap</button>
          ) : (
            <Link href="/admin" className="bg-white text-black px-6 py-2 rounded-full font-black text-xs uppercase italic">Giriş</Link>
          )}
        </div>
      </nav>

      {/* 2. HAFTANIN YILDIZLARI BÖLÜMÜ */}
      {yildizlar && (
        <section className="py-8 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-8 rounded-[2.5rem] text-black relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-black italic text-[10px] mb-2 uppercase tracking-widest opacity-70">Haftanın Takımı</h3>
              <p className="text-4xl font-black italic uppercase leading-none mb-3">{yildizlar.takim_adi}</p>
              <span className="bg-black/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{yildizlar.takim_skor_ozet}</span>
            </div>
            <div className="absolute right-[-10px] bottom-[-30px] text-[10rem] font-black italic opacity-10 group-hover:scale-110 transition-transform">#1</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-yellow-500/40 transition">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center text-4xl border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]">👑</div>
            <div>
              <h3 className="font-black italic text-[10px] mb-1 uppercase tracking-widest text-yellow-500">Haftanın MVP'si</h3>
              <p className="text-2xl font-black italic uppercase">{yildizlar.mvp_isim}</p>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{yildizlar.mvp_istatistik}</p>
            </div>
          </div>
        </section>
      )}

      {/* 3. KAPTAN DASHBOARD (Kadro Yönetimi Özelliğiyle) */}
      {myTeam && (
        <section className="max-w-6xl mx-auto px-6 mb-12 animate-in fade-in zoom-in duration-700">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[3rem] relative">
            <div className="absolute -top-3 left-10 bg-yellow-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase italic">Kaptan Paneli</div>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-black italic uppercase mb-2">Hoş Geldin, {myTeam.oyuncu_1}</h2>
                <p className="text-zinc-500 text-xs mb-6 tracking-widest uppercase">{myTeam.takim_adi} Kaptanı</p>
                <div className="flex gap-4">
                   <div className="text-center bg-black/40 p-4 rounded-2xl flex-1 border border-zinc-800">
                      <p className="text-2xl font-black text-yellow-500">{myTeam.puan}</p>
                      <p className="text-[8px] text-zinc-500 uppercase font-bold">Toplam Puan</p>
                   </div>
                   <div className="text-center bg-black/40 p-4 rounded-2xl flex-1 border border-zinc-800">
                      <p className="text-2xl font-black text-yellow-500">{myTeam.galibiyet}</p>
                      <p className="text-[8px] text-zinc-500 uppercase font-bold">Galibiyet</p>
                   </div>
                </div>
              </div>
              {myMatch ? <MatchCard match={myMatch} /> : <div className="text-zinc-600 italic text-center uppercase text-xs tracking-widest">Sıradaki maçın henüz belirlenmedi.</div>}
            </div>
          </div>
        </section>
      )}

      {/* 4. TAB MENÜ & LİSTELER */}
      <main className="max-w-6xl mx-auto px-6">
        <div className="flex justify-center gap-2 mb-10 bg-zinc-900/80 p-1.5 rounded-2xl w-fit mx-auto border border-zinc-800 backdrop-blur-md">
          {['program', 'puan', 'kurallar'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${tab === t ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-500 hover:text-white'}`}>
              {t === 'program' ? 'Fikstür' : t === 'puan' ? 'Puan Durumu' : 'Kurallar'}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {tab === 'program' && (
            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-500">
              {maclar.map(mac => <MatchCard key={mac.id} match={mac} />)}
            </div>
          )}

          {tab === 'puan' && (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden animate-in zoom-in duration-500">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900 text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                    <th className="p-6">Sıra</th>
                    <th className="p-6">Takım</th>
                    <th className="p-6 text-center">G</th>
                    <th className="p-6 text-center">M</th>
                    <th className="p-6 text-center text-yellow-500">Puan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {basvurular.map((t, i) => (
                    <tr key={t.id} className="hover:bg-yellow-500/5 transition group">
                      <td className="p-6 font-black italic text-zinc-700 group-hover:text-yellow-500 transition">{i + 1}</td>
                      <td className="p-6 font-black uppercase text-sm">{t.takim_adi}</td>
                      <td className="p-6 text-center font-bold text-zinc-400">{t.galibiyet}</td>
                      <td className="p-6 text-center font-bold text-zinc-400">{t.maglubiyet}</td>
                      <td className="p-6 text-center font-black text-yellow-500">{t.puan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'kurallar' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {kurallar.map(k => (
                <details key={k.id} className="group bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
                  <summary className="p-6 cursor-pointer font-black italic flex justify-between items-center group-open:text-yellow-500 uppercase transition text-xs tracking-widest">
                    {k.baslik} <span className="text-yellow-500 transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="px-6 pb-6 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/20 pt-4">{k.icerik}</div>
                </details>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* TAKIM BAĞLAMA MODAL (VİDEO ÇÖZÜMÜ) */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/98 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-yellow-500/40 p-10 rounded-[3rem] max-w-md w-full text-center shadow-[0_0_100px_rgba(234,179,8,0.1)]">
            <div className="text-5xl mb-6 drop-shadow-lg">🏀</div>
            <h2 className="text-3xl font-black mb-2 italic uppercase tracking-tighter">Kimsin Kaptan?</h2>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed italic">Turnuva sistemine hoş geldin. Kayıt olduğun takım adını yazarak kontrolü ele al!</p>
            <input value={pickerInput} onChange={(e) => setPickerInput(e.target.value)} placeholder="Takım Adı" className="w-full bg-black border border-zinc-800 p-5 rounded-2xl mb-4 text-center text-2xl font-black outline-none focus:border-yellow-500 transition-all uppercase placeholder:text-zinc-800" />
            <button onClick={handlePickTeam} className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl text-lg hover:bg-white transition uppercase italic shadow-xl shadow-yellow-500/10">Kaptanlığı Onayla</button>
          </div>
        </div>
      )}
    </div>
  );
}