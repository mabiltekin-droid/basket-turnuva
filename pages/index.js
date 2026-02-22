import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MatchCard from '../components/MatchCard';
import Link from 'next/link';

export default function Home() {
  const [tab, setTab] = useState('program');
  const [maclar, setMaclar] = useState([]);
  const [user, setUser] = useState(null);
  const [myMatch, setMyMatch] = useState(null);

  useEffect(() => {
    // Oturum kontrolü
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchMyMatch(session.user.email);
      }
    };
    
    checkUser();
    fetchMaclar();
  }, []);

  // Tüm maçları getir
  async function fetchMaclar() {
    const { data } = await supabase.from('maclar').select('*').order('saat', { ascending: true });
    if (data) setMaclar(data);
  }

  // Kaptanın özel maçını getir
  async function fetchMyMatch(email) {
    const { data: team } = await supabase
      .from('basvurular')
      .select('takim_adi')
      .eq('kaptan_email', email)
      .single();
    
    if (team) {
      const { data: match } = await supabase
        .from('maclar')
        .select('*')
        .or(`takim_a.eq."${team.takim_adi}",takim_b.eq."${team.takim_adi}"`)
        .order('saat', { ascending: true })
        .limit(1);
      if (match) setMyMatch(match[0]);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMyMatch(null);
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      {/* Üst Bar / Giriş Durumu */}
      <div className="flex justify-end p-4 gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm">{user.email}</span>
            <button onClick={handleLogout} className="text-xs text-red-500 underline">Çıkış Yap</button>
          </div>
        ) : (
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-yellow-500 transition">Kaptan Girişi</Link>
        )}
      </div>

      {/* Hero Section */}
      <div className="py-12 px-6 text-center bg-gradient-to-b from-zinc-900 to-black">
        <h1 className="text-6xl font-black italic text-yellow-500 tracking-tighter mb-4 uppercase">Altın Pota 3x3</h1>
        <p className="text-zinc-400 max-w-md mx-auto mb-8 text-lg">Potanın efendileri Pendik sahilinde buluşuyor!</p>
        {!user && (
          <Link href="/kayit" className="inline-block bg-yellow-500 text-black px-10 py-4 rounded-full font-black text-xl hover:scale-105 transition-transform uppercase italic tracking-tighter">
            Hemen Kayıt Ol
          </Link>
        )}
      </div>

      {/* Kaptana Özel Bölüm: Senin Maçın */}
      {myMatch && (
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <div className="bg-yellow-500/10 border-2 border-yellow-500 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-500 text-black px-4 py-1 font-bold text-xs uppercase">Sıradaki Maçın</div>
            <h3 className="text-yellow-500 font-bold mb-4 uppercase tracking-widest text-sm">Hoş geldin Kaptan, takımının maçı:</h3>
            <MatchCard match={myMatch} />
          </div>
        </div>
      )}

      {/* Sekmeler */}
      <div className="flex justify-center gap-4 my-8">
        <button onClick={() => setTab('program')} className={`px-8 py-3 rounded-xl font-black transition-all ${tab === 'program' ? 'bg-yellow-500 text-black scale-110' : 'bg-zinc-900 text-zinc-500'}`}>MAÇ PROGRAMI</button>
        <button onClick={() => setTab('agac')} className={`px-8 py-3 rounded-xl font-black transition-all ${tab === 'agac' ? 'bg-yellow-500 text-black scale-110' : 'bg-zinc-900 text-zinc-500'}`}>TURNUVA AĞACI</button>
      </div>

      <main className="max-w-4xl mx-auto px-6 pb-20">
        {tab === 'program' ? (
          <div className="grid gap-6">
            {maclar.length > 0 ? maclar.map(mac => <MatchCard key={mac.id} match={mac} />) : <p className="text-center text-zinc-500 py-10">Henüz maç programı girilmedi.</p>}
          </div>
        ) : (
          <div className="p-12 border border-zinc-800 rounded-3xl bg-zinc-900/50 text-center">
            <h2 className="text-2xl font-bold mb-4 italic uppercase">Play-off Braketi</h2>
            <div className="h-40 flex items-center justify-center border border-dashed border-zinc-700 rounded-2xl">
              <p className="text-zinc-500 italic">Eşleşmeler yakında burada görünecek...</p>
            </div>
          </div>
        )}
      </main>

      {/* Ödüller Bölümü */}
      <section className="py-20 px-6 bg-zinc-900/30 border-y border-zinc-800 my-12">
        <h2 className="text-4xl font-black italic text-center mb-16 text-yellow-500 uppercase">Turnuva Ödülleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-8 border border-yellow-500/20 rounded-3xl bg-black/50 transform hover:-translate-y-2 transition">
            <div className="text-6xl mb-6">🥇</div>
            <h3 className="text-2xl font-black text-yellow-500 mb-2">10.000 TL</h3>
            <p className="text-zinc-400 uppercase font-bold text-sm tracking-widest">Şampiyonluk</p>
          </div>
          <div className="text-center p-8 border border-zinc-800 rounded-3xl bg-black/50 transform hover:-translate-y-2 transition">
            <div className="text-6xl mb-6">🥈</div>
            <h3 className="text-2xl font-black mb-2">5.000 TL</h3>
            <p className="text-zinc-400 uppercase font-bold text-sm tracking-widest">İkincilik</p>
          </div>
          <div className="text-center p-8 border border-zinc-800 rounded-3xl bg-black/50 transform hover:-translate-y-2 transition">
            <div className="text-6xl mb-6">🥉</div>
            <h3 className="text-2xl font-black mb-2">Sürpriz Paket</h3>
            <p className="text-zinc-400 uppercase font-bold text-sm tracking-widest">Üçüncülük</p>
          </div>
        </div>
      </section>

      {/* Sponsorlar Bölümü */}
      <section className="py-16 px-6 opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-center text-zinc-600 uppercase tracking-[0.3em] text-[10px] font-bold mb-12">Resmi Destekçilerimiz</p>
        <div className="flex flex-wrap justify-center gap-16 grayscale invert brightness-200">
          <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse"></div> {/* Logo Placeholder */}
          <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse"></div> {/* Logo Placeholder */}
          <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse"></div> {/* Logo Placeholder */}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-zinc-900 text-zinc-600 text-xs tracking-widest uppercase">
        © 2026 Altın Pota 3x3 Turnuvası | Pendik / İstanbul
      </footer>
    </div>
  );
}