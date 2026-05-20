import { useEffect, useState } from 'react';

type ExamRank = {
  id: number;
  name: string;
  min_score: number;
  max_score: number;
};

export default function Home() {
  const [ranks, setRanks] = useState<ExamRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
    fetch(`${apiBaseUrl}/examrank`)
      .then(res => res.json())
      .then(data => setRanks(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-8 text-white">
      <header className="mb-10">
        <h1 className="text-5xl font-black italic text-[#00FF9D] uppercase tracking-tighter">
          Exam Ranks
        </h1>
        <p className="text-zinc-500 font-bold tracking-widest text-xs mt-2">
          BASE DE DADOS 42_NETWORK // ACESSO AUTORIZADO
        </p>
      </header>

      {loading ? (
        <p className="text-[#00FF9D] animate-pulse font-mono text-sm">
          A CARREGAR DADOS DO SISTEMA...
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ranks.map((rank) => (  
            <div
              key={rank.id}       
              className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl hover:border-[#00FF9D] transition-all group"
            >
              <h2 className="text-xl font-black italic text-white group-hover:text-[#00FF9D] mb-2">
                {rank.name}       {}
              </h2>
              <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">
                  Range de Score
                </span>
                <span className="text-[#00FF9D] font-mono">
                  {rank.min_score} - {rank.max_score}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}