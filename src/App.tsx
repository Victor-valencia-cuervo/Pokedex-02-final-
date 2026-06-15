import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AudioLines,
  Bolt,
  Brain,
  ChevronRight,
  Droplets,
  Flame,
  Heart,
  Leaf,
  Moon,
  Search,
  Shield,
  Skull,
  Snowflake,
  Sparkles,
  Swords,
  X,
  Zap,
} from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  type Variants,
} from 'framer-motion'
import './App.css'

type PokemonType =
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'ghost'
  | 'psychic'
  | 'ice'
  | 'dragon'

type Pokemon = {
  id: number
  name: string
  genus: string
  types: PokemonType[]
  height: string
  weight: string
  ability: string
  description: string
  stats: {
    hp: number
    attack: number
    defense: number
    speed: number
  }
  evolution: string[]
}

const typeStyles: Record<
  PokemonType,
  {
    label: string
    primary: string
    secondary: string
    deep: string
    Icon: typeof Flame
  }
> = {
  fire: {
    label: 'Fuego',
    primary: '#FF5555',
    secondary: '#FFB86C',
    deep: '#3a1620',
    Icon: Flame,
  },
  water: {
    label: 'Agua',
    primary: '#8BE9FD',
    secondary: '#3F6CFF',
    deep: '#102735',
    Icon: Droplets,
  },
  grass: {
    label: 'Planta',
    primary: '#50FA7B',
    secondary: '#16C784',
    deep: '#113420',
    Icon: Leaf,
  },
  electric: {
    label: 'Electrico',
    primary: '#F1FA8C',
    secondary: '#FFB86C',
    deep: '#3a3312',
    Icon: Bolt,
  },
  ghost: {
    label: 'Fantasma',
    primary: '#BD93F9',
    secondary: '#11121B',
    deep: '#23163a',
    Icon: Skull,
  },
  psychic: {
    label: 'Psiquico',
    primary: '#FF79C6',
    secondary: '#BD93F9',
    deep: '#381934',
    Icon: Brain,
  },
  ice: {
    label: 'Hielo',
    primary: '#8BE9FD',
    secondary: '#D7F8FF',
    deep: '#133341',
    Icon: Snowflake,
  },
  dragon: {
    label: 'Dragon',
    primary: '#BD93F9',
    secondary: '#4D7CFF',
    deep: '#191846',
    Icon: Zap,
  },
}

