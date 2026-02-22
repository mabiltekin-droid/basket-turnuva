export default function MatchCard({ match }) {
  const isFinished = match.durum === 'tamamlandi';
  const isLive = match.durum === 'canli';

  return (
    <div className={`relative p-6 rounded-3xl border ${isLive ? 'border-red-500 animate-pulse' : 'border-zinc-800'} bg-zinc-900 shadow-xl`}>
      {isLive && <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">CANLI</span>}
      
      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest font-bold">Takım A</p>
          <h3 className="text-xl font-black">{match.takim_a}</h3>
        </div>

        <div className="px-6 text-center">
          {isFinished || isLive ? (
            <div className="text-4xl font-black italic text-yellow-500">
              {match.takim_a_skor} - {match.takim_b_skor}
            </div>
          ) : (
            <div className="bg-zinc-800 px-4 py-2 rounded-xl text-sm font-bold">VS</div>
          )}
          <p className="text-[10px] text-zinc-500 mt-2 uppercase">{match.saat}</p>
        </div>

        <div className="text-center flex-1">
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest font-bold">Takım B</p>
          <h3 className="text-xl font-black">{match.takim_b}</h3>
        </div>
      </div>
      
      {match.mvp && (
        <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
          <p className="text-xs text-yellow-500 font-bold uppercase tracking-tighter">🌟 Maçın Oyuncusu (MVP): {match.mvp}</p>
        </div>
      )}
    </div>
  );
}