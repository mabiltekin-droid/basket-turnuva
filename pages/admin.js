import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('maclar');
  const [maclar, setMaclar] = useState([]);
  const [takimlar, setTakimlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yildizlar, setYildizlar] = useState({ takim_adi: '', mvp_isim: '', mvp_istatistik: '', takim_skor_ozet: '' });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // BURAYI GÜNCELLE: Sadece bu mail admin paneline girebilir
      const adminEmail = "senin-mailin@gmail.com"; 

      if (!session || session.user.email !== adminEmail) {
        // Eğer admin değilse ana sayfaya yönlendir
        window.location.href = "/";
      } else {
        setLoading(false);
        fetchData();
      }
    };
    checkAdmin();
  }, []);

  async function fetchData() {
    const { data: m } = await supabase.from('maclar').select('*').order('saat', { ascending: true });
    const { data: t } = await supabase.from('basvurular').select('*').order('takim_adi', { ascending: true });
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
    await supabase.from('haftanin_yildizlari').upsert({ id: 1, ...yildizlar });
    alert("Vitrin güncellendi!");
  };

  if (loading) return <div className="bg-black min-h-screen flex items-center justify-center text-yellow-500 font-black">YETKİ KONTROLÜ...</div>;

  return (
    <div className="bg-zinc-950 min-h-screen text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-zinc-900 pb-6">
          <h1 className="text-2xl font-black italic text-yellow-500 uppercase tracking-tighter">ADMİN PANELİ</h1>
          <button onClick={() => window.location.href = '/'} className="bg-white text-black text-[10px] font-bold px-4 py-2 rounded-lg uppercase">Siteye Dön</button>
        </header>

        <div className="flex gap-2 mb-8 bg-zinc-900 p-1 rounded-xl w-fit">
          {['maclar', 'takimlar', 'yildizlar'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition ${activeTab === t ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}>
              {t === 'maclar' ? 'Maçlar' : t === 'takimlar' ? 'Puanlar' : 'Vitrin'}
            </button>
          ))}
        </div>

        {activeTab === 'maclar' && (
          <div className="grid gap-3">
            {maclar.map(mac => (
              <div key={mac.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-wrap justify-between items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{mac.saat}</p>
                  <p className="font-black italic uppercase">{mac.takim_a} vs {mac.takim_b}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <input type="number" defaultValue={mac.takim_a_skor} onBlur={(e) => updateMatch(mac.id, 'takim_a_skor', e.target.value)} className="w-12 bg-black border border-zinc-800 p-2 rounded-lg text-center font-bold text-yellow-500" />
                  <span className="text-zinc-700">-</span>
                  <input type="number" defaultValue={mac.takim_b_skor} onBlur={(e) => updateMatch(mac.id, 'takim_b_skor', e.target.value)} className="w-12 bg-black border border-zinc-800 p-2 rounded-lg text-center font-bold text-yellow-500" />
                </div>
                <select value={mac.durum} onChange={(e) => updateMatch(mac.id, 'durum', e.target.value)} className="bg-black border border-zinc-800 p-2 rounded-lg text-[10px] font-bold outline-none">
                  <option value="bekliyor">BEKLİYOR</option>
                  <option value="canli">CANLI</option>
                  <option value="tamamlandi">BİTTİ</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'takimlar' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-800/50 text-zinc-500 uppercase font-black">
                <tr>
                  <th className="p-4">Takım Adı</th>
                  <th className="p-4 text-center">G</th>
                  <th className="p-4 text-center">M</th>
                  <th className="p-4 text-center">Puan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {takimlar.map(t => (
                  <tr key={t.id}>
                    <td className="p-4 font-bold uppercase">{t.takim_adi}</td>
                    <td className="p-4 text-center"><input type="number" defaultValue={t.galibiyet} onBlur={(e) => updateTeamStats(t.id, 'galibiyet', e.target.value)} className="w-12 bg-black border border-zinc-800 p-1 rounded text-center" /></td>
                    <td className="p-4 text-center"><input type="number" defaultValue={t.maglubiyet} onBlur={(e) => updateTeamStats(t.id, 'maglubiyet', e.target.value)} className="w-12 bg-black border border-zinc-800 p-1 rounded text-center" /></td>
                    <td className="p-4 text-center font-black text-yellow-500"><input type="number" defaultValue={t.puan} onBlur={(e) => updateTeamStats(t.id, 'puan', e.target.value)} className="w-12 bg-black border border-zinc-800 p-1 rounded text-center" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'yildizlar' && (
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-xl mx-auto">
            <h3 className="text-lg font-black italic uppercase mb-6 text-yellow-500">Haftanın Vitrini</h3>
            <div className="space-y-4">
              <input placeholder="Haftanın Takımı" value={yildizlar.takim_adi} onChange={e => setYildizlar({...yildizlar, takim_adi: e.target.value.toUpperCase()})} className="w-full bg-black border border-zinc-800 p-4 rounded-xl outline-none" />
              <input placeholder="MVP İsim" value={yildizlar.mvp_isim} onChange={e => setYildizlar({...yildizlar, mvp_isim: e.target.value})} className="w-full bg-black border border-zinc-800 p-4 rounded-xl outline-none" />
              <input placeholder="MVP İstatistik" value={yildizlar.mvp_istatistik} onChange={e => setYildizlar({...yildizlar, mvp_istatistik: e.target.value})} className="w-full bg-black border border-zinc-800 p-4 rounded-xl outline-none" />
              <button onClick={saveStars} className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl uppercase italic hover:bg-white transition">Güncelle</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}