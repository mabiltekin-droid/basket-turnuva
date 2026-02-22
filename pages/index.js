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
        // Takım kontrolü
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

    // Geri Sayım Sayacı
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

  // VİDEODAKİ HATAYI ÇÖZEN FONKSİYON
  const handlePickTeam = async () => {
    if (!pickerInput) return alert("Lütfen kayıtlı takım adını girin!");
    
    // 1. Önce bu isimde bir takım var mı kontrol et
    const { data: existingTeam } = await supabase
      .from('basvurular')
      .select('takim_adi, kaptan_email')
      .eq('takim_adi', pickerInput)
      .maybeSingle();

    if (!existingTeam) {
      return alert("Bu isimde bir takım kaydı bulunamadı. Lütfen büyük/küçük harfe dikkat ederek tam yazın.");
    }

    if (existingTeam.kaptan_email) {
      return alert("Bu takım zaten başka bir kaptan hesabı ile eşleşmiş.");
    }

    // 2. Takımı kaptana bağla
    const { error } = await supabase
      .from('basvurular')
      .update({ kaptan_email: user.email })
      .eq('takim_adi', pickerInput);
    
    if (!error) {
      alert(`Tebrikler Kaptan! ${pickerInput} takımı başarıyla hesabına bağlandı.`);
      window.location.reload();
    } else {
      alert("Bağlantı sırasında bir hata oluştu: " + error.message);
    }
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-yellow-500 selection:text-black">
      
      {/* Üst Bilgi Bandı */}
      <div className="bg-yellow-500 text-black text-[10px] font-bold py-1 text-center uppercase tracking-[0.3em]">
        🔥 KAYITLAR DEVAM EDİYOR - PENDİK SAHİL ETKİNLİK ALANI
      </div>

      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-3xl font-black italic text-yellow-500 tracking-tighter">ALTIN POTA</h1>
        <div className="flex gap-4 items-center">
          {user ? (
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-tighter">Kaptan: {myTeam || "Bağlanıyor..."}</span>
              <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-red-500 text-[10px] font-bold border-l border-zinc-700 pl-3">ÇIKIŞ</button>
            </div>
          ) : (
            <Link href="/admin" className="bg-zinc-900 border border-zinc-800 px-6 py-2 rounded-full font-black text-xs hover:text-yellow-500 transition uppercase">GİRİŞ YAP</Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="py-20 text-center px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10">
          <div className="inline-block bg-zinc-900 border border-zinc-800 text-yellow-500 px-6 py-2 rounded-full font-black text-xs mb-8 tracking-widest uppercase">
            🕒 {timeLeft || "HAZIRLANIYOR..."}
          </div>
          <h2 className="text-6xl md:text-9xl font-black italic leading-none mb-6 tracking-tighter uppercase">
            SOKAĞIN <br/> <span className="text-yellow-500">GÜCÜ</span>
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto mb-10 text-sm">Takımını kur, Pendik sahilinde efsanelerin arasına adını yazdır.</p>
          {!user && (
            <Link href="/kayit" className="inline-block bg-white text-black px-12 py-5 rounded-2xl font-black text-xl hover:bg-yellow-500 transition shadow-[0_10px_40px_rgba(255,255,255,0.1)]">KAYDINI TAMAMLA</Link>
          )}
        </div>
      </header>

      {/* Takım Bağlama Modalı (VİDEODAKİ EKRAN) */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-yellow-500/30 p-10 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl">
            <div className="text-5xl mb-6">🏀</div>
            <h2 className="text-2xl font-black mb-2 italic uppercase">Takımını Onayla</h2>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Giriş yaptın kaptan! Ancak kayıt ettiğin takımı bulup seninle eşleştirmemiz gerekiyor.</p>
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

      {/* Dashboard & Maçlar */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {myMatch && (
          <div className="mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h4 className="text-yellow-500 font-black italic mb-6 tracking-widest text-center uppercase text-sm">-- SIRADAKİ MAÇIN --</h4>
            <div className="max-w-2xl mx-auto">
              <MatchCard match={myMatch} />
            </div>
          </div>
        )}

        {/* Tab Menü */}
        <div className="flex justify-center gap-2 mb-16 bg-zinc-900/50 p-2 rounded-3xl w-fit mx-auto border border-zinc-800">
          {['program', 'agac', 'kurallar'].map((t) => (
            <button 
              key={t}
              onClick={() => setTab(t)}
              className={`px-8 md:px-12 py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase transition-all ${tab === t ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              {t === 'program' ? 'FİKSTÜR' : t === 'agac' ? 'AĞAÇ' : 'KURALLAR'}
            </button>
          ))}
        </div>

        {/* İçerik Alanı */}
        <div className="min-h-[400px]">
          {tab === 'program' && (
            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-500">
              {maclar.length > 0 ? maclar.map(mac => <MatchCard key={mac.id} match={mac} />) : <p className="text-center text-zinc-600 py-20 col-span-2 italic">Henüz maç programı girilmedi...</p>}
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

      {/* Ödüller */}
      <section className="py-32 px-6 border-t border-zinc-900 bg-zinc-950/50">
        <h2 className="text-center text-4xl font-black italic mb-20 uppercase tracking-tighter">ÖDÜL HAVUZU</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
           <div className="text-center group">
              <div className="text-7xl mb-6 grayscale group-hover:grayscale-0 transition duration-500">🥇</div>
              <p className="text-yellow-500 text-xs font-black uppercase tracking-widest mb-3">ŞAMPİYON TAKIM</p>
              <p className="text-4xl font-black italic">10.000 TL</p>
           </div>
           <div className="text-center border-y md:border-y-0 md:border-x border-zinc-800 py-10 md:py-0">
              <div className="text-7xl mb-6">🎖️</div>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-3">EN DEĞERLİ OYUNCU</p>
              <p className="text-4xl font-black italic uppercase">MVP ÖDÜLÜ</p>
           </div>
           <div className="text-center group">
              <div className="text-7xl mb-6 grayscale group-hover:grayscale-0 transition duration-500">🍕</div>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-3">TÜM KATILIMCILAR</p>
              <p className="text-4xl font-black italic uppercase">FOOD PASS</p>
           </div>
        </div>
      </section>

      <footer className="py-20 text-center border-t border-zinc-900">
        <p className="text-zinc-700 text-[10px] font-bold tracking-[1em] uppercase mb-4">ALTIN POTA 3X3</p>
        <p className="text-zinc-800 text-[8px] uppercase tracking-widest">© 2026 Pendik / İstanbul - Tüm Hakları Saklıdır.</p>
      </footer>

    </div>
  );
}