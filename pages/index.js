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
  const [timeLeft, setTimeLeft] = useState("");

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
          .maybeSingle();
        
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

    const target = new Date("2026-06-15T10:00:00");
    const timer = setInterval(() => {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) { setTimeLeft("TURNUVA BAŞLADI!"); clearInterval(timer); }
      else {
        const gun = Math.floor(diff / (1000 * 60 * 60 * 24));
        const saat = Math.floor((diff / (1000 * 60 * 60)) % 24);
        setTimeLeft(`${gun} GÜN ${saat} SAAT KALDI`);
      }
    }, 1000);
    return () => clearInterval(timer);
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
    if (!pickerInput) return alert("Lütfen kayıtlı takım adını girin!");
    
    // VİDEODAKİ SORUNU ÇÖZEN GÜNCELLEME:
    // ilike kullanarak büyük/küçük harf duyarlılığını ortadan kaldırıyoruz
    const { data: teams, error: fetchError } = await supabase
      .from('basvurular')
      .select('*')
      .ilike('takim_adi', pickerInput); // 'DD' ile 'dd' fark etmez

    if (fetchError || !teams || teams.length === 0) {
      return alert("Bu isimde bir takım bulunamadı. Lütfen tam adı girin.");
    }

    // Boşta olan (henüz mail atanmamış) ilk takımı bul
    const targetTeam = teams.find(t => !t.kaptan_email);
    
    if (!targetTeam) {
      return alert("Bu takım zaten bir kaptan hesabı ile eşleşmiş.");
    }

    const { error: updateError } = await supabase
      .from('basvurular')
      .update({ kaptan_email: user.email })
      .eq('id', targetTeam.id);
    
    if (!updateError) {
      alert(`Başarılı! ${targetTeam.takim_adi} takımı artık hesabına bağlı.`);
      window.location.reload();
    } else {
      console.error("Hata Detayı:", updateError);
      alert("Hata: " + updateError.message);
    }
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-yellow-500 selection:text-black">
      {/* Üst Bilgi */}
      <div className="bg-yellow-500 text-black text-[10px] font-bold py-1 text-center uppercase tracking-[0.3em]">
        🕒 {timeLeft || "YÜKLENİYOR..."}
      </div>

      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-3xl font-black italic text-yellow-500 tracking-tighter uppercase">Altın Pota</h1>
        <div className="flex gap-4 items-center">
          {user ? (
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-tighter">Kaptan: {myTeam || "Bağlanıyor..."}</span>
              <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-red-500 text-[10px] font-bold border-l border-zinc-700 pl-3 uppercase">Çıkış</button>
            </div>
          ) : (
            <Link href="/admin" className="bg-zinc-900 border border-zinc-800 px-6 py-2 rounded-full font-black text-xs hover:text-yellow-500 transition uppercase tracking-widest">Giriş Yap</Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="py-20 text-center px-6 relative">
        <h2 className="text-6xl md:text-9xl font-black italic leading-none mb-6 tracking-tighter uppercase">Sokağın <br/> <span className="text-yellow-500">Gücü</span></h2>
        {!user && (
          <Link href="/kayit" className="inline-block bg-white text-black px-12 py-5 rounded-2xl font-black text-xl hover:bg-yellow-500 transition uppercase italic">Kayıt Ol</Link>
        )}
      </header>

      {/* Takım Bağlama Modalı */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-yellow-500/30 p-10 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl">
            <h2 className="text-2xl font-black mb-2 italic uppercase">Takımını Onayla</h2>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed italic">Hoş geldin kaptan! Giriş yaptın ancak hangi takımın senin olduğunu henüz bilmiyoruz.</p>
            <input 
              value={pickerInput}
              onChange={(e) => setPickerInput(e.target.value)}
              placeholder="Kayıtlı Takım Adı" 
              className="w-full bg-black border border-zinc-800 p-5 rounded-2xl mb-4 text-center text-xl font-black outline-none focus:border-yellow-500 transition-all uppercase" 
            />
            <button onClick={handlePickTeam} className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl text-lg hover:bg-white transition uppercase italic">Kaptanlığı Al</button>
          </div>
        </div>
      )}

      {/* Dashboard */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {myMatch && (
          <div className="mb-20">
            <h4 className="text-yellow-500 font-black italic mb-6 tracking-widest text-center uppercase text-sm italic underline decoration-yellow-500/20 underline-offset-8">Senin Sıradaki Maçın</h4>
            <div className="max-w-2xl mx-auto">
              <MatchCard match={myMatch} />
            </div>
          </div>
        )}

        {/* Tab Menü */}
        <div className="flex justify-center gap-2 mb-16 bg-zinc-900/50 p-2 rounded-3xl w-fit mx-auto border border-zinc-800">
          {['program', 'agac', 'kurallar'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-8 md:px-12 py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase transition-all ${tab === t ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}>
              {t === 'program' ? 'Fikstür' : t === 'agac' ? 'Ağaç' : 'Kurallar'}
            </button>
          ))}
        </div>

        {/* Listeler */}
        <div className="min-h-[400px]">
          {tab === 'program' && (
            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-500">
              {maclar.map(mac => <MatchCard key={mac.id} match={mac} />)}
            </div>
          )}
          {tab === 'kurallar' && (
            <div className="max-w-3xl mx-auto space-y-4 animate-in slide-in-from-left-4 duration-500">
              {kurallar.map(kural => (
                <details key={kural.id} className="group bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
                  <summary className="p-8 cursor-pointer font-black italic flex justify-between items-center group-open:text-yellow-500 uppercase transition text-sm">
                    {kural.baslik}
                    <span className="text-yellow-500 transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="px-8 pb-8 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/50 pt-4">{kural.icerik}</div>
                </details>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="py-20 text-center border-t border-zinc-900 opacity-50">
        <p className="text-zinc-700 text-[10px] font-bold tracking-[1em] uppercase">Altın Pota 2026</p>
      </footer>
    </div>
  );
}