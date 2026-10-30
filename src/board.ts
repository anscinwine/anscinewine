import { initMusic } from './music.ts'

const OWNER_UTC = 2

// User's Discord ID: 1532928257173884930
export const DISCORD_ID = '1532928257173884930'

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','))
const utcLabel = (o: number) => 'UTC' + (o >= 0 ? '+' : '−') + fmt(Math.abs(o))
const link = (u: string, t: string) => `<a class="lang" href="${u}" target="_blank" rel="noopener">${t}</a>`
const W = 'https://en.wikipedia.org/wiki/'
const langs = `${link(W + 'C%2B%2B', 'C++')}, ${link(W + 'Java_(programming_language)', 'Java')}`
const py = link(W + 'Python_(programming_language)', 'Python')
const asm = link(W + 'Assembly_language', 'Assembly')

export const STR: Record<string, Record<string, any>> = {
  en: {
    hello: "Hello! I'm anscinwine",
    intro: `I'm 15 and I really like gaming in my free time, especially <b>GTA V</b>, <b>Roblox</b>, <b>Stardew Valley</b>, and <b>ETS2</b>. Aside from gaming, I enjoy listening to music, chatting with friends on Discord, and exploring programming.`,
    platformsTitle: `Find me on these platforms:`,
    galleryTitle: `Gallery & Favorites`,
    tzOwn: `My timezone is <b>UTC+2</b>.`,
    learn: `Right now I'm learning ${langs} and ${py}. I also messed around with ${asm} for fun, but it's really hard, so I'll probably drop it soon.`,
    copied: (u: string) => `Copied Discord ID: ${u}`,
    tzYou: (o: number) => `Your timezone is ${utcLabel(o)}.`,
    tzSame: `We're in the same timezone, not a single hour apart!`,
    tzDiff: (d: number, ahead: boolean) =>
      `We're about ${fmt(Math.abs(d))} hours apart! (you're ${ahead ? 'ahead of me' : 'behind me'})`,
    load_total: 'Loading',
    music_playing: 'Now playing',
    music_paused: 'Paused · tap to play',
    music_nofile: 'Tap to open on NhacCuaTui',
  },
  vi: {
    hello: 'Xin chào! Mình là anscinwine',
    intro: `Mình 15 tuổi và rất thích chơi game lúc rảnh rỗi, nhất là <b>GTA V</b>, <b>Roblox</b>, <b>Stardew Valley</b> và <b>ETS2</b>. Ngoài chơi game, mình thích nghe nhạc thư giãn, trò chuyện cùng bạn bè trên Discord và tìm tòi học lập trình.`,
    platformsTitle: `Tìm mình trên các nền tảng này:`,
    galleryTitle: `Bộ sưu tập ảnh & Meme`,
    tzOwn: `Múi giờ của mình là <b>UTC+2</b>.`,
    learn: `Hiện mình đang học ${langs} và ${py}. Mình cũng nghịch thử ${asm} cho vui, nhưng nó khó quá nên chắc sắp bỏ rồi.`,
    copied: (u: string) => `Đã copy ID Discord: ${u}`,
    tzYou: (o: number) => `Múi giờ của bạn là ${utcLabel(o)}.`,
    tzSame: 'Chúng ta cùng múi giờ, không lệch giờ nào!',
    tzDiff: (d: number, ahead: boolean) =>
      `Chúng ta lệch nhau khoảng ${fmt(Math.abs(d))} tiếng! (bạn ${ahead ? 'sớm hơn' : 'muộn hơn'} mình)`,
    load_total: 'Đang tải',
    music_playing: 'Đang phát',
    music_paused: 'Tạm dừng · bấm để phát',
    music_nofile: 'Bấm để mở trên NhacCuaTui',
  },
}

let lang = 'vi' // default to Vietnamese
try {
  lang = localStorage.getItem('lang') || 'vi'
} catch {}

