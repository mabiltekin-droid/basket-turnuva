import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('maclar');
  const [maclar, setMaclar] = useState([]);
  const [takimlar, setTakimlar] = useState([]);
  const [yildizlar, setYildizlar] = useState({ takim_adi: '', mvp_isim: '', mvp_istatistik: '', takim_skor_ozet: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: m } = await supabase.from('maclar').select('*').order('saat', { ascending: true });
    const { data: t } = await supabase.from('basvurular').select('*').order('takim_adi', { ascending: true });
    const { data: y } = await supabase.from('haftanin_yildizlari').select('*').eq('id', 1).maybeSingle();
    setMaclar(m || []);
    setTakimlar(t || []);
    if (y) setYildizlar(y);
  }

  // MAÇ GÜNCELLEME (Skor ve Durum)
  const updateMatch = async (id, field, value) => {
    await supabase.from('maclar').update({ [field]: value }).eq('id', id);
    fetchData();
  };

  // PUAN DURUMU GÜNCELLEME
  const updateTeamStats = async (id, field, value) => {
    await supabase.from('basvurular').update({ [field]: parseInt(value) }).eq('id', id);
    fetchData();
  };

  // HAFTANIN YILDIZLARINI KAYDET
  const saveStars = async () => {
    const { error } = await supabase.from('haftanin_yildizlari').upsert({ id: 1, ...yildizlar });
    if (!error) alert("Haftanın yıldızları güncellendi!");
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-white p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black italic text-yellow-500 uppercase tracking-tighter text-center md:text-left">KONTROL PANELİ</h1>
          <button onClick={() => window.location.href = '/'} className="text-xs font-bold border border-zinc-800 px-4 py-2 rounded-xl hover:bg-white hover:text-black transition uppercase">Siteye Dön</button>
        </header>

        {/* Tab Menü */}
        <div className="flex gap-2 mb-8 bg-zinc-900 p-1.5 rounded-2xl w-fit">
          {['maclar', 'takimlar', 'yildizlar'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition ${activeTab === t ? 'bg-yellow-500 text-black' : 'text-zinc-500'}`}>
              {t === 'maclar' ? 'Maç Yönetimi' : t === 'takimlar' ? 'Puan Durumu' : 'Vitrin'}
            </button>
          ))}
        </div>

        {/* MAÇ YÖNETİMİ */}
        {activeTab === 'maclar' && (
          <div className="grid gap-4">
            {maclar.map(mac => (
              <div key={mac.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-yellow-500 mb-1">{mac.saat} - {mac.durum.toUpperCase()}</p>
                  <p className="font-bold text-lg">{mac.takim_a} vs {mac.takim_b}</p>
                </div>
                
                <div className="flex gap-4 items-center">
                  <input type="number" defaultValue={mac.takim_a_skor} onBlur={(e) => updateMatch(mac.id, 'takim_a_skor', e.target.value)} className="w-16 bg-black border border-zinc-800 p-2 rounded-xl text-center font-bold" />
                  <span className="text-zinc-600">-</span>
                  <input type="number" defaultValue={mac.takim_b_skor} onBlur={(e) => updateMatch(mac.id, 'takim_b_skor', e.target.value)} className="w-16 bg-black border border-zinc-800 p-2 rounded-xl text-center font-bold" />
                </div>

                <select value={mac.durum} onChange={(e) => updateMatch(mac.id, 'durum', e.target.value)} className="bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold outline-none">
                  <option value="bekliyor">BEKLİYOR</option>
                  <option value="canli">CANLI</option>
                  <option value="tamamlandi">BİTTİ</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {/* TAKIM VE PUAN YÖNETİMİ */}
        {activeTab === 'takimlar' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase font-black">
                <tr>
                  <th className="p-6">Takım</th>
                  <th className="p-6">Galibiyet</th>
                  <th className="p-6">Mağlubiyet</th>
                  <th className="p-6">Puan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {takimlar.map(t => (
                  <tr key={t.id}>
                    <td className="p-6 font-bold">{t.takim_adi}</td>
                    <td className="p-6"><input type="number" defaultValue={t.galibiyet} onBlur={(e) => updateTeamStats(t.id, 'galibiyet', e.target.value)} className="w-16 bg-black border border-zinc-800 p-2 rounded-lg text-center" /></td>
                    <td className="p-6"><input type="number" defaultValue={t.maglubiyet} onBlur={(e) => updateTeamStats(t.id, 'maglubiyet', e.target.value)} className="w-16 bg-black border border-zinc-800 p-2 rounded-lg text-center" /></td>
                    <td className="p-6"><input type="number" defaultValue={t.puan} onBlur={(e) => updateTeamStats(t.id, 'puan', e.target.value)} className="w-16 bg-black border border-zinc-800 p-2 rounded-lg text-center text-yellow-500 font-bold" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VİTRİN YÖNETİMİ (Haftanın Yıldızları) */}
        {activeTab === 'yildizlar' && (
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-black italic uppercase text-yellow-500 mb-6">Vitrin Bilgilerini Düzenle</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2">Haftanın Takımı</label>
                <input value={yildizlar.takim_adi} onChange={e => setYildizlar({...yildizlar, takim_adi: e.target.value})} className="w-full bg-black border border-zinc-800 p-4 rounded-2xl outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2">MVP İsim</label>
                <input value={yildizlar.mvp_isim} onChange={e => setYildizlar({...yildizlar, mvp_isim: e.target.value})} className="w-full bg-black border border-zinc-800 p-4 rounded-2xl outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2">MVP İstatistik (Örn: 15 Sayı - 4 Blok)</label>
                <input value={yildizlar.mvp_istatistik} onChange={e => setYildizlar({...yildizlar, mvp_istatistik: e.target.value})} className="w-full bg-black border border-zinc-800 p-4 rounded-2xl outline-none focus:border-yellow-500" />
              </div>
              <button onClick={saveStars} className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl uppercase italic text-lg hover:bg-white transition shadow-xl shadow-yellow-500/10">Bilgileri Güncelle</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}