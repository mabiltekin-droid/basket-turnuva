import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminPortal() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('maclar');
  const [maclar, setMaclar] = useState([]);
  const [takimlar, setTakimlar] = useState([]);
  const [yildizlar, setYildizlar] = useState({ takim_adi: '', mvp_isim: '', mvp_istatistik: '' });

  // !!! BURAYI KENDİ ADMİN MAİLİNLE DEĞİŞTİR !!!
  const ADMIN_EMAIL = "senin-mailin@gmail.com"; 

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      if (session.user.email === ADMIN_EMAIL) fetchData();
    }
    setLoading(false);
  }

  async function fetchData() {
    const { data: m } = await supabase.from('maclar').select('*').order('saat', { ascending: true });
    const { data: t } = await supabase.from('basvurular').select('*').order('takim_adi', { ascending: true });
    const { data: y } = await supabase.from('haftanin_yildizlari').select('*').eq('id', 1).maybeSingle();
    setMaclar(m || []);
    setTakimlar(t || []);
    if (y) setYildizlar(y);
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/admin' }
    });
  };

  const updateMatch = async (id, field, value) => {
    await supabase.from('maclar').update({ [field]: value }).eq('id', id);
    fetchData();
  };

  if (loading) return <div className="bg-black min-h-screen flex items-center justify-center text-yellow-500 font-black italic uppercase tracking-widest">Sistem Yükleniyor...</div>;

  // --- DURUM 1: GİRİŞ YAPILMAMIŞSA VEYA ROL SEÇİMİ ---
  if (!user) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
        <div className="max-w-md w-full text-center">
          <h1 className="text-5xl font-black italic text-yellow-500 mb-12 uppercase tracking-tighter">GİRİŞ YAP</h1>
          <div className="grid gap-4">
            <button onClick={handleLogin} className="group bg-white hover:bg-yellow-500 transition-all p-8 rounded-[2.5rem] text-black flex flex-col items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Turnuva Katılımcısı</span>
              <span className="text-2xl font-black italic uppercase group-hover:scale-105 transition">KAPTAN GİRİŞİ</span>
            </button>
            <button onClick={handleLogin} className="group bg-zinc-900 border border-zinc-800 hover:border-yellow-500 transition-all p-8 rounded-[2.5rem] flex flex-col items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Organizasyon</span>
              <span className="text-2xl font-black italic uppercase group-hover:text-yellow-500 transition">ADMİN PANELİ</span>
            </button>
          </div>
          <button onClick={() => window.location.href = '/'} className="mt-8 text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition">Geri Dön</button>
        </div>
      </div>
    );
  }

  // --- DURUM 2: KAPTAN GİRİŞİ (ADMİN DEĞİLSE) ---
  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center p-6 text-center">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem] shadow-2xl">
          <div className="text-5xl mb-6">🏀</div>
          <h1 className="text-2xl font-black text-yellow-500 mb-2 uppercase italic">KAPTAN DOĞRULANDI</h1>
          <p className="text-zinc-500 text-sm mb-8 max-w-xs mx-auto">Başarıyla giriş yaptın. Dashboard üzerinden takımını yönetebilirsin.</p>
          <button onClick={() => window.location.href = '/'} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase italic hover:bg-yellow-500 transition">Dashboard'a Git</button>
        </div>
      </div>
    );
  }

  // --- DURUM 3: ADMİN PANELİ ---
  return (
    <div className="bg-zinc-950 min-h-screen text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-zinc-900 pb-6 uppercase italic">
          <h1 className="text-2xl font-black text-yellow-500">Yönetim</h1>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[10px] font-bold bg-zinc-900 px-4 py-2 rounded-lg">Güvenli Çıkış</button>
        </header>

        <div className="flex gap-2 mb-8 bg-zinc-900 p-1 rounded-xl w-fit">
          {['maclar', 'takimlar', 'vitrin'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition ${activeTab === t ? 'bg-yellow-500 text-black' : 'text-zinc-500'}`}>
              {t}
            </button>
          ))}
        </div>

        {activeTab === 'maclar' && (
          <div className="grid gap-3">
            {maclar.map(mac => (
              <div key={mac.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex justify-between items-center">
                <p className="font-black italic uppercase text-sm">{mac.takim_a} - {mac.takim_b}</p>
                <div className="flex gap-2">
                  <input type="number" defaultValue={mac.takim_a_skor} onBlur={(e) => updateMatch(mac.id, 'takim_a_skor', e.target.value)} className="w-12 bg-black border border-zinc-800 p-2 rounded text-center text-yellow-500 font-bold" />
                  <input type="number" defaultValue={mac.takim_b_skor} onBlur={(e) => updateMatch(mac.id, 'takim_b_skor', e.target.value)} className="w-12 bg-black border border-zinc-800 p-2 rounded text-center text-yellow-500 font-bold" />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Diğer Tablar (Takım Puanları ve Vitrin) Burada fetchlanabilir */}
      </div>
    </div>
  );
}