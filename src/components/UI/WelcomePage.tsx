// Mesmerizing Space Welcome Page featuring Pentagram Week 2026, Wave Gradient, and Carousel Imagery
import React, { useState, useEffect } from 'react';
import { InteractiveCosmicCanvas } from './InteractiveCosmicCanvas';
import { KeyRound, ChevronRight, ChevronLeft, Calendar, Sparkles } from 'lucide-react';

interface WelcomePageProps {
  onEnterLogin: () => void;
  onQuickTrial: () => void;
}

const CAROUSEL_SLIDES = [
  {
    id: 'avartan-banner',
    image: '/assets/avartan_banner.png',
    title: 'AVARTAN',
    subtitle: 'PENTAGRAM WEEK 2026',
    date: '28th - 31st October 2026',
    tag: 'FLAGSHIP EVENT'
  },
  {
    id: 'pentagram-logo',
    image: '/assets/pentagram_logo.png',
    title: 'PENTAGRAM',
    subtitle: 'ANNUAL TECHFEST CONVERGENCE',
    date: '28th - 31st October 2026',
    tag: 'THE FESTIVAL'
  },
  {
    id: 'wave-gradient',
    image: '/assets/wave_gradient.png',
    title: 'SYNCHRONICITY',
    subtitle: 'AUDIO-VISUAL HARMONIC DIMENSION',
    date: '28th - 31st October 2026',
    tag: 'EXPERIENCE'
  }
];

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnterLogin }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = CAROUSEL_SLIDES[currentSlide];

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-between overflow-hidden bg-space-950 text-slate-100 select-none">
      {/* 1. Stagnant Galaxy / Cosmic Starfield Background with Cursor-Responsive Stars */}
      <InteractiveCosmicCanvas />

      {/* 2. Blurred Ambient Gradient Backdrop derived from the current slide */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-35">
        <img
          key={slide.image}
          src={slide.image}
          alt="Ambient blur"
          className="w-[120vw] h-[120vh] object-cover filter blur-[90px] scale-125 transition-all duration-1000"
        />
      </div>

      {/* 3. Subtle dark vignette overlay to preserve high readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-space-950/80 via-space-950/40 to-space-950/90 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between border-b border-cyan-500/20 backdrop-blur-md bg-space-950/40">
        <div className="flex items-center gap-3">
          <img
            src="/assets/pentagram_logo.png"
            alt="Pentagram Logo"
            className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
          />
          <div className="flex flex-col">
            <span className="font-orbit font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-indigo-300 text-lg">
              AVARTAN
            </span>
            <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
              Pentagram Week 2026 • 28th - 31st October
            </span>
          </div>
        </div>

        <button
          onClick={onEnterLogin}
          className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/20 text-xs font-orbit font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
          <span>Login / Register</span>
        </button>
      </header>

      {/* Main Body: Sliding Carousel with Blurred Backdrop Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full">
        {/* Carousel Showcase Card */}
        <div className="relative w-full max-w-2xl rounded-3xl bg-space-900/60 border border-cyan-500/30 p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,243,255,0.2)] flex flex-col items-center text-center overflow-hidden transition-all duration-700">
          
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-[11px] font-mono tracking-wider mb-4 shadow-[0_0_15px_rgba(0,243,255,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{slide.tag}</span>
          </div>

          {/* Central Image with Soft Glow */}
          <div className="relative w-full h-52 sm:h-64 flex items-center justify-center my-2 overflow-hidden rounded-2xl bg-black/40 border border-cyan-500/20">
            <img
              key={slide.id}
              src={slide.image}
              alt={slide.title}
              className="max-h-full max-w-full object-contain p-3 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-700 hover:scale-105"
            />
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-3xl sm:text-5xl font-orbit font-extrabold tracking-tight text-white mt-4 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
            {slide.title}
          </h1>

          <p className="text-sm sm:text-base font-orbit font-semibold text-cyan-300 tracking-wider mt-1">
            {slide.subtitle}
          </p>

          {/* Date Information */}
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-xl bg-space-950/70 border border-cyan-500/20 text-slate-300 font-mono text-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{slide.date}</span>
          </div>

          {/* Carousel Navigation Arrows */}
          <button
            onClick={() => setCurrentSlide((currentSlide - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-space-950/70 border border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 transition-all cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentSlide((currentSlide + 1) % CAROUSEL_SLIDES.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-space-950/70 border border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 transition-all cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Indicator Dots */}
          <div className="flex gap-2 mt-5">
            {CAROUSEL_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide
                    ? 'w-8 bg-cyan-400 shadow-[0_0_10px_#00f3ff]'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Enter Action Button */}
          <button
            onClick={onEnterLogin}
            className="mt-6 w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-orbit font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_35px_rgba(0,243,255,0.45)] cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-slate-950" />
            <span>ENTER MISSION PORTAL</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full px-6 py-4 flex items-center justify-between text-xs text-slate-500 font-mono border-t border-cyan-500/10 backdrop-blur-sm bg-space-950/40">
        <div>
          <span>AVARTAN • PENTAGRAM WEEK 2026</span>
        </div>
        <div>
          <span>28th - 31st October 2026</span>
        </div>
      </footer>
    </div>
  );
};
