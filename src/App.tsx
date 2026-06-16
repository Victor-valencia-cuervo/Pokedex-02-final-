import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, AudioLines, Bolt, Brain, ChevronRight, ChevronLeft,
  Droplets, Flame, Heart, Leaf, Moon, Search, Shield, Skull,
  Snowflake, Sparkles, Swords, X, Zap, Star, Bug,
  Mountain, Wind, Crosshair, Feather, Circle,
} from 'lucide-react'
import {
  AnimatePresence, motion,
  useMotionTemplate, useMotionValue, type Variants,
} from 'framer-motion'
import './App.css'

/* ─── PokeAPI types ──────────────────────────────────────────────────────── */

// Raw API types mapped to a Pokémon name string
type ApiPokemonType =
  | 'fire' | 'water' | 'grass' | 'electric' | 'ghost' | 'psychic'
  | 'ice'  | 'dragon'| 'normal'| 'fighting' | 'poison'| 'ground'
  | 'flying'| 'bug'  | 'rock'  | 'steel'    | 'dark'  | 'fairy'

type Pokemon = {
  id: number
  name: string
  genus: string
  types: ApiPokemonType[]
  height: string
  weight: string
  ability: string
  description: string
  stats: { hp: number; attack: number; defense: number; speed: number }
  evolution: string[]
  generation: number
  sprite: string
}

/* ─── Type → Dracula palette ─────────────────────────────────────────────── */

const typeStyles: Record<ApiPokemonType, {
  label: string; primary: string; secondary: string
  deep: string; glow: string; Icon: typeof Flame
}> = {
  fire:     { label:'Fuego',    primary:'#FF5555', secondary:'#FFB86C', deep:'#3a1620', glow:'rgba(255,85,85,.36)',    Icon:Flame     },
  water:    { label:'Agua',     primary:'#8BE9FD', secondary:'#3F6CFF', deep:'#102735', glow:'rgba(139,233,253,.32)',  Icon:Droplets  },
  grass:    { label:'Planta',   primary:'#50FA7B', secondary:'#16C784', deep:'#113420', glow:'rgba(80,250,123,.32)',   Icon:Leaf      },
  electric: { label:'Eléctrico',primary:'#F1FA8C', secondary:'#FFB86C', deep:'#3a3312', glow:'rgba(241,250,140,.32)', Icon:Bolt      },
  ghost:    { label:'Fantasma', primary:'#BD93F9', secondary:'#11121B', deep:'#23163a', glow:'rgba(189,147,249,.36)', Icon:Skull     },
  psychic:  { label:'Psíquico', primary:'#FF79C6', secondary:'#BD93F9', deep:'#381934', glow:'rgba(255,121,198,.36)', Icon:Brain     },
  ice:      { label:'Hielo',    primary:'#8BE9FD', secondary:'#D7F8FF', deep:'#133341', glow:'rgba(139,233,253,.36)', Icon:Snowflake },
  dragon:   { label:'Dragón',   primary:'#BD93F9', secondary:'#4D7CFF', deep:'#191846', glow:'rgba(189,147,249,.38)', Icon:Zap       },
  normal:   { label:'Normal',   primary:'#F8F8F2', secondary:'#44475A', deep:'#2a2b38', glow:'rgba(248,248,242,.22)', Icon:Circle    },
  fighting: { label:'Lucha',    primary:'#FF5555', secondary:'#FFB86C', deep:'#3a1010', glow:'rgba(255,85,85,.28)',   Icon:Crosshair },
  poison:   { label:'Veneno',   primary:'#BD93F9', secondary:'#FF79C6', deep:'#2a163a', glow:'rgba(189,147,249,.28)',Icon:Feather   },
  ground:   { label:'Tierra',   primary:'#FFB86C', secondary:'#F1FA8C', deep:'#3a2810', glow:'rgba(255,184,108,.28)',Icon:Mountain  },
  flying:   { label:'Volador',  primary:'#8BE9FD', secondary:'#BD93F9', deep:'#182235', glow:'rgba(139,233,253,.26)',Icon:Wind      },
  bug:      { label:'Bicho',    primary:'#50FA7B', secondary:'#F1FA8C', deep:'#112e10', glow:'rgba(80,250,123,.26)', Icon:Bug       },
  rock:     { label:'Roca',     primary:'#FFB86C', secondary:'#F8F8F2', deep:'#2f2010', glow:'rgba(255,184,108,.26)',Icon:Mountain  },
  steel:    { label:'Acero',    primary:'#8BE9FD', secondary:'#F8F8F2', deep:'#102530', glow:'rgba(139,233,253,.22)',Icon:Shield    },
  dark:     { label:'Siniestro',primary:'#44475A', secondary:'#BD93F9', deep:'#191a24', glow:'rgba(68,71,90,.44)',   Icon:Moon      },
  fairy:    { label:'Hada',     primary:'#FF79C6', secondary:'#F8F8F2', deep:'#38162a', glow:'rgba(255,121,198,.32)',Icon:Star      },
}

