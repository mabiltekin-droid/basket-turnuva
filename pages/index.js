import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import MatchCard from '../components/MatchCard'

export default function Home() {
  const [maclar, setMaclar] = useState([]) // Başlangıç değeri boş dizi

  useEffect(() => {
    async function fetchMaclar() {
      try {
        const { data, error } = await supabase
          .from('maclar')
          .select('*')
          .order('saat', { ascending: true })
        
        if (error) throw error
        if (data) setMaclar(data)
      } catch (err) {
        console.error("Veri çekme hatası:", err.message)
      }
    }
    fetchMaclar()
  }, [])

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <h1 className="text-5xl font-black text-center mb-12 text-yellow-500 italic">ALTIN POTA 3x3</h1>
      <div className="max-w-4xl mx-auto grid gap-6">
        <h2 className="text-2xl font-bold border-l-4 border-yellow-500 pl-4 mb-4 uppercase">Maç Programı</h2>
        
        {maclar && maclar.length > 0 ? (
          maclar.map((mac) => (
            <MatchCard key={mac.id} match={mac} />
          ))
        ) : (
          <div className="text-center p-10 border border-dashed border-zinc-800 rounded-2xl">
            <p className="text-gray-500 italic text-lg">Henüz maç programı açıklanmadı veya veriler yükleniyor...</p>
          </div>
        )}
      </div>
    </div>
  )
}