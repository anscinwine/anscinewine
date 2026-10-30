import React, { useEffect, useState, useCallback, useRef } from 'react'
import { initBoard, startFullTextReveal, DISCORD_ID } from './board.ts'

const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : import.meta.env.BASE_URL + '/'

const GALLERY_IMAGES = [
  { src: `${BASE}assets/aistudio/ae7842f240c0c09e99d11_a8581e06.jpg`, alt: 'Forklift Toddler', tilt: -4 },
  { src: `${BASE}assets/aistudio/chill_music_playlist_cover_298f0e0b.jpg`, alt: 'Bart Simpson Chill Music', tilt: 3 },
  { src: `${BASE}assets/aistudio/44e3bb63b951390f60404_5587439c.jpg`, alt: 'Rose Garden', tilt: -3 },
  { src: `${BASE}assets/aistudio/download__1__cac34952.jpg`, alt: 'SpongeBob Headphones', tilt: 5 },
  { src: `${BASE}assets/aistudio/e399d71fd52d55730c3c3_d39afbc2.jpg`, alt: 'Mansion Villa', tilt: -2 },
  { src: `${BASE}assets/aistudio/Time_To_Lock_In_Sticker_987a7671.jpg`, alt: 'Time To Lock In', tilt: 4 },
  { src: `${BASE}assets/aistudio/f730e4b6e68466da3f952_f73bb4fc.jpg`, alt: 'Jacaranda Tree', tilt: -5 },
  { src: `${BASE}assets/aistudio/Jarvis__Unshit_My_Pants_Sticker_4a7a4b08.jpg`, alt: 'Jarvis Sticker', tilt: 3 },
  { src: `${BASE}assets/aistudio/a3971c151e279e79c7365_173b736c.jpg`, alt: 'Purple Blossom Avenue', tilt: -3 },
  { src: `${BASE}assets/aistudio/Ocean_93b04e73.jpg`, alt: 'Ocean Coastline', tilt: 4 },
  { src: `${BASE}assets/aistudio/A_Cute_Concoction_of_Wholesome_Feline_Posts_That____3fb63cc9.jpg`, alt: 'Cute Feline Post', tilt: -4 },
  { src: `${BASE}assets/aistudio/Cape_Town_9ab6ad2e.jpg`, alt: 'Cape Town View', tilt: 2 },
  { src: `${BASE}assets/aistudio/download_3283805f.jpg`, alt: 'Cute Kitten', tilt: -3 },
]

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [copiedToast, setCopiedToast] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)
  const [isPhotoHovered, setIsPhotoHovered] = useState(false)
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)
  const isScrollingRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const copyDiscordId = (e: React.MouseEvent) => {
    e.preventDefault()
    navigator.clipboard?.writeText(DISCORD_ID).catch(() => {})
    setCopiedToast(true)
    setTimeout(() => setCopiedToast(false), 2500)
    window.open(`https://discord.com/users/${DISCORD_ID}`, '_blank', 'noopener')
  }

  // Smooth slide switch: zero reload, keeps text and icons permanently ready
  const goToPage = useCallback((pageIndex: number) => {
    setCurrentPage(pageIndex)
  }, [])

  useEffect(() => {
    document.title = 'anscinwine'
    initBoard()

    if (videoRef.current) {
      videoRef.current.muted = true
      videoRef.current.defaultMuted = true
      videoRef.current.play().catch(() => {})
    }

    const tryPlayVideo = () => {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.muted = true
        videoRef.current.play().catch(() => {})
      }
    }
    window.addEventListener('click', tryPlayVideo, { once: true, passive: true })
    window.addEventListener('touchstart', tryPlayVideo, { once: true, passive: true })

    const timer = setTimeout(() => {
      setIsLoaded(true)
      startFullTextReveal()
    }, 100)

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImg(null)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToPage(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPage(0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Mouse wheel / trackpad scroll navigation to slide between pages
    const handleWheel = (e: WheelEvent) => {
      if (isScrollingRef.current) return
      if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
        isScrollingRef.current = true
        setTimeout(() => {
          isScrollingRef.current = false
        }, 500)
        if (e.deltaY > 0 || e.deltaX > 0) {
          goToPage(1)
        } else {
          goToPage(0)
        }
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: true })

    // Mobile touch swipe navigation
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      touchStartX.current = e.touches[0].clientX
    }
    const handleTouchEnd = (e: TouchEvent) => {
      const diffY = touchStartY.current - e.changedTouches[0].clientY
      const diffX = touchStartX.current - e.changedTouches[0].clientX
      if (Math.abs(diffX) > 40 || Math.abs(diffY) > 40) {
        if (diffX > 40 || diffY > 40) {
          goToPage(1)
        } else {
          goToPage(0)
        }
      }
    }
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('click', tryPlayVideo)
      window.removeEventListener('touchstart', tryPlayVideo)
    }
  }, [goToPage])

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#0e1014]">
      {/* Background Animated Video from Pinterest */}
      <div className="bg-video-wrap">
        <video
          ref={videoRef}
          className="bg-video select-none pointer-events-none"
          autoPlay
          loop
          muted
          playsInline
          poster={`${BASE}assets/pinterest_bg.jpg`}
        >
          <source src={`${BASE}assets/pinterest_bg.mp4`} type="video/mp4" />
        </video>
        <div className="bg-overlay" />
      </div>

      {/* 100% Full Screen Board */}
      <main id="board" className="show ready">
        <div id="content">
          {/* Language Switcher */}
          <button
            id="langsw"
            className="langsw"
            role="switch"
            aria-checked="false"
            aria-label="Language: EN / VI"
          >
            <span>EN</span>
            <span>VI</span>
            <i />
          </button>

          {/* Slider Viewport with Smooth Carousel */}
          <div className="slider-viewport">
            <div
              className="slider-track"
              style={{
                transform: currentPage === 0 ? 'translateX(0%)' : 'translateX(-50%)',
              }}
            >
              {/* ================= PAGE 1: Profile, Snowman Player, Bio & Timezone ================= */}
              <div className={`slide ${currentPage === 0 ? 'active-slide' : ''}`}>
                <div className="slide-inner">
                  {/* Heading */}
                  <h1 data-i18n="hello">Xin chào! Mình là anscinwine</h1>

                  {/* Intro Text in Clean Prose */}
                  <p data-i18n="intro">
                    Mình 15 tuổi và rất thích chơi game lúc rảnh rỗi, nhất là <b>GTA V</b>, <b>Roblox</b>, <b>Stardew Valley</b> và <b>ETS2</b>. Ngoài chơi game, mình thích nghe nhạc thư giãn, trò chuyện cùng bạn bè trên Discord và tìm tòi học lập trình.
                  </p>

                  {/* Snowman Vinyl Music Player - placed on Page 1 */}
                  <div className="my-6">
                    <div
                      className="player"
                      id="player"
                      role="button"
                      tabIndex={0}
                      aria-label="Music: Atlantis by Seafret"
                    >
                      <div className="vinyl">
                        <div
                          className="label"
                          style={{
                            backgroundImage: `url(${BASE}music/atlantis.jpg)`,
                          }}
                        />
                      </div>
                      <div className="pinfo">
                        <b>Atlantis</b>
                        <span>Seafret</span>
                      </div>
                    </div>
                  </div>

                  {/* Timezone Information */}
                  <div className="tz">
                    <p data-i18n="tzOwn">Múi giờ của mình là <b>UTC+2</b>.</p>
                    <p id="tz-you">Đang tính múi giờ...</p>
                    <p id="tz-diff"></p>
                  </div>

                  {/* Programming Languages */}
                  <p className="learn" data-i18n="learn">
                    Hiện mình đang học C++, Java và Python. Mình cũng nghịch thử Assembly cho vui, nhưng nó khó quá nên chắc sắp bỏ rồi.
                  </p>
                </div>
              </div>

              {/* ================= PAGE 2: Social Platforms + Tilted Photo Ribbon ================= */}
              <div className={`slide ${currentPage === 1 ? 'active-slide' : ''}`}>
                <div className="slide-inner">
                  {/* Page 2 Title */}
                  <h2 data-i18n="platformsTitle" className="platforms-title">
                    Tìm mình trên các nền tảng này:
                  </h2>

                  {/* Social Apps */}
                  <div className="socials">
                    {/* Roblox */}
                    <a
                      className="social glass"
                      style={{ ['--i' as any]: 0 }}
                      href="https://www.roblox.com/users/profile?username=jabberwock_keyas"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Roblox: jabberwock_keyas"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M18.926 23.998 0 18.892 5.075 0 24 5.108ZM15.348 10.09l-5.282-1.453-1.414 5.273 5.282 1.453z" />
                      </svg>
                      <small>Roblox</small>
                    </a>

                    {/* Discord */}
                    <a
                      className="social glass"
                      id="discord"
                      style={{ ['--i' as any]: 1 }}
                      href={`https://discord.com/users/${DISCORD_ID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-copy={DISCORD_ID}
                      onClick={copyDiscordId}
                      aria-label={`Discord: ${DISCORD_ID}`}
                      title={`Discord ID: ${DISCORD_ID} (Click to copy & open profile)`}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M19.3 5.3A16.6 16.6 0 0 0 15.2 4l-.5 1a15.4 15.4 0 0 0-5.4 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C2 9.2 1.3 13 1.6 16.7a16.7 16.7 0 0 0 5 2.5l1.1-1.7a10.6 10.6 0 0 1-1.7-.8l.4-.3a11.9 11.9 0 0 0 10.2 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.7a16.7 16.7 0 0 0 5-2.5c.4-4.3-.7-8.1-3.1-11.4ZM8.7 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
                      </svg>
                      <small>Discord</small>
                    </a>

                    {/* TikTok */}
                    <a
                      className="social glass"
                      style={{ ['--i' as any]: 2 }}
                      href="https://www.tiktok.com/@ar_dargler_view"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok: ar_dargler_view"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M16.6 2h-3.2v13.3a2.9 2.9 0 1 1-2-2.8V9.2a6.1 6.1 0 1 0 5.2 6V8.8a7.4 7.4 0 0 0 4.3 1.4V7a4.3 4.3 0 0 1-4.3-5Z" />
                      </svg>
                      <small>TikTok</small>
                    </a>

                    {/* Instagram */}
                    <a
                      className="social glass"
                      style={{ ['--i' as any]: 3 }}
                      href="https://www.instagram.com/jabbersssll"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram: jabbersssll"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.2-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
                      </svg>
                      <small>Instagram</small>
                    </a>
                  </div>

                  {/* Horizontal Looping Photo Ribbon with Tilted Images */}
                  <div className="photo-gallery-section">
                    <div className="photo-marquee-container">
                      <div className={`photo-marquee-track ${isPhotoHovered ? 'is-paused' : ''}`}>
                        {[...GALLERY_IMAGES, ...GALLERY_IMAGES].map((img, idx) => (
                          <div
                            key={idx}
                            className="photo-item"
                            style={{ transform: `rotate(${img.tilt}deg)` }}
                            onClick={() => setLightboxImg(img.src)}
                            onMouseEnter={() => setIsPhotoHovered(true)}
                            onMouseLeave={() => setIsPhotoHovered(false)}
                            role="button"
                            tabIndex={0}
                            title="Bấm để phóng to"
                            onKeyDown={e => {
                              if (e.key === 'Enter') setLightboxImg(img.src)
                            }}
                          >
                            <img src={img.src} alt={img.alt} loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Glowing Dots Navigation with Sliding Active White Indicator */}
          <div className="dots-nav" role="tablist" aria-label="Page Navigation">
            <div className="dots-wrapper">
              {/* Sliding white glowing dot indicator */}
              <div
                className="dot-indicator"
                style={{
                  transform: currentPage === 0 ? 'translateX(0px)' : 'translateX(15.5px)',
                }}
              />
              <button
                className={`dot-item ${currentPage === 0 ? 'selected' : ''}`}
                onClick={() => goToPage(0)}
                role="tab"
                aria-selected={currentPage === 0}
                aria-label="Trang 1: Giới thiệu & Nhạc"
              />
              <button
                className={`dot-item ${currentPage === 1 ? 'selected' : ''}`}
                onClick={() => goToPage(1)}
                role="tab"
                aria-selected={currentPage === 1}
                aria-label="Trang 2: Mạng xã hội & Ảnh"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal for Full Image View */}
      {lightboxImg && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxImg(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="lightbox-content"
            onClick={e => e.stopPropagation()}
          >
            <img src={lightboxImg} alt="Enlarged view" />
            <button
              className="lightbox-close"
              onClick={() => setLightboxImg(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div id="toast" className={`glass ${copiedToast ? 'show' : ''}`}>
        Đã copy ID Discord: {DISCORD_ID}
      </div>

      {/* Loading Screen Overlay - instant 100% */}
      <div id="loading" className={isLoaded ? 'done' : ''}>
        <div className="box text-center">
          <div className="flex items-center justify-center gap-1.5 text-white/75 font-medium tracking-widest text-[10px] uppercase mb-1.5">
            <span data-i18n="load_total" className="text-white/75 text-[10px]">Đang tải</span>
            <b id="pct" className="text-white text-[10px] font-semibold">100%</b>
          </div>
          <div className="w-24 h-[2px] bg-white/15 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-white/80"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
