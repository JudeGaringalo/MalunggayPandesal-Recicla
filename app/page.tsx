// app/page.tsx
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative flex flex-col justify-center font-sans">
      
      {/* Background Styling */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#022c16] via-black to-[#064e3b] opacity-90 z-0"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-800/30 via-transparent to-transparent blur-3xl z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent blur-3xl z-0 pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-6 md:px-12 flex flex-col items-center text-center">
        
        <span className="uppercase tracking-[0.4em] text-emerald-400 text-xs md:text-sm mb-6 font-light">
          Green Tech & Sustainability
        </span>
        
        <h1 className="text-6xl md:text-9xl font-serif tracking-tight mb-8 drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
          Recicla.
        </h1>
        
        <p className="text-xl md:text-2xl font-light tracking-wide text-gray-300 max-w-2xl mb-16 leading-relaxed">
          Waste segregation meets AI-verified circular economy.
        </p>
        
        {/* The CTA matching your document's flow */}
        <Link 
          href="/scan" 
          className="group relative px-10 py-4 bg-white text-black overflow-hidden hover:bg-emerald-400 transition-all duration-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <span className="relative z-10 uppercase tracking-[0.2em] font-bold text-sm">
            Start Scanning
          </span>
        </Link>
      </div>
      
      <div className="absolute bottom-8 w-full text-center z-10">
        <p className="text-xs uppercase tracking-widest text-gray-500 font-light">
          By Team Malunggay Pandesal
        </p>
      </div>
    </main>
  );
}