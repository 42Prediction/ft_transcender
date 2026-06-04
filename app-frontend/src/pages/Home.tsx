import { useEffect, useState } from 'react';

type ExamRank = {
  id: number;
  name: string;
  min_score: number;
  max_score: number;
};

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {

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
          
        </div>
      )}
    </main>
  );
}