export const tr = (k: string, ...a: any[]) => {
  const v = STR[lang]?.[k] ?? STR['en']?.[k]
  return typeof v === 'function' ? v(...a) : v
}

// Zero-jitter Typewriter: pre-renders full text with invisible character spans
export function typeWriterSmooth(
  el: HTMLElement,
  html: string,
  charSpeedMs = 22,
  onComplete?: () => void
) {
  if ((el as any)._typeTimer) clearTimeout((el as any)._typeTimer)

  el.classList.add('revealed')
  el.style.opacity = '1'

  let out = ''
  let inTag = false

  for (let i = 0; i < html.length; i++) {
    const ch = html[i]
    if (ch === '<') {
      inTag = true
      out += '<'
    } else if (ch === '>') {
      inTag = false
      out += '>'
    } else if (inTag) {
      out += ch
    } else {
      out += `<span class="t-char" style="opacity:0">${ch}</span>`
    }
  }

  el.innerHTML = out
  const spans = el.querySelectorAll('.t-char') as NodeListOf<HTMLElement>

  let current = 0
  function step() {
    if (current < spans.length) {
      spans[current].style.opacity = '1'
      current++
      ;(el as any)._typeTimer = setTimeout(step, charSpeedMs)
    } else {
      el.innerHTML = html
      onComplete?.()
    }
  }

  step()
}

// Scramble Morph for Language Switch: characters actively scramble wildly and resolve slowly into new language
export function scrambleMorph(el: HTMLElement, html: string, delay = 0, duration = 1100) {
  if ((el as any)._raf) cancelAnimationFrame((el as any)._raf)
  el.innerHTML = html
  const nodes: Node[] = []
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  while (w.nextNode()) nodes.push(w.currentNode)
  const fin = nodes.map(n => n.nodeValue || '')
  const total = fin.reduce((a, s) => a + s.length, 0) || 1
  const G = 'abcdefghklmnopqrstuvxyzăâêôơư0123456789'
  const t0 = performance.now() + delay

  nodes.forEach((n, ni) => {
    const s = fin[ni]
    let sc = ''
    for (let i = 0; i < s.length; i++) {
      sc += /[\p{L}\p{N}]/u.test(s[i]) ? G[(i * 7 + ni * 11) % G.length] : s[i]
    }
    n.nodeValue = sc
  })

  const tick = (now: number) => {
    const p = now - t0
    if (p < 0) {
      ;(el as any)._raf = requestAnimationFrame(tick)
      return
    }
    let off = 0
    let done = true
    nodes.forEach((n, ni) => {
      const s = fin[ni]
      let out = ''
      for (let i = 0; i < s.length; i++) {
        const c = s[i]
        const at = ((off + i) / total) * duration * 0.72
        if (!/[\p{L}\p{N}]/u.test(c) || p >= at + 200) {
          out += c
        } else {
          done = false
          out += G[(Math.floor(now / 45) * 31 + (off + i) * 7) % G.length]
        }
      }
      n.nodeValue = out
      off += s.length
    })
    if (!done) (el as any)._raf = requestAnimationFrame(tick)
  }
  ;(el as any)._raf = requestAnimationFrame(tick)
}

let hasRevealedOnce = false

