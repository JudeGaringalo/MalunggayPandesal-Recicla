"use client";

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; 
import { ReactLenis } from '@studio-freight/react-lenis';
import VineScrollbar from './components/VineScrollbar';
import BackToTop from './components/BackToTop'; 

const techLogos = [
  { name: "Next.js", src: "/images/next.png" },
  { name: "Tailwind CSS", src: "/images/tailwind.png" },
  { name: "Supabase", src: "/images/supabase.png" },
  { name: "TensorFlow", src: "/images/tensorflow.png" },
  { name: "Teachable Machine", src: "/images/teachable.png" },
  { name: "Vercel", src: "/images/vercel.png" },
  { name: "Node.js", src: "/images/node.png" },
  { name: "React", src: "/images/react.png" },
  { name: "Figma", src: "/images/figma.png" },
  { name: "Groq API", src: "/images/groq.png" },
  { name: "Llama AI", src: "/images/llama.png" },
  { name: "Gsap", src: "/images/gsap.jpg" },
];

const FEATURES = [
  {
    id: "01",
    title: "Zero-Latency AI",
    icon: "/images/Frame 59.png",
    bgColor: "bg-[#81915A]",
    description: "No waiting for server uploads. Our lightweight model runs directly in your browser for instant identification.",
    image: "/images/feature-1.png"
  },
  {
    id: "02",
    title: "Instant Valuation",
    icon: "/images/Frame 61.png",
    bgColor: "bg-[#404828]",
    description: "We provide real-time estimates of an item’s market value (e.g., copper or aluminum), giving you a tangible reason to recycle rather than discard.",
    image: "/images/feature-2.png"
  },
  {
    id: "03",
    title: "Hazard Routing",
    icon: "/images/Frame 60.png",
    bgColor: "bg-[#404828]",
    description: "Unlike general recycling apps, we prioritize safety by flagging toxic materials like bloated batteries and routing them to specialized disposal centers instead of general bins.",
    image: "/images/feature-3.png"
  },
  {
    id: "04",
    title: "Frictionless Access",
    icon: "/images/Frame 62.png",
    bgColor: "bg-[#404828]",
    description: "No app store downloads required. Users can transition from curiosity to a live scan in under three clicks.",
    image: "/images/feature-4.png"
  }
]; 

const FadeIn = ({ 
  children, 
  delay = 0, 
  className = "", 
  style = {} 
}: { 
  children: React.ReactNode, 
  delay?: number, 
  className?: string, 
  style?: React.CSSProperties 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }} 
    >
      {children}
    </div>
  );
};

const TextScrollReveal = ({ text }: { text: string }) => {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const startReveal = windowHeight * 0.85; 
      const endReveal = windowHeight * 0.35;
      
      let currentProgress = (startReveal - rect.top) / (startReveal - endReveal);
      currentProgress = Math.max(0, Math.min(1, currentProgress));
      setProgress(currentProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); 
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const words = text.split(" ");

  return (
    <p 
      ref={containerRef} 
      className="text-[#4A4A4A] text-[16px] sm:text-xl md:text-3xl leading-relaxed font-medium text-center"
    >
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + (1 / words.length);
        
        let opacity = 0.15; 
        if (progress >= end) {
          opacity = 1;
        } else if (progress > start) {
          opacity = 0.15 + ((progress - start) / (end - start)) * 0.85;
        }

        return (
          <span 
            key={i} 
            style={{ opacity }} 
            className="transition-opacity duration-75 inline-block mr-[0.25em]"
          >
            {word}
          </span>
        );
      })}
    </p>
  );
};

