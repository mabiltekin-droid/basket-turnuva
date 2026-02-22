import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ takim_a: '', takim_b: '', saat: '', yer: '', kategori: '18+' })
  const router = useRouter()

  const ADMIN_EMAIL = "m.a.biltekin@gmail.com"

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/admin' }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('maclar').insert([formData])
    if (error) alert("Hata: " + error.message)
    else {
      alert("Maç başarıyla eklendi!")
      setFormData({ takim_a: '', takim_b: '', saat: '', yer: '', kategori: '18+' })
    }
  }

  if (loading) return <div className="bg-black min-h-screen text-white p-10 font-bold">Yükleniyor...</div>

  // Yetkisiz Erişim Kontrolü
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-yellow-500 text-3xl font-black mb-4 italic uppercase tracking-tighter">YETKİLİ GİRİŞİ</h1>
        <p className="text-gray-400 mb-8 max-w-sm">Bu sayfa sadece yöneticiye özeldir. Lütfen admin hesabınla giriş yap.</p>
        <button onClick={handleLogin} className="bg-yellow-500 text-black px-8 py-3 rounded-full font-black uppercase hover:scale-105 transition">
          GOOGLE İLE GİRİŞ YAP
        </button>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-yellow-500 italic uppercase">YÖNETİM PANELİ</h1>
          <button onClick={() => supabase.auth.signOut()} className="text-xs bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700">Çıkış Yap</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-8 rounded-3xl border border-yellow-500/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">1. Takım</label>
              <input type="text" required value={formData.takim_a} onChange={e => setFormData({...formData, takim_a: e.target.value})} className="w-full bg-black border border-zinc-800 p-3 rounded-xl mt-2 focus:border-yellow-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">2. Takım</label>
              <input type="text" required value={formData.takim_b} onChange={e => setFormData({...formData, takim_b: e.target.value})} className="w-full bg-black border border-zinc-800 p-3 rounded-xl mt-2 focus:border-yellow-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Saat</label>
              <input type="text" placeholder="Örn: 18:30" required value={formData.saat} onChange={e => setFormData({...formData, saat: e.target.value})} className="w-full bg-black border border-zinc-800 p-3 rounded-xl mt-2 focus:border-yellow-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Kategori</label>
              <select value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full bg-black border border-zinc-800 p-3 rounded-xl mt-2 focus:border-yellow-500 outline-none">
                <option value="12-18">12-18 Yaş</option>
                <option value="18+">18+ Yetişkin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Saha / Yer</label>
            <input type="text" required value={formData.yer} onChange={e => setFormData({...formData, yer: e.target.value})} className="w-full bg-black border border-zinc-800 p-3 rounded-xl mt-2 focus:border-yellow-500 outline-none" />
          </div>

          <button type="submit" className="w-full bg-yellow-500 text-black font-black py-4 rounded-2xl hover:brightness-110 active:scale-95 transition text-lg uppercase italic">
            MAÇI PROGRAMA EKLE
          </button>
        </form>
      </div>
    </div>
  )
}