const pokemons: Pokemon[] = [
  {
    id: 6,
    name: 'Charizard',
    genus: 'Llama imperial',
    types: ['fire', 'dragon'],
    height: '1.7 m',
    weight: '90.5 kg',
    ability: 'Mar llamas',
    description:
      'Un atacante aereo de alto voltaje visual, con fuego azul-naranja y presencia de comandante.',
    stats: { hp: 78, attack: 84, defense: 78, speed: 100 },
    evolution: ['Charmander', 'Charmeleon', 'Charizard'],
  },
  {
    id: 9,
    name: 'Blastoise',
    genus: 'Acorazado hidraulico',
    types: ['water'],
    height: '1.6 m',
    weight: '85.5 kg',
    ability: 'Torrente',
    description:
      'Su sistema de cañones presurizados convierte cada movimiento en una descarga de precision.',
    stats: { hp: 79, attack: 83, defense: 100, speed: 78 },
    evolution: ['Squirtle', 'Wartortle', 'Blastoise'],
  },
  {
    id: 3,
    name: 'Venusaur',
    genus: 'Bio reactor',
    types: ['grass'],
    height: '2.0 m',
    weight: '100.0 kg',
    ability: 'Espesura',
    description:
      'Una central organica de energia solar capaz de estabilizar cualquier equipo de expedicion.',
    stats: { hp: 80, attack: 82, defense: 83, speed: 80 },
    evolution: ['Bulbasaur', 'Ivysaur', 'Venusaur'],
  },
  {
    id: 25,
    name: 'Pikachu',
    genus: 'Pulso electrico',
    types: ['electric'],
    height: '0.4 m',
    weight: '6.0 kg',
    ability: 'Electricidad estatica',
    description:
      'Pequeño, veloz y brillante; su energia convierte el combate en una secuencia de chispas tacticas.',
    stats: { hp: 35, attack: 55, defense: 40, speed: 90 },
    evolution: ['Pichu', 'Pikachu', 'Raichu'],
  },
  {
    id: 94,
    name: 'Gengar',
    genus: 'Sombra cuantica',
    types: ['ghost'],
    height: '1.5 m',
    weight: '40.5 kg',
    ability: 'Cuerpo maldito',
    description:
      'Aparece como una interferencia violeta en sensores nocturnos y domina el terreno psicologico.',
    stats: { hp: 60, attack: 65, defense: 60, speed: 110 },
    evolution: ['Gastly', 'Haunter', 'Gengar'],
  },
  {
    id: 150,
    name: 'Mewtwo',
    genus: 'Genoma psi',
    types: ['psychic'],
    height: '2.0 m',
    weight: '122.0 kg',
    ability: 'Presion',
    description:
      'Una mente de laboratorio con lectura tactica extrema y aura rosa-morada de energia contenida.',
    stats: { hp: 106, attack: 110, defense: 90, speed: 130 },
    evolution: ['Mewtwo'],
  },
  {
    id: 131,
    name: 'Lapras',
    genus: 'Nave polar',
    types: ['ice', 'water'],
    height: '2.5 m',
    weight: '220.0 kg',
    ability: 'Absorbe agua',
    description:
      'Su firma termica azulada y canto cristalino la hacen ideal para exploracion en climas extremos.',
    stats: { hp: 130, attack: 85, defense: 80, speed: 60 },
    evolution: ['Lapras'],
  },
  {
    id: 149,
    name: 'Dragonite',
    genus: 'Mensajero orbital',
    types: ['dragon'],
    height: '2.2 m',
    weight: '210.0 kg',
    ability: 'Foco interno',
    description:
      'Un guardian de rutas oceanicas, fuerte y sorprendentemente amable pese a su potencia de vuelo.',
    stats: { hp: 91, attack: 134, defense: 95, speed: 80 },
    evolution: ['Dratini', 'Dragonair', 'Dragonite'],
  },
]

const allTypes = Object.keys(typeStyles) as PokemonType[]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 140, damping: 18 },
  },
}

function useStoredFavorites() {
  const [favorites, setFavorites] = useState<number[]>(() => {
    const stored = window.localStorage.getItem('dracula-pokedex-favorites')
    return stored ? (JSON.parse(stored) as number[]) : []
  })

  useEffect(() => {
    window.localStorage.setItem(
      'dracula-pokedex-favorites',
      JSON.stringify(favorites),
    )
  }, [favorites])

  return { favorites, setFavorites }
}

