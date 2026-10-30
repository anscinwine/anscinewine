// Background music: auto play bypass with Web Audio API unlock and capture-phase listener
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

  let isAudioUnlocked = false
  let userPaused = false
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
  a.addEventListener('pause', () => {
    if (userPaused) set(false)
  })

  // Web Audio Context priming to unlock browser audio pipeline
  const tryWebAudioUnlock = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {})
        }
        // Play brief silent buffer
        const buffer = ctx.createBuffer(1, 1, 22050)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        source.start(0)
      }
    } catch {}
  }

  // 1. Try immediate full unmuted play on page load
  const attemptDirectAutoplay = () => {
    tryWebAudioUnlock()
    a.muted = false
    a.volume = 0.95
    const playPromise = a.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isAudioUnlocked = true
          set(true)
        })
        .catch(() => {
          // Browser blocked unmuted autoplay -> play muted to spin vinyl, unlock on first gesture
          a.muted = true
          a.play()
            .then(() => {
              card.classList.add('playing')
              say('music_playing')
            })
            .catch(() => {})
        })
    }
  }

  attemptDirectAutoplay()

  // 2. Global capture-phase unlock on ANY user gesture (click, tap, key, wheel, swipe)
  const unlockEvents = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown', 'mousedown']
  const handleUnlock = () => {
    if (isAudioUnlocked || userPaused) return
    tryWebAudioUnlock()
    a.muted = false
    a.volume = 0.95
    a.play()
      .then(() => {
        isAudioUnlocked = true
        set(true)
        cleanupListeners()
      })
      .catch(() => {
        // If still blocked, keep listeners active for next gesture
      })
  }

  const cleanupListeners = () => {
    unlockEvents.forEach(evt => {
      window.removeEventListener(evt, handleUnlock, true)
      document.removeEventListener(evt, handleUnlock, true)
    })
  }

  unlockEvents.forEach(evt => {
    window.addEventListener(evt, handleUnlock, { capture: true, passive: true })
    document.addEventListener(evt, handleUnlock, { capture: true, passive: true })
  })

  // Start spinning vinyl immediately
  card.classList.add('playing')
  say('music_playing')

  const toggle = () => {
    if (!ok) {
      window.open(NCT, '_blank', 'noopener')
      return
    }
    tryWebAudioUnlock()
    if (a.paused || a.muted) {
      userPaused = false
      a.muted = false
      a.volume = 0.95
      a.play()
        .then(() => {
          isAudioUnlocked = true
          set(true)
        })
        .catch(() => {})
    } else {
      userPaused = true
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
      a.volume = 0.95
    },
    toggle,
    setLanguageTr: () => {
      set(!a.paused && !a.muted)
    },
  }
}

