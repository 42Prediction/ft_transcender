import { useEffect, useState } from 'react'
import './App.css'

type ExamRank = {
  id: number
  name: string
  min_score: number
  max_score: number
}

function App() {
  const [ranks, setRanks] = useState<ExamRank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

    const fetchRanks = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/examrank`)

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data: ExamRank[] = await response.json()
        setRanks(data)
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : 'Could not load ranks'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchRanks()
  }, [])

  return (
    <main className="page">
      <header>
        <h1>Exam Ranks</h1>
        <p>Lista de ranks cadastrados na base de dados.</p>
      </header>

      {loading && <p className="info">A carregar ranks...</p>}
      {error && <p className="error">Erro ao buscar ranks: {error}</p>}

      {!loading && !error && (
        <section>
          {ranks.length === 0 ? (
            <p className="info">Nenhum rank encontrado.</p>
          ) : (
            <ul className="rank-list">
              {ranks.map((rank) => (
                <li key={rank.id} className="rank-item">
                  <h2>{rank.name}</h2>
                  <p>
                    Score: {rank.min_score} - {rank.max_score}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}

export default App