function playOpenSound(enabled: boolean) {
  if (!enabled) return

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  const audio = new AudioContextClass()
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(420, audio.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(880, audio.currentTime + 0.16)
  gain.gain.setValueAtTime(0.0001, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.24)
  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start()
  oscillator.stop(audio.currentTime + 0.25)
}

function App() {
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState<PokemonType | 'all'>('all')
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const { favorites, setFavorites } = useStoredFavorites()

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 850)
    return () => window.clearTimeout(timer)
  }, [])

  const filteredPokemons = useMemo(() => {
    return pokemons.filter((pokemon) => {
      const matchesSearch =
        pokemon.name.toLowerCase().includes(query.toLowerCase()) ||
        pokemon.genus.toLowerCase().includes(query.toLowerCase())
      const matchesType =
        selectedType === 'all' || pokemon.types.includes(selectedType)
      return matchesSearch && matchesType
    })
  }, [query, selectedType])

  const averagePower = Math.round(
    pokemons.reduce((total, pokemon) => {
      const stats = Object.values(pokemon.stats)
      return total + stats.reduce((sum, value) => sum + value, 0) / stats.length
    }, 0) / pokemons.length,
  )

  const toggleFavorite = (id: number) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((favoriteId) => favoriteId !== id)
        : [...current, id],
    )
  }

  const openDetail = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon)
    playOpenSound(soundEnabled)
  }

  return (
    <main className="app-shell">
      <BackgroundEffects />
      <section className="hero-panel" aria-labelledby="page-title">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <Sparkles size={24} />
            </span>
            <div>
              <p className="eyebrow">Dracula Visual Index</p>
              <h1 id="page-title">Pokédex Neo</h1>
            </div>
          </div>
          <button
            className={`sound-toggle ${soundEnabled ? 'active' : ''}`}
            type="button"
            onClick={() => setSoundEnabled((value) => !value)}
            aria-pressed={soundEnabled}
          >
            <AudioLines size={18} />
            <span>{soundEnabled ? 'Audio ON' : 'Audio OFF'}</span>
          </button>
        </header>

        <div className="hero-grid">
          <div className="hero-copy">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="hero-kicker"
            >
              VS Code darkness meets Scarlet Violet energy
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              Analiza, filtra y guarda tus Pokémon en una interfaz AAA.
            </motion.h2>
          </div>

          <div className="search-console">
            <label className="search-field" htmlFor="pokemon-search">
              <Search size={20} />
              <input
                id="pokemon-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o clase"
                type="search"
              />
            </label>
            <div className="type-filter" aria-label="Filtros por tipo">
              <button
                className={selectedType === 'all' ? 'chip active' : 'chip'}
                type="button"
                onClick={() => setSelectedType('all')}
              >
                <Moon size={16} />
                Todos
              </button>
              {allTypes.map((type) => {
                const style = typeStyles[type]
                const TypeIcon = style.Icon
                return (
                  <button
                    className={selectedType === type ? 'chip active' : 'chip'}
                    type="button"
                    style={{ '--chip-color': style.primary } as React.CSSProperties}
                    onClick={() => setSelectedType(type)}
                    key={type}
                  >
                    <TypeIcon size={16} />
                    {style.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Estadisticas generales">
        <PremiumStat icon={<Activity size={20} />} label="Registrados" value={pokemons.length} />
        <PremiumStat icon={<Shield size={20} />} label="Tipos activos" value={allTypes.length} />
        <PremiumStat icon={<Swords size={20} />} label="Poder medio" value={averagePower} />
        <PremiumStat icon={<Heart size={20} />} label="Favoritos" value={favorites.length} />
      </section>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.section
            className="pokemon-grid"
            key="skeleton"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -12 }}
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="skeleton-card" key={index} />
            ))}
          </motion.section>
        ) : (
          <motion.section
            className="pokemon-grid"
            key={`${selectedType}-${query}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            aria-live="polite"
          >
            {filteredPokemons.map((pokemon) => (
              <PokemonCard
                favorite={favorites.includes(pokemon.id)}
                key={pokemon.id}
                onFavorite={() => toggleFavorite(pokemon.id)}
                onOpen={() => openDetail(pokemon)}
                pokemon={pokemon}
              />
            ))}
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPokemon ? (
          <PokemonDetail
            favorite={favorites.includes(selectedPokemon.id)}
            onClose={() => setSelectedPokemon(null)}
            onFavorite={() => toggleFavorite(selectedPokemon.id)}
            pokemon={selectedPokemon}
          />
        ) : null}
      </AnimatePresence>
    </main>
  )
}

function BackgroundEffects() {
  return (
    <div className="background-effects" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span
          className="particle"
          style={
            {
              '--delay': `${index * 0.45}s`,
              '--x': `${(index * 47) % 100}%`,
              '--size': `${4 + (index % 5) * 2}px`,
            } as React.CSSProperties
          }
          key={index}
        />
      ))}
    </div>
  )
}

function PremiumStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <motion.article
      className="premium-stat"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 150, damping: 18 }}
    >
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </motion.article>
  )
}

function PokemonCard({
  favorite,
  onFavorite,
  onOpen,
  pokemon,
}: {
  favorite: boolean
  onFavorite: () => void
  onOpen: () => void
  pokemon: Pokemon
}) {
  const style = typeStyles[pokemon.types[0]]
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const glowX = useMotionValue(50)
  const glowY = useMotionValue(50)
  const shine = useMotionTemplate`radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.42), transparent 34%)`

  const onMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    rotateX.set(((y / rect.height) - 0.5) * -12)
    rotateY.set(((x / rect.width) - 0.5) * 12)
    glowX.set((x / rect.width) * 100)
    glowY.set((y / rect.height) * 100)
  }

  const resetTilt = () => {
    rotateX.set(0)
    rotateY.set(0)
    glowX.set(50)
    glowY.set(50)
  }

  return (
    <motion.article
      className="pokemon-card"
      variants={cardVariants}
      onMouseMove={onMove}
      onMouseLeave={resetTilt}
      style={
        {
          rotateX,
          rotateY,
          '--type-primary': style.primary,
          '--type-secondary': style.secondary,
          '--type-deep': style.deep,
        } as React.CSSProperties
      }
    >
      <motion.div className="card-shine" style={{ background: shine }} />
      <div className="card-topline">
        <span className="dex-number">#{pokemon.id.toString().padStart(3, '0')}</span>
        <button
          className={`icon-button ${favorite ? 'favorite' : ''}`}
          type="button"
          onClick={onFavorite}
          aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <button className="card-main" type="button" onClick={onOpen}>
        <div>
          <h3>{pokemon.name}</h3>
          <p>{pokemon.genus}</p>
        </div>
        <motion.img
          alt={pokemon.name}
          className="pokemon-image"
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut' }}
        />
      </button>
      <div className="card-footer">
        <div className="type-pills">
          {pokemon.types.map((type) => {
            const TypeIcon = typeStyles[type].Icon
            return (
              <span
                className="type-pill"
                style={{ '--pill-color': typeStyles[type].primary } as React.CSSProperties}
                key={type}
              >
                <TypeIcon size={14} />
                {typeStyles[type].label}
              </span>
            )
          })}
        </div>
        <button className="open-button" type="button" onClick={onOpen}>
          Ver ficha
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.article>
  )
}

function PokemonDetail({
  favorite,
  onClose,
  onFavorite,
  pokemon,
}: {
  favorite: boolean
  onClose: () => void
  onFavorite: () => void
  pokemon: Pokemon
}) {
  const style = typeStyles[pokemon.types[0]]

  return (
    <motion.div
      className="detail-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha de ${pokemon.name}`}
    >
      <motion.article
        className="detail-panel"
        initial={{ opacity: 0, scale: 0.92, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', stiffness: 170, damping: 22 }}
        style={
          {
            '--type-primary': style.primary,
            '--type-secondary': style.secondary,
            '--type-deep': style.deep,
          } as React.CSSProperties
        }
      >
        <div className="detail-actions">
          <button
            className={`icon-button ${favorite ? 'favorite' : ''}`}
            type="button"
            onClick={onFavorite}
            aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Heart size={20} fill={favorite ? 'currentColor' : 'none'} />
          </button>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar ficha">
            <X size={20} />
          </button>
        </div>

        <div className="detail-hero">
          <motion.img
            alt={pokemon.name}
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
            animate={{ y: [0, -14, 0] }}
            transition={{ repeat: Infinity, duration: 3.1, ease: 'easeInOut' }}
          />
          <div className="detail-copy">
            <span className="dex-number">#{pokemon.id.toString().padStart(3, '0')}</span>
            <h2>{pokemon.name}</h2>
            <p>{pokemon.description}</p>
            <div className="detail-meta">
              <span>Altura {pokemon.height}</span>
              <span>Peso {pokemon.weight}</span>
              <span>{pokemon.ability}</span>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <section className="stat-bars" aria-label="Estadisticas de combate">
            {Object.entries(pokemon.stats).map(([key, value]) => (
              <div className="stat-row" key={key}>
                <span>{statLabels[key as keyof Pokemon['stats']]}</span>
                <div className="bar-track">
                  <motion.div
                    className="bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(value, 150) / 1.5}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
                <strong>{value}</strong>
              </div>
            ))}
          </section>
          <section className="evolution-line" aria-label="Linea evolutiva">
            <h3>Evolucion</h3>
            <div>
              {pokemon.evolution.map((stage, index) => (
                <span className="evolution-node" key={stage}>
                  {stage}
                  {index < pokemon.evolution.length - 1 ? <i aria-hidden="true" /> : null}
                </span>
              ))}
            </div>
          </section>
        </div>
      </motion.article>
    </motion.div>
  )
}

const statLabels: Record<keyof Pokemon['stats'], string> = {
  hp: 'HP',
  attack: 'Ataque',
  defense: 'Defensa',
  speed: 'Velocidad',
}

export default App
