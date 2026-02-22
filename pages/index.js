import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MatchCard from '../components/MatchCard';
import Link from 'next/link';

export default function Home() {
  const [tab, setTab] = useState('program');
  const [maclar, setMaclar] = useState([]);
  const [kurallar, setKurallar] = useState([]);
  const [user, setUser] = useState(null);
  const [myMatch, setMyMatch] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // 1. Oturum ve Kullanıcı Verisi
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchMyMatch(session.user.email);
      }
    };
    
    init();
    fetchMaclar();
    fetchKurallar();

    // 2. Geri Sayım Sayacı (Hedef: 15 Haziran 2026)
    const target = new Date("2026-06-15T10:00:00");
    const timer = setInterval(() => {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft("TURNUVA BAŞLADI!");
        clearInterval(timer);
      } else {
        const gun = Math.floor(diff / (1000 * 60 * 60 * 24));
        const saat = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const dk = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${gun}G ${saat}S ${dk}D KALDI`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  async function fetchMaclar() {
    const { data } = await supabase.from('maclar').select('*').order('saat', { ascending: true });
    if (data) setMaclar(data);
  }

  async function fetchKurallar() {
    const { data } = await supabase.from('kurallar').select('*').order('sira', { ascending: true });
    if (data) setKurallar(data);
  }

  async function fetchMyMatch(email) {
    const { data: team } = await supabase.from('basvurular').select('takim_adi').eq('kaptan_email', email).single();
    if (team) {
      const { data: match } = await supabase.from('maclar')
        .select('*')
        .or(`takim_a.eq."${team.takim_adi}",takim_b.eq."${team.takim_adi}"`)
        .order('saat', { ascending: true }).limit(1);
      if (match) setMyMatch(match[0]);
    }
  }

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-yellow-500 selection:text-black">
      
      {/* Üst Navigasyon */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-black italic tracking-tighter text-yellow-500">ALTIN POTA</div>
        <div className="flex gap-6 items-center">
          {user ? (
            <div className="flex items-center gap-4 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
              <span className="text-xs font-bold text-zinc-400">{user.email}</span>
              <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded-lg uppercase">Çıkış</button>
            </div>
          ) : (
            <Link href="/admin" className="text-sm font-bold hover:text-yellow-500 transition">KAPTAN GİRİŞİ</Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-yellow-500/5 blur-[120px] rounded-full"></div>
        
        {timeLeft && (
          <div className="inline-block bg-yellow-500 text-black px-6 py-2 rounded-full font-black text-sm mb-6 animate-pulse tracking-widest">
            🚀 {timeLeft}
          </div>
        )}
        
        <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">BÜYÜK</span><br/>
          <span className="text-yellow-500">FİNAL</span>
        </h1>
        <p className="text-zinc-400 max-w-lg mx-auto mb-10 text-lg leading-relaxed">
          İstanbul'un en sert 3x3 turnuvası başlıyor. Sende yerini al, Pendik sahilinde tarih yaz!
        </p>
        
        {!user && (
          <Link href="/kayit" className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xl hover:bg-yellow-500 transition-all uppercase italic shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            TAKIMINI KAYDET
          </Link>
        )}
      </header>

      {/* Kaptan Paneli */}
      {myMatch && (
        <section className="max-w-4xl mx-auto px-6 mb-16">
          <div className="bg-gradient-to-r from-yellow-500/20 to-transparent border-l-4 border-yellow-500 p-8 rounded-r-3xl">
            <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-[0.2em] mb-4">Senin Sıradaki Maçın</h2>
            <MatchCard match={myMatch} />
          </div>
        </section>
      )}

      {/* Turnuva Bilgileri (Sekmeler) */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="flex bg-zinc-900/50 p-2 rounded-2xl gap-2 mb-10">
          <button onClick={() => setTab('program')} className={`flex-1 py-4 rounded-xl font-black transition-all ${tab === 'program' ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}>MAÇ PROGRAMI</button>
          <button onClick={() => setTab('agac')} className={`flex-1 py-4 rounded-xl font-black transition-all ${tab === 'agac' ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}>TURNUVA AĞACI</button>
          <button onClick={() => setTab('kurallar')} className={`flex-1 py-4 rounded-xl font-black transition-all ${tab === 'kurallar' ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}>KURALLAR</button>
        </div>

        {tab === 'program' && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {maclar.map(mac => <MatchCard key={mac.id} match={mac} />)}
          </div>
        )}

        {tab === 'agac' && (
          <div className="p-20 border border-zinc-800 rounded-[3rem] bg-zinc-900/20 text-center italic text-zinc-500 animate-in zoom-in duration-500">
            <div className="text-5xl mb-6">bracket coming soon</div>
            Ağaç yapısı eşleşmeler tamamlandığında burada belirecek.
          </div>
        )}

        {tab === 'kurallar' && (
          <div className="grid gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
            {kurallar.map(kural => (
              <details key={kural.id} className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <summary className="p-6 cursor-pointer font-bold flex justify-between items-center group-open:text-yellow-500 transition">
                  {kural.baslik}
                  <span className="group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <div className="px-6 pb-6 text-zinc-400 text-sm">{kural.icerik}</div>
              </details>
            ))}
          </div>
        )}
      </section>

      {/* Ödüller */}
      <section className="py-32 px-6">
        <h2 className="text-center text-4xl font-black italic mb-16 uppercase tracking-tighter">BÜYÜK ÖDÜLLER</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { pos: '1.', prize: '10.000 TL', desc: 'PARA ÖDÜLÜ + KUPA', emoji: '🥇', border: 'border-yellow-500/50' },
            { pos: '2.', prize: '5.000 TL', desc: 'PARA ÖDÜLÜ + MADALYA', emoji: '🥈', border: 'border-zinc-700' },
            { pos: '3.', prize: 'Hediye Çeki', desc: 'SPOR MAĞAZASI ÇEKİ', emoji: '🥉', border: 'border-zinc-800' }
          ].map((item, i) => (
            <div key={i} className={`p-10 rounded-[2.5rem] bg-zinc-900/30 border-2 ${item.border} text-center hover:scale-105 transition-transform`}>
              <div className="text-6xl mb-6">{item.emoji}</div>
              <div className="text-sm font-bold text-zinc-500 mb-2 uppercase tracking-widest">{item.pos} TAKIM</div>
              <div className="text-3xl font-black mb-2">{item.prize}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Sponsorlar */}
      <footer className="pb-20 pt-10 px-6 border-t border-zinc-900 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.5em] mb-12">Official Partners</p>
          <div className="flex flex-wrap justify-center gap-16 grayscale opacity-30 hover:opacity-100 transition-all duration-700">
             <div className="h-6 w-32 bg-white rounded-full"></div>
             <div className="h-6 w-24 bg-white rounded-full"></div>
             <div className="h-6 w-40 bg-white rounded-full"></div>
          </div>
          <p className="mt-20 text-[10px] text-zinc-700 uppercase tracking-widest">© 2026 Altın Pota 3x3 | Pendik Sahil Etkinliği</p>
        </div>
      </footer>

    </div>
  );
}