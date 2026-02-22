import MatchCard from '../components/MatchCard'

// ... Supabase'den 'maclar' verisini çektiğini varsayalım ...

return (
  <div className="grid md:grid-cols-2 gap-6 p-6">
    {maclar.map((mac) => (
      <MatchCard key={mac.id} match={mac} />
    ))}
  </div>
)