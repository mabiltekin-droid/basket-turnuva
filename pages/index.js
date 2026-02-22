import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MatchCard from '../components/MatchCard';
import Link from 'next/link';

export default function Home() {
  const [tab, setTab] = useState('program');
  const [maclar, setMaclar] = useState([]);
  const [kurallar, setKurallar] = useState([]);
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
        // Takımı kontrol et
        const { data: team } = await supabase
          .from('basvurular')
          .select('takim_adi')
          .eq('kaptan_email', session.user.email)
          .single();
        
        if (team) {
          setMyTeam(team.takim_adi);
          fetchMyMatch(team.takim_adi);
        } else {
          setShowPicker(true);
        }
      }
    };
    init();
    fetchMaclar();
    fetchKurallar();
  }, []);

  async function fetchMaclar() {
    const { data } = await supabase.from('maclar').select('*').order('saat', { ascending: true });
    setMaclar(data || []);
  }

  async function fetchKurallar() {
    const { data } = await supabase.from('kurallar').select('*').order('sira', { ascending: true });
    setKurallar(data || []);
  }

  async function fetchMyMatch(takimAdi) {
    const { data } = await supabase.from('maclar')
      .select('*')
      .or(`takim_a.eq."${takimAdi}",takim_b.eq."${takimAdi}"`)
      .order('saat', { ascending: true }).limit(1);
    if (data) setMyMatch(data[0]);
  }

  const handlePickTeam = async () => {
    const { error } = await supabase
      .from('basvurular')
      .update({ kaptan_email: user.email })
      .eq('takim_adi', pickerInput);
    
    if (!error) window.location.reload();
    else alert("Takım bulunamadı! Lütfen kayıtlı takım adını tam yaz.");
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-x-hidden">
      
      {/* 1. ÜST BİLGİ BANDI (HAVA DURUMU SİMÜLASYONU) */}
      <div className="bg-yellow-500 text-black text-[10px] font-bold py-1 text-center uppercase tracking-[0.3em]">
        ☀️ 22 Şubat Maç Günü: Pendik Sahili 18°C - Hava Basketbol İçin Müsait
      </div>

      {/* Navigasyon */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-3xl font-black italic text-yellow-500 tracking-tighter">ALTIN POTA</h1>
        {user ? (
          <div className="flex items-center gap-4">
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-xs font-bold uppercase tracking-tighter">Kaptan: {myTeam || "Tanımsız"}</span>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-zinc-500 hover:text-red-500 text-xs font-bold">ÇIKIŞ</button>
          </div>
        ) : (
          <Link href="/admin" className="bg-yellow-500 text-black px-6 py-2 rounded-full font-black text-xs hover:scale-105 transition tracking-widest">GİRİŞ YAP</Link>
        )}
      </nav>

      {/* Hero */}
      <header className="py-20 text-center px-6">
        <h2 className="text-8xl md:text-[12rem] font-black italic tracking-tighter leading-none mb-6 opacity-20 absolute left-0 w-full pointer-events-none select-none">PENDIK 3X3</h2>
        <div className="relative z-10">
          <h3 className="text-5xl md:text-8xl font-black italic uppercase leading-none mb-4">SOKAKTA <br/><span className="text-yellow-500">KURAL YOK.</span></h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-10 text-sm md:text-base">Kendi hikayeni yazmaya hazır mısın? Pendik'in en büyük ödüllü basketbol turnuvası başlıyor.</p>
          {!user && (
            <Link href="/kayit" className="inline-block bg-white text-black px-12 py-5 rounded-full font-black text-xl hover:bg-yellow-500 transition shadow-2xl">KAYDINI YAP</Link>
          )}
        </div>
      </header>

      {/* Takım Bağlama Ekranı (Modal) */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-zinc-900 border border-yellow-500/50 p-10 rounded-[3rem] max-w-md w-full shadow-[0_0_50px_rgba(234,179,8,0.1)] text-center">
            <div className="text-5xl mb-6">🏀</div>
            <h2 className="text-2xl font-black mb-2 italic uppercase">Takımını Onayla</h2>
            <p className="text-zinc-500 text-sm mb-8">Hoş geldin kaptan! Giriş yaptın ancak hangi takımın senin olduğunu henüz bilmiyoruz.</p>
            <input 
              value={pickerInput}
              onChange={(e) => setPickerInput(e.target.value)}
              placeholder="Kayıtlı Takım Adı" 
              className="w-full bg-black border border-zinc-800 p-5 rounded-2xl mb-4 text-center text-xl font-bold outline-none focus:border-yellow-500" 
            />
            <button onClick={handlePickTeam} className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl text-lg hover:bg-white transition">KAPTANLIĞI AL</button>
          </div>
        </div>
      )}

      {/* Dashboard & Maçlar */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Kaptana Özel Maç Kartı */}
        {myMatch && (
          <div className="mb-20">
            <h4 className="text-yellow-500 font-black italic mb-6 tracking-widest text-center uppercase">-- SIRADAKİ MAÇIN --</h4>
            <div className="max-w-2xl mx-auto transform hover:scale-[1.02] transition">
              <MatchCard match={myMatch} />
            </div>
          </div>
        )}

        {/* Tab Menü */}
        <div className="flex justify-center gap-2 mb-12 bg-zinc-900/50 p-2 rounded-3xl w-fit mx-auto border border-zinc-800">
          {['program', 'agac', 'kurallar'].map((t) => (
            <button 
              key={t}
              onClick={() => setTab(t)}
              className={`px-10 py-4 rounded-2xl font-black text-sm uppercase transition-all ${tab === t ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              {t === 'program' ? 'FİKSTÜR' : t === 'agac' ? 'AĞAÇ' : 'TÜZÜK'}
            </button>
          ))}
        </div>

        {/* İçerik */}
        <div className="min-h-[400px]">
          {tab === 'program' && (
            <div className="grid md:grid-cols-2 gap-6">
              {maclar.map(mac => <MatchCard key={mac.id} match={mac} />)}
            </div>
          )}
          {tab === 'kurallar' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {kurallar.map(kural => (
                <div key={kural.id} className="p-8 bg-zinc-900 rounded-[2rem] border border-zinc-800 group hover:border-yellow-500 transition">
                  <h5 className="text-xl font-black italic mb-2 uppercase tracking-tighter text-yellow-500">{kural.baslik}</h5>
                  <p className="text-zinc-400 text-sm leading-relaxed">{kural.icerik}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Ödüller ve Sponsorlar (Footer'a yakın) */}
      <section className="bg-zinc-900/20 py-20 border-t border-zinc-900 mt-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">
           <div className="text-center">
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Büyük Ödül</p>
              <p className="text-3xl font-black italic">10.000 TL</p>
           </div>
           <div className="text-center border-x border-zinc-800">
              <div className="text-5xl mb-4">🎖️</div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">MVP Ödülü</p>
              <p className="text-3xl font-black italic">ÖZEL PAKET</p>
           </div>
           <div className="text-center">
              <div className="text-5xl mb-4">🍕</div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Tüm Katılımcılara</p>
              <p className="text-3xl font-black italic">ÜCRETSİZ MENÜ</p>
           </div>
        </div>
      </section>

      <footer className="py-10 text-center text-zinc-700 text-[10px] font-bold tracking-[0.5em] uppercase border-t border-zinc-900">
        ALTIN POTA 2026 | Pendik Basketbol Komitesi
      </footer>

    </div>
  );
}