// Initial load entry: runs strictly ONCE on page load and never again
export function startFullTextReveal() {
  if (hasRevealedOnce) return
  hasRevealedOnce = true

  const el = document.getElementById('board')
  if (!el) return

  el.classList.add('show', 'ready')
  el.style.pointerEvents = 'auto'

  const viewer = -new Date().getTimezoneOffset() / 60
  const diff = viewer - OWNER_UTC

  const h1 = el.querySelector('h1[data-i18n="hello"]') as HTMLElement | null
  const intro = el.querySelector('p[data-i18n="intro"]') as HTMLElement | null
  const player = document.getElementById('player')
  const tz = el.querySelector('.tz') as HTMLElement | null
  const tzOwn = el.querySelector('p[data-i18n="tzOwn"]') as HTMLElement | null
  const tzYou = document.getElementById('tz-you')
  const tzDiff = document.getElementById('tz-diff')
  const learn = el.querySelector('p.learn') as HTMLElement | null

  // Ensure Page 2 items are revealed and ready so switching back/forth never reloads
  el.querySelectorAll('.social, .platforms-title').forEach(e => e.classList.add('revealed'))

  // 1. Heading ("Xin chào! Mình là anscinwine")
  if (h1) {
    typeWriterSmooth(h1, tr('hello'), 28, () => {
      // 2. Intro in natural articulate prose
      if (intro) {
        setTimeout(() => {
          typeWriterSmooth(intro, tr('intro'), 18, () => {
            // 3. Music player pops in on Page 1
            if (player) player.classList.add('revealed')

            // 4. Timezone block
            setTimeout(() => {
              if (tz) tz.classList.add('revealed')
              if (tzOwn) {
                typeWriterSmooth(tzOwn, tr('tzOwn'), 18, () => {
                  if (tzYou) {
                    typeWriterSmooth(tzYou, tr('tzYou', viewer), 18, () => {
                      const diffText = diff === 0 ? tr('tzSame') : tr('tzDiff', diff, diff > 0)
                      if (tzDiff) {
                        typeWriterSmooth(tzDiff, diffText, 18, () => {
                          // 5. Learning block
                          if (learn) {
                            setTimeout(() => {
                              typeWriterSmooth(learn, tr('learn'), 16)
                            }, 100)
                          }
                        })
                      }
                    })
                  }
                })
              }
            }, 200)
          })
        }, 100)
      }
    })
  }
}

// When switching language: scramble letters wildly and resolve slowly into new language!
export function applyLang(animate = false) {
  document.documentElement.lang = lang
  const viewer = -new Date().getTimezoneOffset() / 60
  const diff = viewer - OWNER_UTC

  const el = document.getElementById('board')
  if (animate && el) {
    el.querySelectorAll('.social, .player, h1, h2, p, .tz, .learn').forEach(e =>
      e.classList.add('revealed')
    )
  }

  const set = (targetEl: HTMLElement | null, html: string, delay = 0) => {
    if (!targetEl) return
    if (animate) {
      scrambleMorph(targetEl, html, delay, 1100)
    } else {
      targetEl.innerHTML = html
    }
  }

  document.querySelectorAll('[data-i18n]').forEach((e, i) => {
    const target = e as HTMLElement
    set(target, tr(target.dataset.i18n || ''), i * 35)
  })

  set(document.getElementById('tz-you'), tr('tzYou', viewer), 100)
  set(document.getElementById('tz-diff'), diff === 0 ? tr('tzSame') : tr('tzDiff', diff, diff > 0), 140)

  const sw = document.getElementById('langsw')
  if (sw) {
    sw.setAttribute('aria-checked', String(lang === 'vi'))
    sw.classList.toggle('vi', lang === 'vi')
  }
}

function setupLangSwitch(onChange?: () => void) {
  const sw = document.getElementById('langsw')
  if (!sw) return
  sw.addEventListener('click', () => {
    lang = lang === 'en' ? 'vi' : 'en'
    try {
      localStorage.setItem('lang', lang)
    } catch {}
    applyLang(true)
    onChange?.()
  })
}

function setupDiscord() {
  const a = document.getElementById('discord') as HTMLAnchorElement | null
  if (!a) return
  a.href = `https://discord.com/users/${DISCORD_ID}`
  a.dataset.copy = DISCORD_ID
  a.setAttribute('aria-label', `Discord ID: ${DISCORD_ID}`)
}

export function initBoard() {
  const el = document.getElementById('board')
  if (!el) return { update: () => {} }

  setupDiscord()

  setupLangSwitch()
  applyLang(false)

  const music = initMusic(tr)

  el.style.opacity = '1'
  el.classList.add('show', 'ready')
  el.style.pointerEvents = 'auto'

  return {
    music,
    update: () => {
      music.update(1.0)
    },
  }
}
