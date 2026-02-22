import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MatchCard from '../components/MatchCard';
import Link from 'next/link';

export default function Home() {
  const [tab, setTab] = useState('program'); // 'program' veya 'agac'
  const [maclar, setMaclar] = useState([]);

  useEffect(() => {
    fetchMaclar();
  }, []);

  async function fetchMaclar() {
    const { data } = await supabase.from('maclar').select('*').order('saat', { ascending: true });
    if (data) setMaclar(data);
  }

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      {/* Hero Section */}
      <div className="py-12 px-6 text-center border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-black">
        <h1 className="text-6xl font-black italic text-yellow-500 tracking-tighter mb-4">ALTIN POTA 3x3</h1>
        <p className="text-zinc-400 max-w-md mx-auto mb-8">Sokak basketbolunun kalbi burada atıyor. Takımını kur, efsane ol!</p>
        <Link href="/kayit" className="bg-yellow-500 text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-400 transition-all uppercase tracking-widest">
          Turnuvaya Kayıt Ol
        </Link>
      </div>

      {/* Sekmeler */}
      <div className="flex justify-center gap-4 my-8">
        <button onClick={() => setTab('program')} className={`px-6 py-2 rounded-lg font-bold transition ${tab === 'program' ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>MAÇ PROGRAMI</button>
        <button onClick={() => setTab('agac')} className={`px-6 py-2 rounded-lg font-bold transition ${tab === 'agac' ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>TURNUVA AĞACI</button>
      </div>

      <main className="max-w-4xl mx-auto px-6 pb-20">
        {tab === 'program' ? (
          <div className="grid gap-6">
            {maclar.length > 0 ? maclar.map(mac => <MatchCard key={mac.id} match={mac} />) : <p className="text-center text-zinc-500">Henüz maç eklenmedi.</p>}
          </div>
        ) : (
          <div className="p-12 border border-zinc-800 rounded-3xl bg-zinc-900/50 text-center">
            <h2 className="text-2xl font-bold mb-4">Play-off Braketi</h2>
            <p className="text-zinc-500">Kayıtlar tamamlandıktan sonra ağaç burada oluşturulacak!</p>
            {/* Buraya görsel bir ağaç yapısı eklenebilir */}
          </div>
        )}
      </main>
    </div>
  );
}