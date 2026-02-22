import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Kayit() {
  const [form, setForm] = useState({ takim_adi: '', oyuncu_1: '', oyuncu_2: '', oyuncu_3: '', telefon: '' });
  const [mesaj, setMesaj] = useState('');

  const gonder = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('basvurular').insert([form]);
    if (error) setMesaj("Hata oluştu!");
    else {
      setMesaj("Kayıt Başarılı! Takımına başarılar dileriz.");
      setForm({ takim_adi: '', oyuncu_1: '', oyuncu_2: '', oyuncu_3: '', telefon: '' });
    }
  };

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <Link href="/" className="text-yellow-500 mb-8 inline-block">← Ana Sayfaya Dön</Link>
      <div className="max-w-md mx-auto bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
        <h2 className="text-3xl font-black mb-6 italic">TAKIM KAYIT FORMU</h2>
        <form onSubmit={gonder} className="space-y-4">
          <input required placeholder="Takım Adı" className="w-full bg-black border border-zinc-700 p-3 rounded-xl focus:border-yellow-500 outline-none" 
            onChange={e => setForm({...form, takim_adi: e.target.value})} value={form.takim_adi} />
          <input required placeholder="1. Oyuncu (Kaptan)" className="w-full bg-black border border-zinc-700 p-3 rounded-xl focus:border-yellow-500 outline-none" 
            onChange={e => setForm({...form, oyuncu_1: e.target.value})} value={form.oyuncu_1} />
          <input required placeholder="2. Oyuncu" className="w-full bg-black border border-zinc-700 p-3 rounded-xl focus:border-yellow-500 outline-none" 
            onChange={e => setForm({...form, oyuncu_2: e.target.value})} value={form.oyuncu_2} />
          <input required placeholder="3. Oyuncu" className="w-full bg-black border border-zinc-700 p-3 rounded-xl focus:border-yellow-500 outline-none" 
            onChange={e => setForm({...form, oyuncu_3: e.target.value})} value={form.oyuncu_3} />
          <input required placeholder="İletişim Tel" className="w-full bg-black border border-zinc-700 p-3 rounded-xl focus:border-yellow-500 outline-none" 
            onChange={e => setForm({...form, telefon: e.target.value})} value={form.telefon} />
          <button className="w-full bg-yellow-500 text-black font-bold py-4 rounded-xl hover:bg-yellow-400">KAYDI TAMAMLA</button>
          {mesaj && <p className="text-center text-yellow-500 mt-4">{mesaj}</p>}
        </form>
      </div>
    </div>
  );
}