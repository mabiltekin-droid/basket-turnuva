import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('maclar');
  const [maclar, setMaclar] = useState([]);
  const [takimlar, setTakimlar] = useState([]);
  const [yildizlar, setYildizlar] = useState({ takim_adi: '', mvp_isim: '', mvp_istatistik: '' });

  const ADMIN_EMAIL = "m.a.biltekin@gmail.com"; 

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin + '/admin' }
        });
      } else if (session.user.email !== ADMIN_EMAIL) {
        alert("Yetkisiz erişim! Sadece m.a.biltekin@gmail.com girebilir.");
        window.location.href = "/";
      } else {
        setUser(session.user);
        fetchData();
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  async function fetchData() {
    const { data: m } = await supabase.from('maclar').select('*').order('saat', { ascending: true });
    const { data: t } = await supabase.from('basvurular').select('*').order('puan', { descending: true });
    const { data: y } = await supabase.from('haftanin_yildizlari').select('*').eq('id', 1).maybeSingle();
    setMaclar(m || []);
    setTakimlar(t || []);
    if (y) setYildizlar(y);
  }

  const updateMatch = async (id, field, value) => {
    await supabase.from('maclar').update({ [field]: value }).eq('id', id);
    fetchData();
  };

  const updateTeamStats = async (id, field, value) => {
    await supabase.from('basvurular').update({ [field]: parseInt(value) }).eq('id', id);
    fetchData();
  };

  const saveStars = async () => {
    const { error } = await supabase.from('haftanin_yildizlari').upsert({ id: 1, ...yildizlar });
    if (!error) alert("Vitrin Başarıyla Güncellendi!");
  };

  if (loading) return (
    <div className="bg-black min-h-screen flex items-center justify-center">
      <div className="text-yellow-500 font-black text-2xl animate-pulse italic uppercase tracking-widest">Sistem Yükleniyor...</div>
    </div>
  );

  return (
    <div className="bg-zinc-950 min-h-screen text-white font-sans p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-zinc-900 pb-8 uppercase">
          <div>
            <h1 className="text-4xl font-black italic text-yellow-500 tracking-tighter">Admin Panel</h1>
            <p className="text-zinc-500 text-[10px] font-bold tracking-[0.3em]">Hoş Geldin, m.a.biltekin</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.location.href = '/'} className="px-6 py-3 border border-zinc-800 rounded-2xl text-[10px] font-black hover:bg-white hover:text-black transition">SİTEYE DÖN</button>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="px-6 py-3 bg-red-600 rounded-2xl text-[10px] font-black hover:bg-red-500 transition">GÜVENLİ ÇIKIŞ</button>
          </div>
        </header>

        {/* TAB NAVIGATION */}
        <div className="flex flex-wrap gap-2 mb-10 bg-zinc-900 p-2 rounded-[2rem] w-fit border border-zinc-800">
          {['maclar', 'takimlar', 'vitrin'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-yellow-500 text-black shadow-xl shadow-yellow-500/20 scale-105' : 'text-zinc-500 hover:text-white'}`}
            >
              {tab === 'maclar' ? 'Maç Yönetimi' : tab === 'takimlar' ? 'Puan Durumu & Oyuncular' : 'Vitrin Ayarları'}
            </button>
          ))}
        </div>

        {/* 1. MAÇ YÖNETİMİ TAB */}
        {activeTab === 'maclar' && (
          <div className="grid gap-4 animate-in fade-in duration-500">
            {maclar.map(mac => (
              <div key={mac.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] flex flex-col lg:flex-row justify-between items-center gap-6 group hover:border-yellow-500/30 transition">
                <div className="text-center lg:text-left flex-1">
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-3 py-1 rounded-full mb-3 inline-block">{mac.saat}</span>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">{mac.takim_a} <span className="text-zinc-700 mx-2">VS</span> {mac.takim_b}</h3>
                </div>
                
                <div className="flex items-center gap-4 bg-black p-4 rounded-3xl border border-zinc-800">
                  <div className="flex flex-col items-center">
                    <label className="text-[8px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">TAKIM A</label>
                    <input 
                      type="number" 
                      defaultValue={mac.takim_a_skor} 
                      onBlur={(e) => updateMatch(mac.id, 'takim_a_skor', e.target.value)}
                      className="w-16 bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-center font-black text-yellow-500 text-xl outline-none focus:border-yellow-500"
                    />
                  </div>
                  <span className="text-2xl font-black text-zinc-800 mt-4">-</span>
                  <div className="flex flex-col items-center">
                    <label className="text-[8px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">TAKIM B</label>
                    <input 
                      type="number" 
                      defaultValue={mac.takim_b_skor} 
                      onBlur={(e) => updateMatch(mac.id, 'takim_b_skor', e.target.value)}
                      className="w-16 bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-center font-black text-yellow-500 text-xl outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full lg:w-48">
                  <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center">MAÇ DURUMU</label>
                  <select 
                    value={mac.durum} 
                    onChange={(e) => updateMatch(mac.id, 'durum', e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-yellow-500 cursor-pointer"
                  >
                    <option value="bekliyor">BEKLİYOR</option>
                    <option value="canli">CANLI (FLASH)</option>
                    <option value="tamamlandi">TAMAMLANDI</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. PUAN DURUMU & OYUNCULAR TAB */}
        {activeTab === 'takimlar' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-800/50 text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                  <tr>
                    <th className="p-8">Takım Detayı</th>
                    <th className="p-8 text-center">G</th>
                    <th className="p-8 text-center">M</th>
                    <th className="p-8 text-center">Puan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {takimlar.map(t => (
                    <tr key={t.id} className="hover:bg-black/20 transition">
                      <td className="p-8">
                        <p className="font-black text-xl italic uppercase text-white mb-1 tracking-tighter">{t.takim_adi}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">{t.oyuncu_1}, {t.oyuncu_2}, {t.oyuncu_3}, {t.oyuncu_4}</p>
                      </td>
                      <td className="p-8 text-center">
                        <input type="number" defaultValue={t.galibiyet} onBlur={(e) => updateTeamStats(t.id, 'galibiyet', e.target.value)} className="w-14 bg-black border border-zinc-800 p-3 rounded-xl text-center font-bold" />
                      </td>
                      <td className="p-8 text-center">
                        <input type="number" defaultValue={t.maglubiyet} onBlur={(e) => updateTeamStats(t.id, 'maglubiyet', e.target.value)} className="w-14 bg-black border border-zinc-800 p-3 rounded-xl text-center font-bold" />
                      </td>
                      <td className="p-8 text-center">
                        <input type="number" defaultValue={t.puan} onBlur={(e) => updateTeamStats(t.id, 'puan', e.target.value)} className="w-16 bg-black border border-yellow-500/20 p-3 rounded-xl text-center font-black text-yellow-500 text-lg" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. VİTRİN AYARLARI TAB */}
        {activeTab === 'vitrin' && (
          <div className="max-w-2xl mx-auto animate-in zoom-in duration-500">
            <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[4rem] shadow-2xl space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black italic text-yellow-500 uppercase tracking-tighter">Vitrin Düzenle</h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2 underline decoration-yellow-500/30">Haftanın en iyilerini ana sayfaya taşı</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-widest">Haftanın Takımı</label>
                  <input 
                    value={yildizlar.takim_adi} 
                    onChange={e => setYildizlar({...yildizlar, takim_adi: e.target.value.toUpperCase()})}
                    className="w-full bg-black border border-zinc-800 p-5 rounded-[2rem] outline-none focus:border-yellow-500 font-black italic uppercase tracking-tighter text-lg transition-all"
                    placeholder="ÖRN: LOS ANGELES LAKERS"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-widest">Haftanın MVP'si</label>
                    <input 
                      value={yildizlar.mvp_isim} 
                      onChange={e => setYildizlar({...yildizlar, mvp_isim: e.target.value})}
                      className="w-full bg-black border border-zinc-800 p-5 rounded-[2rem] outline-none focus:border-yellow-500 font-bold uppercase text-sm"
                      placeholder="Oyuncu İsmi"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-widest">MVP İstatistik</label>
                    <input 
                      value={yildizlar.mvp_istatistik} 
                      onChange={e => setYildizlar({...yildizlar, mvp_istatistik: e.target.value})}
                      className="w-full bg-black border border-zinc-800 p-5 rounded-[2rem] outline-none focus:border-yellow-500 font-bold text-sm"
                      placeholder="Örn: 24 Sayı, 5 Ribaund"
                    />
                  </div>
                </div>

                <button 
                  onClick={saveStars}
                  className="w-full bg-yellow-500 text-black font-black py-6 rounded-[2.5rem] uppercase italic text-xl hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_50px_rgba(234,179,8,0.2)]"
                >
                  GÜNCELLEMELERİ YAYINLA
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}