export default function LandingPage(): React.JSX.Element {
  const router = useRouter(); 
  const [activeArea, setActiveArea] = useState(0); 
  const [isSucked, setIsSucked] = useState(true); 

  const marqueeRef = useRef<HTMLDivElement>(null);
  const scrollPos = useRef<number>(0);
  const [isDraggingMarquee, setIsDraggingMarquee] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    localStorage.removeItem('lastCapturedImage');
    localStorage.removeItem('lastScanResults');
    localStorage.removeItem('lastAnalyzedItem');
    document.cookie = "scan_in_progress=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }, []);

  // Timer to spit out the hero section on load
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setIsSucked(false);
    }, 150);

    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveArea((prevArea) => (prevArea + 1) % FEATURES.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [activeArea]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;
    const speed = 0.05; 

    const scroll = (time: number) => {
      if (!lastTime) lastTime = time;
      const delta = time - lastTime;
      lastTime = time;

      if (marqueeRef.current && !isDraggingMarquee) {
        scrollPos.current += speed * delta;
        const halfWidth = marqueeRef.current.scrollWidth / 2;
        
        if (scrollPos.current >= halfWidth) {
          scrollPos.current -= halfWidth;
        } else if (scrollPos.current <= 0) {
          scrollPos.current += halfWidth;
        }
        
        marqueeRef.current.scrollLeft = scrollPos.current;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };
    
    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isDraggingMarquee]);

  const handleGetStarted = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); 
    setIsSucked(true);  
    setTimeout(() => {
      router.push('/scan');
    }, 800);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!marqueeRef.current) return;
    setIsDraggingMarquee(true);
    setStartX(e.pageX - marqueeRef.current.offsetLeft);
    setScrollLeft(marqueeRef.current.scrollLeft);
    scrollPos.current = marqueeRef.current.scrollLeft;
  };

  const handlePointerLeaveOrUp = () => {
    setIsDraggingMarquee(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingMarquee || !marqueeRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - marqueeRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; 
    let newScrollLeft = scrollLeft - walk;
    
    const halfWidth = marqueeRef.current.scrollWidth / 2;

    if (newScrollLeft >= halfWidth) {
      newScrollLeft -= halfWidth;
      setStartX(e.pageX - marqueeRef.current.offsetLeft);
      setScrollLeft(newScrollLeft);
    } else if (newScrollLeft <= 0) {
      newScrollLeft += halfWidth;
      setStartX(e.pageX - marqueeRef.current.offsetLeft);
      setScrollLeft(newScrollLeft);
    }
    
    marqueeRef.current.scrollLeft = newScrollLeft;
    scrollPos.current = newScrollLeft; 
  };

  const aboutReciclaText = "Recicla is a real-time, AI-driven web application that transforms the way you approach household waste and intentional decluttering. By leveraging high-speed, client-side object detection, Recicla empowers you to instantly analyze everyday items especially aging electronics to understand their material composition and proper disposal methods. We take the guesswork out of waste segregation, turning the simple act of cleaning out your home into a meaningful contribution to environmental sustainability.";

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <VineScrollbar />
      <BackToTop />

      <div className="bg-white animate-rise">
        <main className="relative bg-white text-[#4A4A4A] font-sans no-scrollbar">

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            
            @keyframes spin-reverse {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
            }

            .spin-inner { animation: spin 100s linear infinite; }
            .spin-outer { animation: spin-reverse 140s linear infinite; }

            .unzoomable {
              user-select: none;
              -webkit-user-drag: none;
              touch-action: none;
              pointer-events: none;
            }
          `}</style>

          <section className="relative w-full min-h-screen overflow-hidden flex items-center justify-center">
            
            <div 
              className={`absolute inset-0 flex items-center justify-center pointer-events-none z-0 transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] origin-center
                ${isSucked ? 'scale-[0.05] opacity-0 translate-y-40 blur-2xl' : 'scale-100 opacity-100 translate-y-0 blur-0'}
              `}
            >
              <div
                className="absolute w-[100vw] h-[100vw] md:w-[800px] md:h-[800px] rounded-[50%] z-[5]"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,255,255,1) 100%, rgba(255,255,255,0) 0%)',
                  filter: 'blur(100px)'
                }}
              ></div>

              <img
                src="/images/Group 8.png"
                alt="Outer floating items"
                className="absolute w-[180vw] max-w-[1800px] object-contain spin-outer unzoomable"
              />

              <img
                src="/images/Group 7.png"
                alt="Inner floating items"
                className="absolute w-[120vw] max-w-[900px] object-contain spin-inner unzoomable"
              />
            </div>

            <FadeIn delay={300} className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center text-center gap-6 px-6">
              <img src="/images/recicla.png" alt="RECICLA" className="h-8 md:h-12 w-auto inline-block align-middle drop-shadow-sm" />
              <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#4A4A4A] leading-[1.2] mb-4">
                Recycle from anywhere,<br />Value anything.
              </h1>
              <Link
                href="/scan"
                onClick={handleGetStarted} 
                className={`mt-2 bg-white/70 backdrop-blur-md text-[#4A4A4A] border border-gray-200 font-bold tracking-wide rounded-[30px] px-8 py-3 md:px-10 md:py-[15px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:bg-[#7C8D58] hover:text-white hover:border-[#7C8D58] active:scale-95
                  ${isSucked ? 'scale-95 bg-[#6a794b] pointer-events-none opacity-0' : 'hover:-translate-y-1 opacity-100'}
                `}
              >
                Get Started
              </Link>
            </FadeIn>

            <div 
              className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-opacity duration-500 z-20 pointer-events-none
                ${isSucked ? 'opacity-0' : 'opacity-100'}
              `} 
            >
              <span className="text-[12px] md:text-xs uppercase tracking-[0.25em] text-[#4A4A4A]/90 font-bold">
                Scroll
              </span>
              <svg 
                className="w-4 h-4 text-[#7C8D58] animate-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </section>
          
          <section className="relative z-10 w-full mb-10 md:mb-20">
            <FadeIn className="relative w-full flex items-center justify-center overflow-hidden">
              <img src="/images/Rectangle 50.png" alt="Header" className="w-full md:w-[110%] scale-110 md:scale-100 max-w-none h-auto drop-shadow-xl unzoomable object-cover" />
              <h2 className="absolute inset-0 flex items-center justify-center text-white text-xl sm:text-3xl md:text-5xl font-bold tracking-tight mb-2 md:mb-4 px-4 text-center mix-blend-overlay">
                About Recicla
              </h2>
            </FadeIn>
            <div className="container mx-auto px-6 mt-12 md:mt-24 max-w-5xl text-center min-h-[300px]">
              <TextScrollReveal text={aboutReciclaText} />
            </div>
          </section>
          
          <section className="relative z-10 container mx-auto px-4 md:px-6 py-12 md:py-32 max-w-6xl">
            <FadeIn className="flex flex-col-reverse lg:flex-row overflow-hidden rounded-[20px] md:rounded-[40px] shadow-2xl border border-gray-100/50 bg-white/30 backdrop-blur-lg">
              <div className="w-full lg:w-1/2 flex flex-col" role="tablist">
                {FEATURES.map((feature, index) => {
                  const isActive = activeArea === index;
                  return (
                    <button
                      key={feature.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveArea(index)}
                      className={`flex-1 flex flex-col items-center justify-center text-center gap-1 md:gap-4 py-6 px-4 border-b border-r border-white/20 last:border-b-0 transition-all duration-500 outline-none group 
                        ${isActive ? 'bg-[#81915A]/90 backdrop-blur-md z-10 scale-[1.02] shadow-[0_0_30px_rgba(0,0,0,0.1)]' : 'bg-[#404828]/80 backdrop-blur-md hover:bg-[#404828]/90'}
                      `}
                    >
                      <img src={feature.icon} alt={feature.title} className={`w-8 h-8 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain unzoomable transition-transform duration-500 ${isActive ? 'scale-110' : 'scale-100'}`} />
                      <h3 className={`text-white font-bold text-[10px] sm:text-sm md:text-xl uppercase tracking-wider transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                        {feature.title}
                      </h3>
                    </button>
                  );
                })}
              </div>

              <div className="w-full lg:w-1/2 relative bg-[#E8E6D9]/50 backdrop-blur-sm min-h-[450px] sm:min-h-[500px] md:min-h-[600px] overflow-hidden">
                {FEATURES.map((feature, index) => (
                  <div
                    key={`img-${feature.id}`}
                    className={`absolute inset-0 transition-all duration-[1200ms] ease-in-out 
            ${activeArea === index ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-125 z-0'}
          `}
                  >
                    <Image src={feature.image} alt={feature.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover unzoomable" />
                  </div>
                ))}

                <div className="absolute inset-0 z-20 flex items-end">
                  {FEATURES.map((feature, index) => (
                    <div
                      key={`text-${feature.id}`}
                      className={`absolute inset-0 flex items-end justify-center transition-all duration-[800ms] ease-out
                        ${activeArea === index ? 'opacity-100 translate-y-0 pointer-events-auto z-10 delay-200' : 'opacity-0 translate-y-12 pointer-events-none z-0'}
                      `}
                    >
                      <div className="relative w-full pt-40 pb-8 md:pb-16 px-6 md:px-12 flex justify-center">
                        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent pointer-events-none z-0"></div>

                        <div 
                          className="absolute inset-0 backdrop-blur-md pointer-events-none z-0" 
                          style={{ 
                            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
                            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)'
                          }}
                        ></div>

                        <p className="relative z-10 text-[#2A2A2A] text-[13px] sm:text-base md:text-[22px] font-medium leading-relaxed max-w-lg mx-auto capitalize">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </section>

          <section className="max-w-[90rem] mx-auto px-4 sm:px-6 md:px-12 py-10 md:py-32 flex flex-row gap-4 sm:gap-12 md:gap-20 relative items-start perspective-[1000px]">
            <div className="absolute top-1/4 right-[10%] w-64 h-64 bg-[#7C8D58]/15 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 left-[10%] w-80 h-80 bg-[#81915A]/15 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="sticky-box w-5/12 self-start sticky top-10 md:top-40 h-auto z-10">
              <FadeIn className="w-full">
                <div className="text-[10px] sm:text-xs md:text-xl tracking-widest uppercase text-[#7C8D58] font-bold mb-2 md:mb-8 flex items-center gap-1 sm:gap-4">
                  How Recicla Works
                </div>
                <h2 className="text-[18px] sm:text-4xl md:text-5xl font-bold leading-[1.1] text-[#4A4A4A] tracking-tighter mb-2 md:mb-8">
                  Three Simple Steps to <br />
                  <span className="text-[#7C8D58]">Responsible Disposal for a Cleaner Planet</span>
                </h2>
                <p className="text-[12px] sm:text-base md:text-lg text-gray-800 font-light leading-relaxed max-w-md">
                  Recicla simplifies the path from waste to resource.
                </p>
              </FadeIn>
            </div>

            <div className="w-7/12 flex flex-col gap-6 sm:gap-16 md:gap-32 md:pb-[10vh] z-10">
              {[
                { num: "01", title: "Capture the Item", desc: "Open the Recicla web app and choose your preferred input. You can use the Live Camera for an instant real-time scan or Upload from Photos to analyze items you’ve already set aside.", img: "/images/step-1.png" },
                { num: "02", title: "Instant Analysis", desc: "In the blink of an eye, our on-device AI identifies the object and automatically classifies the material type and checking for hazards.", img: "/images/step-2.png" },
                { num: "03", title: "Review Results", desc: "Review the item's detailed profile and get directions to the nearest verified junk shop or specialized e-waste bin.", img: "/images/step-3.png" }
              ].map((step, idx) => (
                <FadeIn key={idx} delay={idx * 150} className="group">
                  <div className="p-4 sm:p-6 md:p-8 rounded-[20px] md:rounded-[40px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/60 transition-colors duration-500">
                    <div className="aspect-[4/3] bg-gray-100 rounded-[10px] md:rounded-[20px] mb-4 md:mb-8 relative overflow-hidden cursor-pointer shadow-md">
                      <Image src={step.img} alt={step.title} fill className="rounded-[10px] md:rounded-[20px] object-cover transition-transform duration-700 group-hover:scale-105 unzoomable border-4 border-[#7E8C54]/20" />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
                    </div>
                    <div className="flex gap-2 sm:gap-4 md:gap-8 items-start pb-2 md:pb-4">
                      <div className="text-lg sm:text-3xl md:text-4xl font-bold text-[#7C8D58] drop-shadow-sm">{step.num}</div>
                      <div>
                        <h3 className="text-[18px] sm:text-2xl md:text-3xl font-bold mb-1 md:mb-4 text-[#4A4A4A]">{step.title}</h3>
                        <p className="text-gray-500 font-medium text-[12px] sm:text-sm md:text-lg leading-snug md:leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>

          <section className="relative z-20 bg-[#76864C] py-10 md:py-32 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
            <div className="container mx-auto px-2 sm:px-6 text-center">
              <h2 className="text-white text-2xl sm:text-4xl md:text-6xl font-bold md:mb-4 tracking-tight">Meet Our Team</h2>
              <h3 className="text-[12px] sm:text-2xl md:text-2xl font-semi mb-6 md:mb-20 text-gray-200">Malunggay Pandesal</h3>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-8">
                {[
                  { name: "Bam", role: "AI Engineer", img: "/images/Team/Bam.jpg" },
                  { name: "Jude", role: "Full-Stack Software Developer", img: "/images/Team/Jude.jpg" },
                  { name: "Volt", role: "UI / UX Designer", img: "/images/Team/Ruy.jpg" },
                  { name: "Sai", role: "Project Manager", img: "/images/Team/Sai.jpg" }
                ].map((member, idx) => (
                  <div key={idx} className="flex flex-col items-center group">
                    <div className="w-14 h-14 sm:w-24 sm:h-24 md:w-56 md:h-56 bg-[#D9D9D9] rounded-full mb-2 md:mb-6 overflow-hidden relative shadow-lg">
                      <Image src={member.img} alt={member.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <h3 className="text-white text-[10px] sm:text-sm md:text-2xl font-bold mb-0.5 md:mb-1">{member.name}</h3>
                    <p className="text-white/90 text-[8px] sm:text-xs md:text-lg font-light leading-tight px-1">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative z-10 mt-8 md:mt-24 py-10 md:py-32 bg-white overflow-hidden">
            <FadeIn className="container mx-auto px-4 md:px-6 text-center mb-4 md:mb-12">
              <h2 className="text-[12px] sm:text-xl md:text-4xl font-bold text-[#4A4A4A]">Built Fast With A Zero-Latency, Zero-Cost Architecture</h2>
            </FadeIn>
            <FadeIn delay={200} className="relative flex overflow-hidden group" style={{ maskImage: 'linear-gradient(to right, transparent, black 40%, black 60%, transparent)' }}>
              <div 
                ref={marqueeRef}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerLeaveOrUp}
                onPointerLeave={handlePointerLeaveOrUp}
                onPointerCancel={handlePointerLeaveOrUp}
                onPointerMove={handlePointerMove}
                className={`flex whitespace-nowrap items-center py-2 md:py-4 overflow-x-hidden no-scrollbar w-full ${isDraggingMarquee ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ touchAction: 'pan-y' }}
              >
                {[...techLogos, ...techLogos, ...techLogos, ...techLogos].map((logo, index) => (
                  <div key={index} className="mx-3 sm:mx-6 md:mx-10 flex-shrink-0 flex items-center justify-center">
                    <img 
                      src={logo.src} 
                      alt={logo.name} 
                      className="h-15 w-25 sm:h-10 sm:w-28 md:h-14 md:w-40 object-contain transition-transform duration-300 hover:scale-110 unzoomable" 
                      draggable="false" 
                    />
                  </div>
                ))}
              </div>
            </FadeIn>
          </section>

          <footer className="relative w-full h-[40vh] md:h-screen bg-white flex items-end justify-center overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center z-0 px-4 md:px-6 w-full">
              <svg className="w-full max-w-[1600px] h-auto drop-shadow-sm unzoomable" viewBox="0 0 1600 500" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="innerShadow">
                    <feOffset dx="8" dy="12" /><feGaussianBlur stdDeviation="8" result="offset-blur" />
                    <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                    <feFlood floodColor="black" floodOpacity="0.35" result="color" /><feComposite operator="in" in="color" in2="inverse" result="shadow" />
                    <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                  </filter>
                </defs>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#E8EBE4" className="font-inter font-bold uppercase" style={{ fontSize: '250px', letterSpacing: '14px' }} filter="url(#innerShadow)">RECICLA</text>
              </svg>
            </div>
            <img src="/images/footer.png" alt="Tropical Leaves" className="relative z-10 w-full h-[40vh] md:h-[85vh] object-cover object-bottom pointer-events-none unzoomable drop-shadow-2xl" />
          </footer>

        </main>
      </div>
    </ReactLenis>
  );
}