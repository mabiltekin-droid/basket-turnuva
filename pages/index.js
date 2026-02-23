import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MatchCard from '../components/MatchCard';
import Link from 'next/link';

export default function Home() {
  const [tab, setTab] = useState('program');
  const [maclar, setMaclar] = useState([]);
  const [puanDurumu, setPuanDurumu] = useState([]);
  const [kurallar, setKurallar] = useState([]);
  const [yildizlar, setYildizlar] = useState(null);
  const [user, setUser] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [myMatch, setMyMatch] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerInput, setPickerInput] = useState('');

  const ADMIN_EMAIL = "m.a.biltekin@gmail.com"; 

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // ADMIN KONTROLÜ (Sonsuz döngüyü ve modalı kırar)
        if (session.user.email === ADMIN_EMAIL) {
          setShowPicker(false);
          return;
        }

        // KAPTAN KONTROLÜ
        const { data: team } = await supabase.from('basvurular').select('*').eq('kaptan_email', session.user.email).maybeSingle();
        if (team) {
          setMyTeam(team);
          fetchMyMatch(team.takim_adi);
          setShowPicker(false);
        } else {
          setShowPicker(true);
        }
      }
    };
    init();
    fetchData();
  }, []);

  async function fetchData() {
    const { data: m } = await supabase.from('maclar').select('*').order('saat', { ascending: true });
    const { data: p } = await supabase.from('basvurular').select('*').order('puan', { descending: true });
    const { data: k } = await supabase.from('kurallar').select('*').order('sira', { ascending: true });
    const { data: y } = await supabase.from('haftanin_yildizlari').select('*').eq('id', 1).maybeSingle();
    setMaclar(m || []);
    setPuanDurumu(p || []);
    setKurallar(k || []);
    setYildizlar(y || null);
  }

  async function fetchMyMatch(tName) {
    const { data } = await supabase.from('maclar').select('*').or(`takim_a.eq."${tName}",takim_b.eq."${tName}"`).order('saat', { ascending: true }).limit(1);
    if (data) setMyMatch(data[0]);
  }

  const handlePickTeam = async () => {
    const { data: teams } = await supabase.from('basvurular').select('*').ilike('takim_adi', pickerInput);
    const target = teams?.find(t => !t.kaptan_email);
    if (target) {
      await supabase.from('basvurular').update({ kaptan_email: user.email }).eq('id', target.id);
      window.location.reload();
    } else { alert("HATA: Takım bulunamadı veya kaptanı zaten mevcut!"); }
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
                <Link href="/admin" className="text-[10px] font-black bg-yellow-500 text-black px-5 py-2.5 rounded-2xl uppercase italic shadow-lg shadow-yellow-500/20 hover:scale-105 transition">Panel</Link>
              )}
              <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[10px] font-bold text-zinc-500 border border-zinc-800 px-5 py-2.5 rounded-2xl uppercase hover:bg-white hover:text-black transition">Çıkış</button>
            </div>
          ) : (
            <Link href="/admin" className="bg-white text-black px-10 py-3 rounded-full font-black text-xs uppercase italic hover:bg-yellow-500 transition shadow-2xl">GİRİŞ YAP</Link>
          )}
        </div>
      </nav>

      {/* 2. HAFTANIN VİTRİNİ */}
      {yildizlar && (
        <section className="px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-6 mb-12 pt-8 animate-in slide-in-from-top-10 duration-1000">
          <div className="bg-yellow-500 p-12 rounded-[3.5rem] text-black relative group overflow-hidden">
            <h3 className="font-black italic text-[10px] uppercase opacity-60 mb-2 tracking-[0.2em]">Haftanın Takımı</h3>
            <p className="text-5xl font-black italic uppercase leading-none tracking-tighter">{yildizlar.takim_adi}</p>
            <div className="absolute right-[-20px] bottom-[-20px] text-[10rem] opacity-10 font-black italic pointer-events-none">WIN</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] flex items-center gap-8 group hover:border-yellow-500/20 transition">
            <div className="text-7xl group-hover:rotate-12 transition duration-500">👑</div>
            <div>
              <h3 className="font-black italic text-[10px] uppercase text-yellow-500 mb-1 tracking-widest underline underline-offset-4 decoration-yellow-500/30">Haftanın MVP'si</h3>
              <p className="text-3xl font-black italic uppercase leading-tight tracking-tighter">{yildizlar.mvp_isim}</p>
              <p className="text-zinc-500 text-[10px] font-black uppercase mt-2 tracking-widest italic">{yildizlar.mvp_istatistik}</p>
            </div>
          </div>
        </section>
      )}

      {/* 3. KAPTAN DASHBOARD */}
      {myTeam && (
        <section className="px-6 max-w-6xl mx-auto mb-20 animate-in slide-in-from-bottom-10 duration-1000">
          <div className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[4rem] flex flex-col lg:flex-row justify-between items-center gap-12 backdrop-blur-xl">
            <div className="text-center lg:text-left">
              <p className="text-yellow-500 font-black italic text-xs mb-3 uppercase tracking-[0.4em]">Kaptan Girişi Onaylandı</p>
              <h2 className="text-6xl font-black italic uppercase tracking-tighter mb-6">{myTeam.takim_adi}</h2>
              <div className="flex gap-4 justify-center lg:justify-start">
                 <div className="bg-black/50 px-6 py-3 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">PUAN: {myTeam.puan}</p></div>
                 <div className="bg-black/50 px-6 py-3 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{myTeam.galibiyet}G - {myTeam.maglubiyet}M</p></div>
              </div>
            </div>
            {myMatch && (
              <div className="max-w-md w-full relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest z-10 shadow-xl shadow-yellow-500/20">SIRADAKİ MAÇIN</div>
                <MatchCard match={myMatch} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. TAB MENÜ & LİSTELER */}
      <main className="max-w-6xl mx-auto px-6">
        <div className="flex justify-center gap-2 mb-12 bg-zinc-900/80 p-2 rounded-[2rem] w-fit mx-auto border border-zinc-800 backdrop-blur-3xl">
          {['program', 'puan', 'kurallar'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase transition-all duration-300 ${tab === t ? 'bg-yellow-500 text-black scale-105 shadow-2xl shadow-yellow-500/20' : 'text-zinc-500 hover:text-white'}`}>
              {t === 'program' ? 'Fikstür' : t === 'puan' ? 'Sıralama' : 'Kurallar'}
            </button>
          ))}
        </div>

        <div className="min-h-[500px]">
          {tab === 'program' && <div className="grid md:grid-cols-2 gap-8 animate-in fade-in zoom-in duration-500">{maclar.map(m => <MatchCard key={m.id} match={m} />)}</div>}
          
          {tab === 'puan' && (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[3rem] overflow-hidden animate-in slide-in-from-left-10 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-900/50 text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] border-b border-zinc-800">
                    <tr>
                      <th className="p-8">Sıra</th>
                      <th className="p-8">Takım Bilgisi</th>
                      <th className="p-8 text-center">G</th>
                      <th className="p-8 text-center">M</th>
                      <th className="p-8 text-center text-yellow-500">Puan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/20">
                    {puanDurumu.map((t, i) => (
                      <tr key={t.id} className="hover:bg-yellow-500/5 transition-all group">
                        <td className="p-8 font-black italic text-zinc-700 text-2xl group-hover:text-yellow-500/20 transition">{i+1}</td>
                        <td className="p-8">
                          <p className="font-black uppercase tracking-tight text-2xl italic group-hover:translate-x-2 transition-transform duration-300">{t.takim_adi}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 italic">{t.oyuncu_1}, {t.oyuncu_2}...</p>
                        </td>
                        <td className="p-8 text-center font-bold text-zinc-400">{t.galibiyet}</td>
                        <td className="p-8 text-center font-bold text-zinc-400">{t.maglubiyet}</td>
                        <td className="p-8 text-center font-black text-yellow-500 text-3xl italic">{t.puan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'kurallar' && (
            <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-500">
              {kurallar.map(k => (
                <details key={k.id} className="group bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-zinc-600 transition">
                  <summary className="p-8 cursor-pointer font-black italic uppercase text-xs flex justify-between items-center group-open:text-yellow-500 tracking-widest">
                    {k.baslik} <span className="transition-transform group-open:rotate-180 text-yellow-500 text-lg">▼</span>
                  </summary>
                  <div className="px-8 pb-8 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/30 pt-6 italic font-medium">{k.icerik}</div>
                </details>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 5. TAKIM SEÇME MODALI (KAPTANLAR İÇİN) */}
      {showPicker && user && (
        <div className="fixed inset-0 bg-black/98 z-[300] flex items-center justify-center p-6 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-zinc-900 border border-yellow-500/20 p-16 rounded-[5rem] max-w-md w-full text-center shadow-[0_0_100px_rgba(234,179,8,0.1)]">
            <h2 className="text-5xl font-black mb-4 italic uppercase tracking-tighter">Hoş Geldin</h2>
            <p className="text-zinc-500 text-[10px] mb-12 uppercase tracking-[0.4em] font-black underline decoration-yellow-500/20">Takımını Seç ve Kontrolü Ele Al</p>
            <input 
              value={pickerInput} 
              onChange={(e) => setPickerInput(e.target.value)} 
              placeholder="TAKIM ADI" 
              className="w-full bg-black border border-zinc-800 p-8 rounded-[2.5rem] mb-8 text-center text-3xl font-black outline-none focus:border-yellow-500 uppercase transition-all tracking-tighter placeholder:opacity-10" 
            />
            <button 
              onClick={handlePickTeam} 
              className="w-full bg-yellow-500 text-black font-black py-7 rounded-[2.5rem] text-xl hover:bg-white hover:scale-105 active:scale-95 transition-all uppercase italic shadow-2xl"
            >
              KAPTANLIĞI BAŞLAT
            </button>
          </div>
        </div>
      )}

    </div>
  );
}