const statLabels: Record<keyof Pokemon['stats'], string> = {
  hp:'HP', attack:'Ataque', defense:'Defensa', speed:'Velocidad'
}

/* ─── PokeAPI helpers ────────────────────────────────────────────────────── */

const BASE = 'https://pokeapi.co/api/v2'

// Simple in-memory cache
const cache = new Map<string, unknown>()
async function apiFetch<T>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url) as T
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  const data = await res.json() as T
  cache.set(url, data)
  return data
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ') }

// Flatten evolution chain recursively
function flattenChain(chain: EvolutionChainLink): string[] {
  const names: string[] = [capitalize(chain.species.name)]
  for (const next of chain.evolves_to) names.push(...flattenChain(next))
  return names
}

type EvolutionChainLink = {
  species: { name: string; url: string }
  evolves_to: EvolutionChainLink[]
}

// Map API stat slug → our key
function mapStat(name: string): keyof Pokemon['stats'] | null {
  const m: Record<string, keyof Pokemon['stats']> = {
    hp:'hp', attack:'attack', defense:'defense', speed:'speed'
  }
  return m[name] ?? null
}

async function fetchPokemon(idOrName: number | string): Promise<Pokemon> {
  const [poke, species] = await Promise.all([
    apiFetch<PokéAPIRaw>(`${BASE}/pokemon/${idOrName}`),
    apiFetch<PokéAPISpecies>(`${BASE}/pokemon-species/${idOrName}`),
  ])

  // Evolution chain
  const chainData = await apiFetch<{ chain: EvolutionChainLink }>(species.evolution_chain.url)
  const evolution = flattenChain(chainData.chain)

  // Description in Spanish, then English fallback
  const desc =
    species.flavor_text_entries.find(e => e.language.name === 'es')?.flavor_text ||
    species.flavor_text_entries.find(e => e.language.name === 'en')?.flavor_text ||
    ''

  // Genus in Spanish, then English
  const genus =
    species.genera.find(g => g.language.name === 'es')?.genus ||
    species.genera.find(g => g.language.name === 'en')?.genus ||
    ''

  // Stats
  const stats: Pokemon['stats'] = { hp: 0, attack: 0, defense: 0, speed: 0 }
  for (const s of poke.stats) {
    const key = mapStat(s.stat.name)
    if (key) stats[key] = s.base_stat
  }

  // Generation number from URL like ".../generation/1/"
  const genMatch = species.generation.url.match(/\/(\d+)\/$/)
  const generation = genMatch ? parseInt(genMatch[1]) : 1

  return {
    id: poke.id,
    name: capitalize(poke.name),
    genus: genus.replace(' Pokémon', ''),
    types: poke.types.map(t => t.type.name as ApiPokemonType),
    height: `${(poke.height / 10).toFixed(1)} m`,
    weight: `${(poke.weight / 10).toFixed(1)} kg`,
    ability: capitalize(poke.abilities[0]?.ability.name ?? ''),
    description: desc.replace(/\f/g, ' ').replace(/\n/g, ' '),
    stats,
    evolution,
    generation,
    sprite: poke.sprites.other['official-artwork'].front_default ??
            poke.sprites.front_default ?? '',
  }
}

