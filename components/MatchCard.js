// components/MatchCard.js
export default function MatchCard({ match }) {
  return (
    <div className="bg-zinc-900 border border-gold/20 rounded-2xl p-6 hover:border-gold transition-all duration-300 shadow-xl group">
      <div className="flex justify-between items-center mb-4 text-xs font-bold text-gold tracking-widest uppercase">
        <span>{match.kategori}</span>
        <span className="bg-gold/10 px-3 py-1 rounded-full">{match.saat}</span>
      </div>
      <div className="flex items-center justify-around gap-4 text-center">
        <div className="flex-1 font-black text-xl uppercase tracking-tighter">{match.takim_a}</div>
        <div className="text-gold font-black italic text-2xl px-4">VS</div>
        <div className="flex-1 font-black text-xl uppercase tracking-tighter">{match.takim_b}</div>
      </div>
      <div className="mt-4 pt-4 border-t border-zinc-800 text-center text-gray-500 text-sm">
        📍 {match.yer}
      </div>
    </div>
  )
}