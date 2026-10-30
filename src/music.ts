// Background music: auto 100% play immediately on load with spinning vinyl
const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : import.meta.env.BASE_URL + '/'
const SRC = BASE + 'music/atlantis.mp3'
const NCT = 'https://www.nhaccuatui.com/song/AGZWBp48LlnZ'

export function initMusic(tr: (k: string, ...a: any[]) => string) {
  const card = document.getElementById('player')
  if (!card) return { update: () => {}, toggle: () => {}, setLanguageTr: () => {} }

  const stat = card.querySelector('.pstat') as HTMLElement | null
  const a = new Audio(SRC)
  a.loop = true
  a.preload = 'auto'
  a.volume = 0.95

  let want = true
  let ok = true

  const say = (k: string) => {
    if (stat) {
      stat.dataset.i18n = k
      stat.innerHTML = tr(k)
    }
  }

  const set = (on: boolean) => {
    card.classList.toggle('playing', on)
    say(on ? 'music_playing' : ok ? 'music_paused' : 'music_nofile')
  }

  a.addEventListener('error', () => {
    ok = false
    set(false)
  })
  a.addEventListener('playing', () => set(true))
  a.addEventListener('pause', () => set(false))

  // 100% auto play immediately on load!
  const startAutoplay = () => {
    if (!want || !ok) return
    a.volume = 0.95
    a.muted = false
    a.play()
      .then(() => {
        set(true)
      })
      .catch(() => {
        // Fallback for browsers with strict gesture policy: start muted so vinyl spins, then unmute on first gesture
        a.muted = true
        a.play()
          .then(() => {
            card.classList.add('playing')
            say('music_playing')
          })
          .catch(() => {})
      })
  }

  startAutoplay()

  // Instantly unmute and ensure full sound on user interaction
  const unlockAudio = () => {
    if (a.muted || a.paused) {
      a.muted = false
      a.volume = 0.95
      a.play().then(() => set(true)).catch(() => {})
    }
  }

  const userEvents = ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll', 'mousemove']
  const onFirstInteraction = () => {
    unlockAudio()
    userEvents.forEach(e => window.removeEventListener(e, onFirstInteraction, true))
  }
  userEvents.forEach(e => window.addEventListener(e, onFirstInteraction, { capture: true, passive: true }))

  // Show playing state and start vinyl spinning right away!
  card.classList.add('playing')
  say('music_playing')

  const toggle = () => {
    if (!ok) {
      window.open(NCT, '_blank', 'noopener')
      return
    }
    if (a.paused || a.muted) {
      want = true
      a.muted = false
      a.volume = 0.95
      a.play().then(() => set(true)).catch(() => {})
    } else {
      want = false
      a.pause()
      set(false)
    }
  }

  card.addEventListener('click', toggle)
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  })

  return {
    update: (_k: number) => {
      // Keep volume full (0.95) since camera is always at the board
      a.volume = 0.95
    },
    toggle,
    setLanguageTr: () => {
      set(!a.paused && !a.muted)
    },
  }
}