/* Raw PokeAPI response shapes (partial) */
type PokéAPIRaw = {
  id: number; name: string; height: number; weight: number
  types: { type: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  abilities: { ability: { name: string }; is_hidden: boolean }[]
  sprites: {
    front_default: string
    other: { 'official-artwork': { front_default: string } }
  }
}
type PokéAPISpecies = {
  generation: { url: string }
  evolution_chain: { url: string }
  flavor_text_entries: { flavor_text: string; language: { name: string } }[]
  genera: { genus: string; language: { name: string } }[]
}

/* ─── Initial Pokémon IDs (curated list) ─────────────────────────────────── */

const INITIAL_IDS = [
  1, 4, 7, 25, 39, 52, 54, 63, 66, 74, 92, 95, 102, 111, 116, 129,
  131, 133, 143, 147, 150, 152, 155, 158, 175, 196, 197, 202, 225, 233,
  243, 244, 245, 249, 250, 252, 258, 261, 280, 282, 302, 303, 350, 351,
  352, 373, 376, 380, 381, 382, 383, 384, 385, 386, 393, 396, 399, 403,
  408, 415, 422, 425, 431, 433, 436, 438, 439, 440, 442, 443, 446, 448,
  449, 455, 459, 461, 468, 470, 471, 474, 477, 479, 480, 481, 482, 483,
  484, 487, 489, 490, 492, 494, 495, 498, 501, 504, 509, 511, 519, 529,
  531, 532, 535, 538, 539, 543, 546, 548, 550, 551, 556, 559, 561, 562,
  563, 564, 570, 572, 574, 577, 580, 582, 585, 587, 590, 592, 595, 597,
  599, 600, 601, 602, 605, 607, 609, 610, 613, 615, 616, 618, 619, 621,
  622, 624, 626, 627, 629, 631, 632, 633, 636, 638, 639, 640, 641, 642,
  643, 644, 645, 646, 647, 648, 649, 650, 653, 656, 659, 661, 664, 667,
  669, 672, 674, 676, 677, 679, 681, 682, 684, 686, 688, 690, 692, 694,
  696, 698, 700, 701, 702, 703, 704, 706, 708, 710, 712, 714, 716, 717,
  718, 719, 720, 721,
]

/* ─── Hooks ──────────────────────────────────────────────────────────────── */

function useStoredFavorites() {
  const [favorites, setFavorites] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('dracula-pokedex-neo-v2-favorites') || '[]') }
    catch { return [] }
  })
  useEffect(() => {
    try { localStorage.setItem('dracula-pokedex-neo-v2-favorites', JSON.stringify(favorites)) }
    catch { /* noop */ }
  }, [favorites])
  return { favorites, setFavorites }
}

/* ─── Sound ──────────────────────────────────────────────────────────────── */

function playSound(type: ApiPokemonType, enabled: boolean) {
  if (!enabled) return
  try {
    const AudioCtx = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx  = new AudioCtx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    const freqMap: Partial<Record<ApiPokemonType, [number, number]>> = {
      fire:[440,880], water:[330,660], grass:[392,784], electric:[523,1046],
      ghost:[220,440], psychic:[493,987], ice:[440,880], dragon:[294,588],
    }
    const [f1, f2] = freqMap[type] ?? [400, 800]
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f1, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + 0.16)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.26)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.28)
  } catch { /* noop */ }
}

/* ─── Animation variants ─────────────────────────────────────────────────── */

const containerVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}
const cardVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.88, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type:'spring', stiffness:135, damping:17 } },
}

