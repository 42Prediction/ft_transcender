import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { school42Api, type Student42 } from '@/api/market/school42.api';
import { marketApi } from '@/api/market/market.api';

// Platform scope is strictly Exam Rank 02-06 — no other category exists.
const CATEGORIES = ['Exam 02', 'Exam 03', 'Exam 04', 'Exam 05', 'Exam 06'] as const;

type Category = (typeof CATEGORIES)[number];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

function avatarFallback(login: string) {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(login)}&backgroundType=gradientLinear`;
}

export function CreateMarketModal({ open, onOpenChange, onCreated }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student42[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Student42 | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [project, setProject] = useState('');
  const [category, setCategory] = useState<Category>('Exam 02');
  const [closesAt, setClosesAt] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await school42Api.searchStudents(query, 8);
        setResults(data);
        setShowDropdown(true);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function selectStudent(s: Student42) {
    setSelected(s);
    setQuery(s.login);
    setShowDropdown(false);
  }

  function clearStudent() {
    setSelected(null);
    setQuery('');
    setResults([]);
  }

  function resetForm() {
    setQuery('');
    setResults([]);
    setSelected(null);
    setProject('');
    setCategory('Exam 02');
    setClosesAt('');
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { setError('Select a 42 student first.'); return; }
    if (!project.trim()) { setError('Describe the event to predict.'); return; }
    if (!closesAt) { setError('Set a closing date.'); return; }
    if (new Date(closesAt) <= new Date()) { setError('Closing date must be in the future.'); return; }

    setSubmitting(true);
    setError(null);
    try {
      await marketApi.create({
        subjectLogin: selected.login,
        subjectName: selected.name,
        subjectAvatar: selected.avatar ?? undefined,
        project: project.trim(),
        category,
        closesAt: new Date(closesAt).toISOString(),
      });
      setSuccess(true);
      onCreated?.();
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create market. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = !!selected && project.trim().length >= 4 && !!closesAt;
  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent
        className="overflow-hidden border-border/60 bg-transparent p-0 sm:max-w-[500px]"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Create Prediction Market</DialogTitle>
        <div className="rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-elevated backdrop-blur-2xl sm:p-7">

          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold">New Market</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a prediction about a 42 Luanda student.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Student search */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Student <span className="text-primary">*</span>
              </label>
              <div className="relative" ref={dropdownRef}>
                <div className={cn(
                  'flex items-center rounded-xl border bg-surface transition',
                  showDropdown ? 'border-primary/50' : 'border-border/60',
                )}>
                  {selected ? (
                    <img
                      src={selected.avatar ?? avatarFallback(selected.login)}
                      alt={selected.login}
                      className="ml-3 h-6 w-6 shrink-0 rounded-lg object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = avatarFallback(selected.login); }}
                    />
                  ) : (
                    <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); if (selected) setSelected(null); }}
                    onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                    placeholder="Search by 42 login…"
                    className="h-11 flex-1 bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none"
                    autoComplete="off"
                  />
                  {searching && <Loader2 className="mr-3 h-4 w-4 animate-spin text-muted-foreground" />}
                  {selected && !searching && (
                    <button
                      type="button"
                      onClick={clearStudent}
                      className="mr-3 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {showDropdown && results.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/60 bg-background shadow-xl overflow-hidden">
                    {results.map((s) => (
                      <button
                        key={s.login}
                        type="button"
                        onClick={() => selectStudent(s)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-surface transition"
                      >
                        <img
                          src={s.avatar ?? avatarFallback(s.login)}
                          alt={s.login}
                          className="h-8 w-8 shrink-0 rounded-lg object-cover bg-surface"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = avatarFallback(s.login); }}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{s.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">@{s.login}{s.campus ? ` · ${s.campus}` : ''}</p>
                        </div>
                        {s.level > 0 && (
                          <span className="ml-auto shrink-0 font-mono text-xs text-primary">
                            lvl {s.level.toFixed(1)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showDropdown && !searching && results.length === 0 && query.trim().length >= 2 && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-xl">
                    No students found for <span className="font-mono">"{query}"</span>
                  </div>
                )}
              </div>
              {selected && (
                <p className="mt-1.5 text-xs text-success">
                  ✓ {selected.name} (@{selected.login}){selected.campus ? ` · ${selected.campus}` : ''}
                </p>
              )}
            </div>

            {/* Event/project */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Event to predict <span className="text-primary">*</span>
              </label>
              <input
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. ft_transcendence — final defense"
                className="h-11 w-full rounded-xl border border-border/60 bg-surface px-4 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Be specific: include the project name and event type.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Category <span className="text-primary">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      'rounded-xl border px-3 py-1.5 text-xs font-medium transition',
                      category === c
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 bg-surface text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Closing date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Closes at <span className="text-primary">*</span>
              </label>
              <input
                type="datetime-local"
                value={closesAt}
                min={minDate}
                onChange={(e) => setClosesAt(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/60 bg-surface px-4 text-sm text-foreground focus:border-primary/50 focus:outline-none transition [color-scheme:dark]"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-xs text-destructive">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-center text-xs text-success">
                Market created successfully!
              </p>
            )}

            <button
              type="submit"
              disabled={!isValid || submitting}
              className={cn(
                'flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground transition-all',
                isValid && !submitting ? 'hover:opacity-90' : 'cursor-not-allowed opacity-50',
              )}
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Market'}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
