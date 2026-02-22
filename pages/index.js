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

  const handlePickTeam = async () => {
    const { data: teams } = await supabase.from('basvurular').select('*').ilike('takim_adi', pickerInput);
    const target = teams?.find(t => !t.kaptan_email);
    if (target) {
      await supabase.from('basvurular').update({ kaptan_email: user.email }).eq('id', target.id);
      window.location.reload();
    } else { alert("Takım bulunamadı veya eşleşme yapılamadı."); }
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-yellow-500 pb-20">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-zinc-900 mb-6">
        <h1 className="text-2xl font-black italic text-yellow-500 uppercase tracking-tighter">ALTIN POTA</h1>
        <div className="flex gap-4">
          {user ? (
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[10px] font-bold uppercase text-zinc-500 border border-zinc-800 px-4 py-2 rounded-xl">ÇIKIŞ</button>
          ) : (
            <Link href="/admin" className="bg-white text-black px-6 py-2 rounded-full font-black text-xs uppercase italic tracking-widest">Giriş</Link>
          )}
        </div>
      </nav>

      {/* Vitrin */}
      {yildizlar && (
        <section className="px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-4 mb-10">
          <div className="bg-yellow-500 p-8 rounded-[2rem] text-black relative group">
            <h3 className="font-black italic text-[10px] uppercase opacity-70 mb-2">Haftanın Takımı</h3>
            <p className="text-3xl font-black italic uppercase leading-tight">{yildizlar.takim_adi}</p>
            <div className="absolute right-4 bottom-4 text-6xl opacity-20">🏀</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] flex items-center gap-6">
            <div className="text-4xl">👑</div>
            <div>
              <h3 className="font-black italic text-[10px] uppercase text-yellow-500 mb-1">MVP</h3>
              <p className="text-xl font-black italic uppercase">{yildizlar.mvp_isim}</p>
              <p className="text-zinc-500 text-[10px] font-bold uppercase">{yildizlar.mvp_istatistik}</p>
            </div>
          </div>
        </section>
      )}

      {/* Kaptan Dashboard */}
      {myTeam && (
        <section className="px-6 max-w-6xl mx-auto mb-10">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-yellow-500 font-black italic text-xs mb-1 uppercase tracking-widest">Hoş Geldin, {myTeam.oyuncu_1}</p>
              <h2 className="text-3xl font-black italic uppercase">{myTeam.takim_adi}</h2>
            </div>
            {myMatch && <div className="max-w-xs w-full"><MatchCard match={myMatch} /></div>}
          </div>
        </section>
      )}

      {/* Ana İçerik */}
      <main className="max-w-6xl mx-auto px-6">
        <div className="flex justify-center gap-2 mb-10 bg-zinc-900 p-1 rounded-2xl w-fit mx-auto border border-zinc-800">
          {['program', 'puan', 'kurallar'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition ${tab === t ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-500 hover:text-white'}`}>
              {t === 'program' ? 'Fikstür' : t === 'puan' ? 'Sıralama' : 'Kurallar'}
            </button>
          ))}
        </div>

        <div className="min-h-[300px]">
          {tab === 'program' && <div className="grid md:grid-cols-2 gap-4">{maclar.map(m => <MatchCard key={m.id} match={m} />)}</div>}
          {tab === 'puan' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-800/50 text-[10px] text-zinc-500 uppercase font-black">
                  <tr><th className="p-4">Sıra</th><th className="p-4">Takım</th><th className="p-4 text-center">G</th><th className="p-4 text-center">M</th><th className="p-4 text-center text-yellow-500">P</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {puanDurumu.map((t, i) => (
                    <tr key={t.id} className="text-sm font-bold uppercase">
                      <td className="p-4 italic text-zinc-600">{i+1}</td>
                      <td className="p-4">{t.takim_adi}</td>
                      <td className="p-4 text-center text-zinc-400">{t.galibiyet}</td>
                      <td className="p-4 text-center text-zinc-400">{t.maglubiyet}</td>
                      <td className="p-4 text-center text-yellow-500 font-black">{t.puan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'kurallar' && (
            <div className="max-w-2xl mx-auto space-y-3">
              {kurallar.map(k => (
                <details key={k.id} className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <summary className="p-5 cursor-pointer font-black italic uppercase text-xs flex justify-between items-center group-open:text-yellow-500">
                    {k.baslik} <span className="transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="px-5 pb-5 text-zinc-400 text-xs leading-relaxed border-t border-zinc-800/50 pt-3">{k.icerik}</div>
                </details>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Takım Bağlama */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-yellow-500/20 p-10 rounded-[3rem] max-w-md w-full text-center">
            <h2 className="text-2xl font-black mb-2 italic uppercase">Hoş Geldin Kaptan!</h2>
            <p className="text-zinc-500 text-[10px] mb-8 uppercase tracking-widest font-bold">Kayıtlı Takım Adını Girerek Başla</p>
            <input value={pickerInput} onChange={(e) => setPickerInput(e.target.value)} placeholder="Takım Adı" className="w-full bg-black border border-zinc-800 p-5 rounded-2xl mb-4 text-center text-xl font-black outline-none focus:border-yellow-500 uppercase transition-all" />
            <button onClick={handlePickTeam} className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl text-lg hover:bg-white transition uppercase italic">Kontrolü Al</button>
          </div>
        </div>
      )}
    </div>
  );
}