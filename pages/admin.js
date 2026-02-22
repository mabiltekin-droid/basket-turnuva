import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const ADMIN_EMAIL = "senin-mailin@gmail.com"; // Kendi mailini yaz

  useEffect(() => {
    // Mevcut oturumu al
    const session = supabase.auth.getSession();
    setUser(session?.user ?? null);
  }, [])

  // 1. Durum: Giriş yapılmamış
  if (!user) {
    return <div className="text-white p-10">Lütfen önce giriş yapın.</div>
  }

  // 2. Durum: Giriş yapılmış ama admin değil
  if (user.email !== ADMIN_EMAIL) {
    return <div className="text-red-500 p-10">Yetkisiz Erişim! Bu sayfa sadece yöneticiye özeldir.</div>
  }

  // 3. Durum: Admin giriş yapmış, formu göster
  return (
    <div className="bg-black min-h-screen p-10">
       <h1 className="text-gold text-2xl font-bold">Admin Paneline Hoş Geldin</h1>
       {/* Buraya daha önce hazırladığımız Maç Ekleme Formunu koyabilirsin */}
    </div>
  )
}