const PAGE_SIZE = 24
type View = 'all' | 'favorites'

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
  const [pokemons,  setPokemons]  = useState<Pokemon[]>([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [progress,  setProgress]  = useState(0)   // 0-100

  const [query,        setQuery]        = useState('')
  const [selectedType, setSelectedType] = useState<ApiPokemonType | 'all'>('all')
  const [view,         setView]         = useState<View>('all')
  const [page,         setPage]         = useState(1)
  const [selected,     setSelected]     = useState<Pokemon | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const { favorites, setFavorites }     = useStoredFavorites()

  /* Load all Pokémon in batches */
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setLoadError(null); setProgress(0)
      const results: Pokemon[] = []
      const BATCH = 10
      for (let i = 0; i < INITIAL_IDS.length; i += BATCH) {
        if (cancelled) return
        const batch = INITIAL_IDS.slice(i, i + BATCH)
        const settled = await Promise.allSettled(batch.map(id => fetchPokemon(id)))
        for (const r of settled) {
          if (r.status === 'fulfilled') results.push(r.value)
        }
        const pct = Math.round(((i + BATCH) / INITIAL_IDS.length) * 100)
        setProgress(Math.min(pct, 100))
        setPokemons([...results]) // stream cards as they load
      }
      if (!cancelled) setLoading(false)
    }
    load().catch(e => { if (!cancelled) setLoadError(String(e)) })
    return () => { cancelled = true }
  }, [])

  /* Keyboard close */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])
  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  /* Reset page on filter change */
  useEffect(() => { setPage(1) }, [query, selectedType, view])

  const allTypes = useMemo(() => {
    const set = new Set<ApiPokemonType>()
    pokemons.forEach(p => p.types.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [pokemons])

  const filtered = useMemo(() => {
    const base = view === 'favorites'
      ? pokemons.filter(p => favorites.includes(p.id))
      : pokemons
    return base.filter(p => {
      const mq = p.name.toLowerCase().includes(query.toLowerCase()) ||
                 p.genus.toLowerCase().includes(query.toLowerCase())
      const mt = selectedType === 'all' || p.types.includes(selectedType)
      return mq && mt
    })
  }, [pokemons, view, favorites, query, selectedType])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const avgPower = pokemons.length
    ? Math.round(pokemons.reduce((s,p) => s + Object.values(p.stats).reduce((a,b) => a+b,0)/4, 0) / pokemons.length)
    : 0

  const toggleFav = useCallback((id: number) =>
    setFavorites(cur => cur.includes(id) ? cur.filter(f => f !== id) : [...cur, id]), [setFavorites])

  const openDetail = useCallback((p: Pokemon) => {
    setSelected(p); playSound(p.types[0], soundEnabled)
  }, [soundEnabled])

  return (
    <main className="app-shell">
      <BackgroundEffects />

      {/* ── HERO ── */}
      <motion.section className="hero-panel"
        initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:.48, ease:'easeOut' }}>

        <header className="topbar">
          <div className="brand-lockup">
            <motion.span className="brand-mark"
              whileHover={{ scale:1.08, rotate:8 }}
              transition={{ type:'spring', stiffness:260, damping:18 }}>
              <Sparkles size={24} />
            </motion.span>
            <div>
              <p className="eyebrow">PokeAPI Live · Dracula Visual Index</p>
              <h1>Pokédex Neo</h1>
            </div>
          </div>

          <div className="topbar-controls">
            <div className="view-switcher" role="group" aria-label="Cambiar vista">
              {(['all','favorites'] as View[]).map(v => (
                <motion.button key={v} type="button"
                  className={`view-btn ${view === v ? 'active' : ''}`}
                  onClick={() => setView(v)}
                  whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }}>
                  {v === 'all'
                    ? <><Activity size={15}/> Todos ({pokemons.length})</>
                    : <><Heart size={15}/> Favoritos <span className="fav-badge">{favorites.length}</span></>}
                </motion.button>
              ))}
            </div>
            <motion.button className={`sound-toggle ${soundEnabled ? 'active' : ''}`}
              type="button" onClick={() => setSoundEnabled(v => !v)} aria-pressed={soundEnabled}
              whileHover={{ scale:1.04 }} whileTap={{ scale:.96 }}>
              <AudioLines size={17}/>
              <span>{soundEnabled ? 'Audio ON' : 'Audio OFF'}</span>
            </motion.button>
          </div>
        </header>

        <div className="hero-grid">
          <div className="hero-copy">
            <motion.p className="hero-kicker"
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}>
              VS Code darkness × Pokémon data — tiempo real desde pokeapi.co
            </motion.p>
            <motion.h2
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.18 }}>
              Explora más de {INITIAL_IDS.length} Pokémon reales con datos completos.
            </motion.h2>
          </div>

          <div className="search-console">
            <label className="search-field" htmlFor="pokemon-search">
              <Search size={18} aria-hidden="true"/>
              <input id="pokemon-search" type="search" value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nombre o clase…" autoComplete="off"/>
            </label>

            {/* Loading bar */}
            {loading && (
              <div className="load-bar-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <motion.div className="load-bar-fill" animate={{ width:`${progress}%` }} transition={{ ease:'easeOut' }}/>
              </div>
            )}

            <div className="type-filter" role="group" aria-label="Filtrar por tipo">
              <motion.button className={`chip ${selectedType === 'all' ? 'active' : ''}`}
                type="button" onClick={() => setSelectedType('all')}
                whileHover={{ y:-2 }} whileTap={{ scale:.95 }}>
                <Moon size={13} aria-hidden="true"/> Todos
              </motion.button>
              {allTypes.map(type => {
                const ts = typeStyles[type]
                const TypeIcon = ts.Icon
                return (
                  <motion.button key={type}
                    className={`chip ${selectedType === type ? 'active' : ''}`}
                    type="button"
                    style={{ '--chip-color': ts.primary } as React.CSSProperties}
                    onClick={() => setSelectedType(type)}
                    whileHover={{ y:-2 }} whileTap={{ scale:.95 }}>
                    <TypeIcon size={13} aria-hidden="true"/> {ts.label}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── STATS ── */}
      <section className="stats-grid" aria-label="Estadísticas generales">
        {[
          { icon:<Activity size={20}/>, label:'Registrados',  value:pokemons.length },
          { icon:<Shield size={20}/>,   label:'Tipos activos', value:allTypes.length },
          { icon:<Swords size={20}/>,   label:'Poder medio',  value:avgPower },
          { icon:<Star size={20}/>,     label:'Favoritos',    value:favorites.length },
        ].map((s, i) => (
          <motion.article key={s.label} className="premium-stat"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ type:'spring', stiffness:150, damping:18, delay:i*.07 }}
            whileHover={{ y:-4, transition:{ duration:.18 } }}>
            <span className="stat-icon" aria-hidden="true">{s.icon}</span>
            <div><strong>{s.value}</strong><p>{s.label}</p></div>
          </motion.article>
        ))}
      </section>

      {/* ── ERROR ── */}
      {loadError && (
        <div className="load-error">
          <p>⚠️ Error al cargar datos: {loadError}</p>
        </div>
      )}

      {/* ── GRID ── */}
      <AnimatePresence mode="wait">
        <motion.section key={`${selectedType}-${query}-${view}-${page}`}
          className="pokemon-grid"
          variants={containerVariants} initial="hidden" animate="visible" exit="exit"
          aria-live="polite" aria-label="Colección de Pokémon">

          {paginated.length === 0 && !loading ? (
            <motion.div className="empty-state"
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
              <span className="empty-icon" aria-hidden="true">
                {view === 'favorites' ? '💜' : '🔍'}
              </span>
              <h3>{view === 'favorites' ? 'Sin favoritos aún' : 'Sin resultados'}</h3>
              <p>{view === 'favorites'
                ? 'Presiona el corazón en cualquier tarjeta para guardar'
                : 'Prueba otro nombre o tipo'}</p>
            </motion.div>
          ) : (
            <>
              {paginated.map(p => (
                <PokemonCard key={p.id} pokemon={p}
                  favorite={favorites.includes(p.id)}
                  onFavorite={() => toggleFav(p.id)}
                  onOpen={() => openDetail(p)}/>
              ))}
              {/* Skeleton placeholders while first batch loads */}
              {loading && paginated.length === 0 &&
                Array.from({ length: 8 }).map((_, i) =>
                  <div key={`sk-${i}`} className="skeleton-card" aria-hidden="true"/>)}
            </>
          )}
        </motion.section>
      </AnimatePresence>

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div className="pagination" aria-label="Paginación">
          <motion.button type="button" className="page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            whileHover={{ scale:1.05 }} whileTap={{ scale:.95 }}>
            <ChevronLeft size={18}/> Anterior
          </motion.button>
          <span className="page-info">
            Pág. <strong>{page}</strong> / {totalPages}
            <span className="page-count"> ({filtered.length} Pokémon)</span>
          </span>
          <motion.button type="button" className="page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            whileHover={{ scale:1.05 }} whileTap={{ scale:.95 }}>
            Siguiente <ChevronRight size={18}/>
          </motion.button>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {selected && (
          <PokemonDetail pokemon={selected}
            favorite={favorites.includes(selected.id)}
            onClose={() => setSelected(null)}
            onFavorite={() => toggleFav(selected.id)}/>
        )}
      </AnimatePresence>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   BACKGROUND
═══════════════════════════════════════════════════════════════════════════ */

function BackgroundEffects() {
  return (
    <div className="background-effects" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => (
        <span key={i} className="particle" style={{
          '--delay':`${i * .48}s`, '--x':`${(i * 43) % 100}%`,
          '--size':`${3 + (i % 6) * 2}px`,
        } as React.CSSProperties}/>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   POKEMON CARD
═══════════════════════════════════════════════════════════════════════════ */

function PokemonCard({ pokemon, favorite, onFavorite, onOpen }: {
  pokemon: Pokemon; favorite: boolean; onFavorite: () => void; onOpen: () => void
}) {
  const style   = typeStyles[pokemon.types[0]] ?? typeStyles.normal
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const glowX   = useMotionValue(50)
  const glowY   = useMotionValue(50)
  const shine   = useMotionTemplate`radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.42), transparent 34%)`

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    rotateX.set(((e.clientY - r.top)  / r.height - .5) * -13)
    rotateY.set(((e.clientX - r.left) / r.width  - .5) *  13)
    glowX.set((e.clientX - r.left) / r.width  * 100)
    glowY.set((e.clientY - r.top)  / r.height * 100)
  }
  const reset = () => { rotateX.set(0); rotateY.set(0); glowX.set(50); glowY.set(50) }

  return (
    <motion.article className="pokemon-card" variants={cardVariants}
      onMouseMove={onMove} onMouseLeave={reset}
      style={{ rotateX, rotateY,
        '--type-primary':style.primary, '--type-secondary':style.secondary,
        '--type-deep':style.deep,       '--type-glow':style.glow,
      } as React.CSSProperties}>

      <motion.div className="card-shine" style={{ background:shine }} aria-hidden="true"/>

      <div className="card-topline">
        <span className="dex-number">#{pokemon.id.toString().padStart(4,'0')}</span>
        <motion.button className={`icon-button ${favorite ? 'favorite' : ''}`} type="button"
          onClick={onFavorite}
          aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={favorite}
          whileHover={{ scale:1.14 }} whileTap={{ scale:.86 }}>
          <Heart size={17} fill={favorite ? 'currentColor' : 'none'}/>
        </motion.button>
      </div>

      <button className="card-main" type="button" onClick={onOpen}
        aria-label={`Ver ficha de ${pokemon.name}`}>
        <div className="card-names">
          <h3>{pokemon.name}</h3>
          <p>{pokemon.genus || 'Pokémon'}</p>
        </div>
        <motion.img className="pokemon-image" loading="lazy" alt={pokemon.name}
          src={pokemon.sprite}
          animate={{ y:[0,-10,0] }}
          transition={{ repeat:Infinity, duration:3.4, ease:'easeInOut' }}
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}/>
      </button>

      <div className="card-footer">
        <div className="type-pills" role="list">
          {pokemon.types.map(type => {
            const ts = typeStyles[type] ?? typeStyles.normal
            const TypeIcon = ts.Icon
            return (
              <span key={type} className="type-pill" role="listitem"
                style={{ '--pill-color':ts.primary } as React.CSSProperties}>
                <TypeIcon size={13} aria-hidden="true"/> {ts.label}
              </span>
            )
          })}
        </div>
        <motion.button className="open-button" type="button" onClick={onOpen}
          whileHover={{ x:2 }} whileTap={{ scale:.95 }}>
          Ver ficha <ChevronRight size={15} aria-hidden="true"/>
        </motion.button>
      </div>
    </motion.article>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   DETAIL MODAL
═══════════════════════════════════════════════════════════════════════════ */

function PokemonDetail({ pokemon, favorite, onClose, onFavorite }: {
  pokemon: Pokemon; favorite: boolean; onClose: () => void; onFavorite: () => void
}) {
  const style    = typeStyles[pokemon.types[0]] ?? typeStyles.normal
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const first = panelRef.current?.querySelector<HTMLElement>(
      'button,[href],input,[tabindex]:not([tabindex="-1"])')
    first?.focus()
  }, [])

  return (
    <motion.div className="detail-backdrop"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      transition={{ duration:.22 }}
      role="dialog" aria-modal="true" aria-label={`Ficha de ${pokemon.name}`}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <motion.article ref={panelRef} className="detail-panel"
        initial={{ opacity:0, scale:.9, y:28 }}
        animate={{ opacity:1, scale:1,  y:0  }}
        exit={{    opacity:0, scale:.95, y:14 }}
        transition={{ type:'spring', stiffness:160, damping:22 }}
        style={{ '--type-primary':style.primary, '--type-secondary':style.secondary,
                 '--type-deep':style.deep, '--type-glow':style.glow } as React.CSSProperties}>

        {/* Actions */}
        <div className="detail-actions">
          <motion.button className={`icon-button ${favorite ? 'favorite' : ''}`} type="button"
            onClick={onFavorite}
            aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            aria-pressed={favorite}
            whileHover={{ scale:1.1 }} whileTap={{ scale:.9 }}>
            <Heart size={20} fill={favorite ? 'currentColor' : 'none'}/>
          </motion.button>
          <motion.button className="icon-button" type="button" onClick={onClose}
            aria-label="Cerrar ficha" whileHover={{ scale:1.1 }} whileTap={{ scale:.9 }}>
            <X size={20}/>
          </motion.button>
        </div>

        {/* Hero */}
        <div className="detail-hero">
          <motion.img alt={pokemon.name} src={pokemon.sprite}
            animate={{ y:[0,-14,0] }}
            transition={{ repeat:Infinity, duration:3.2, ease:'easeInOut' }}
            onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}/>
          <div className="detail-copy">
            <span className="dex-number" style={{ display:'block', marginBottom:4 }}>
              #{pokemon.id.toString().padStart(4,'0')} · Gen {pokemon.generation}
            </span>
            <h2>{pokemon.name}</h2>
            <p className="detail-desc">{pokemon.description || 'Sin descripción disponible.'}</p>
            <div className="type-pills detail-types" role="list">
              {pokemon.types.map(type => {
                const ts = typeStyles[type] ?? typeStyles.normal
                const TypeIcon = ts.Icon
                return (
                  <span key={type} className="type-pill" role="listitem"
                    style={{ '--pill-color':ts.primary } as React.CSSProperties}>
                    <TypeIcon size={13} aria-hidden="true"/> {ts.label}
                  </span>
                )
              })}
            </div>
            <div className="detail-meta">
              <span>📏 {pokemon.height}</span>
              <span>⚖️ {pokemon.weight}</span>
              <span>✨ {pokemon.ability}</span>
            </div>
          </div>
        </div>

        {/* Stats + Evolution */}
        <div className="detail-grid">
          <section className="stat-bars" aria-label="Estadísticas de combate">
            <h3 className="section-label">Estadísticas base</h3>
            {Object.entries(pokemon.stats).map(([key, value]) => (
              <div className="stat-row" key={key}>
                <span className="stat-key">{statLabels[key as keyof Pokemon['stats']]}</span>
                <div className="bar-track"
                  role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={255}>
                  <motion.div className="bar-fill"
                    initial={{ width:0 }} animate={{ width:`${Math.min(value, 255) / 2.55}%` }}
                    transition={{ duration:.85, ease:[.25,.46,.45,.94], delay:.1 }}/>
                </div>
                <strong className="stat-value">{value}</strong>
              </div>
            ))}
          </section>

          <section className="evolution-line" aria-label="Línea evolutiva">
            <h3 className="section-label">Línea evolutiva</h3>
            <div className="evo-nodes">
              {pokemon.evolution.map((stage, i) => (
                <motion.span key={stage} className="evolution-node"
                  initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:.1 + i*.08 }}>
                  {stage}
                  {i < pokemon.evolution.length - 1 && <i className="evo-connector" aria-hidden="true"/>}
                </motion.span>
              ))}
            </div>
          </section>
        </div>
      </motion.article>
    </motion.div>
  )
}
