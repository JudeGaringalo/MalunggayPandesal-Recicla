"use client";

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

export default function LandingPage(): React.JSX.Element {

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
  ];

  return (
    <div className="bg-white">

      <main className="relative bg-white text-[#4A4A4A] font-sans">

        <style>{`
          @keyframes spin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          
          @keyframes spin-reverse {
            from { transform: translate(-50%, -50%) rotate(360deg); }
            to { transform: translate(-50%, -50%) rotate(0deg); }
          }

          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .spin-inner { animation: spin 100s linear infinite; }
          .spin-outer { animation: spin-reverse 140s linear infinite; }
          .animate-marquee { animation: marquee 30s linear infinite; }

          .unzoomable {
            user-select: none;
            -webkit-user-drag: none;
            touch-action: none;
            pointer-events: none;
          }
        `}</style>

        {/* --- HERO WRAPPER --- */}
        <section className="relative w-full min-h-screen overflow-hidden">

          {/* --- BACKGROUND RINGS LAYER --- */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <img
              src="/images/Group 8.png"
              alt="Outer floating items"
              className="absolute top-[50vh] left-1/2 w-[100vw] max-w-[1900px] object-contain spin-outer unzoomable"
            />
            <img
              src="/images/Group 7.png"
              alt="Inner floating items"
              className="absolute top-[50vh] left-1/2 w-[100vw] max-w-[1000px] object-contain spin-inner unzoomable"
            />

            <div
              className="absolute top-[50vh] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] md:w-[850px] md:h-[850px] rounded-[50%] pointer-events-none z-[5]"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,1) 100%, rgba(255,255,255,0) 0%)',
                filter: 'blur(100px)'
              }}
            ></div>
          </div>

          {/* --- HERO CONTENT --- */}
          <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center text-center gap-6 px-6">
            <span className="font-inter uppercase tracking-[2px] text-[#7C8D58] text-base md:text-xl font-bold">
              RECICLA
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#4A4A4A] leading-[1.2] mb-4">
              Recycle from anywhere,<br />Value from anything
            </h1>

            <Link
              href="/scan"
              className="mt-2 bg-[#7C8D58] text-white font-semibold rounded-[30px] px-8 py-3 md:px-10 md:py-[15px] shadow-[inset_0px_-3px_0px_rgba(0,0,0,0.2),_0px_4px_10px_rgba(0,0,0,0.1)] transition-transform duration-200 transition-colors hover:bg-[#6a794b] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-[inset_0px_2px_5px_rgba(0,0,0,0.3)]"
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* --- ABOUT CONTENT --- */}
        <section className="relative z-10 w-full">
          <div className="relative w-full flex items-center justify-center overflow-hidden">
            <img
              src="/images/Rectangle 50.png"
              alt="About Section Header"
              className="w-full md:w-[110%] max-w-none h-auto drop-shadow-xl unzoomable object-cover"
            />
            <h2 className="absolute inset-0 flex items-center justify-center text-white text-3xl md:text-5xl font-bold tracking-tight mb-4 px-4 text-center">
              About Recicla
            </h2>
          </div>

          <div className="container mx-auto px-6 mt-12 md:mt-16 max-w-4xl text-center">
            <p className="text-[#4A4A4A] text-base md:text-xl leading-relaxed font-medium">
              Recicla is a real-time, AI-driven web application designed to bridge the gap between waste segregation and financial incentive. By leveraging high-speed, client-side object detection, Recicla empowers users to instantly identify the value and risks of their household waste. We focus specifically on the untapped potential of e-waste and precious metal recovery, transforming the act of "throwing things away" into a deliberate step toward environmental sustainability and personal profit.
            </p>
          </div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section className="relative z-10 container mx-auto px-6 py-16 md:py-32 max-w-6xl">
          <div className="flex flex-col md:flex-row overflow-hidden rounded-[40px] shadow-2xl border border-gray-100">
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="bg-[#81915A] py-8 px-6 md:px-10 flex flex-col items-center justify-center text-center gap-4 border-b md:border-b md:border-r border-white">
                <img src="/images/Frame 59.png" alt="AI Icon" className="w-20 h-20 md:w-24 md:h-24 object-contain unzoomable" />
                <h3 className="text-white font-bold text-lg md:text-xl uppercase tracking-wider">Zero-Latency AI</h3>
              </div>
              <div className="bg-[#455130] py-8 px-6 md:px-10 flex flex-col items-center justify-center text-center gap-4 border-b md:border-b md:border-r border-white">
                <img src="/images/Frame 60.png" alt="Valuation Icon" className="w-20 h-20 md:w-24 md:h-24 object-contain unzoomable" />
                <h3 className="text-white font-bold text-lg md:text-xl uppercase tracking-wider">Instant Valuation</h3>
              </div>
              <div className="bg-[#3D4829] py-8 px-6 md:px-10 flex flex-col items-center justify-center text-center gap-4 border-b md:border-b md:border-r border-white">
                <img src="/images/Frame 61.png" alt="Routing Icon" className="w-20 h-20 md:w-24 md:h-24 object-contain unzoomable" />
                <h3 className="text-white font-bold text-lg md:text-xl uppercase tracking-wider">Hazard Routing</h3>
              </div>
              <div className="bg-[#353D22] py-8 px-6 md:px-10 flex flex-col items-center justify-center text-center gap-4 md:border-r border-white">
                <img src="/images/Frame 62.png" alt="Web Icon" className="w-20 h-20 md:w-24 md:h-24 object-contain unzoomable" />
                <h3 className="text-white font-bold text-lg md:text-xl uppercase tracking-wider">Frictionless Access</h3>
              </div>
            </div>

            <div className="w-full md:w-1/2 relative bg-[#E8E6D9] min-h-[350px] md:min-h-[500px] flex items-end">
              <img
                src="/images/feature-person.png"
                alt="Feature showcase"
                className="absolute inset-0 w-full h-full object-cover unzoomable"
              />
              <div className="relative z-10 w-full p-6 md:p-12 pt-24 md:pt-32 bg-gradient-to-t from-[#f1f0e8] via-[#f1f0e8]/90 to-transparent text-center">
                <p className="text-[#4A4A4A] text-lg md:text-2xl font-medium leading-tight max-w-md mx-auto">
                  Our Model Runs Directly In Your Browser For Instant Identification.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section
          className="max-w-[90rem] mx-auto px-6 md:px-12 py-16 md:py-32 flex flex-col md:flex-row gap-12 md:gap-20 relative items-start perspective-[1000px]"
        >
          <div className="sticky-box w-full md:w-5/12 self-start md:sticky md:top-40 h-auto">
            <div className="w-full py-4 md:py-0">
              <div className="text-xs md:text-sm tracking-widest uppercase text-[#7C8D58] font-bold mb-4 md:mb-8 flex items-center gap-4">
                How It Works
              </div>
              <h2 className="text-4xl md:text-7xl font-bold leading-[1.1] text-[#4A4A4A] tracking-tighter mb-4 md:mb-8">
                Three Simple Steps To <br />
                <span className="text-[#7C8D58]">A Cleaner Planet.</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 font-light leading-relaxed max-w-md">
                Recicla simplifies the path from waste to wealth.
              </p>
            </div>
          </div>

          <div className="w-full md:w-7/12 flex flex-col gap-16 md:gap-32 md:pb-[10vh]">
            {[
              { num: "01", title: "The Scan", desc: "Open the Recicla Web App and point your camera at any item.", img: "/images/step-1.png" },
              { num: "02", title: "The Value Check", desc: "The app overlays a dynamic 'Value Card' that displays the item's current local scrap price.", img: "/images/step-2.png" },
              { num: "03", title: "The Drop-Off", desc: "With one tap, Recicla maps out the nearest verified destination.", img: "/images/step-3.png" }
            ].map((step, idx) => (
              <div key={idx} className="reveal-up group">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden rounded-[20px] md:rounded-[30px] mb-6 md:mb-8 relative cursor-pointer shadow-lg">
                  <Image src={step.img} alt={step.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105 unzoomable" />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
                </div>
                <div className="flex gap-4 md:gap-8 items-start border-b border-gray-100 pb-6 md:pb-8">
                  <div className="text-3xl md:text-4xl font-bold text-[#7C8D58]">{step.num}</div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-[#4A4A4A]">{step.title}</h3>
                    <p className="text-gray-500 font-light text-base md:text-lg leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- MEET OUR TEAM --- */}
        <section className="relative z-20 bg-[#76864C] py-16 md:py-32 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
          <div className="container mx-auto px-2 sm:px-6">
            <h2 className="text-white text-3xl md:text-6xl font-bold text-center mb-10 md:mb-20 tracking-tight">
              Meet Our Team
            </h2>
            {/* Forced grid-cols-4 for all screen sizes */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-8">
              {[
                { name: "Bam", role: "AI Engineer", img: "/images/team-bam.png" },
                { name: "Jude", role: "Full-Stack Developer", img: "/images/team-jude.png" },
                { name: "Volt", role: "UI / UX Designer", img: "/images/team-volt.png" },
                { name: "Sai", role: "Project Manager", img: "/images/team-sai.png" }
              ].map((member, idx) => (
                <div key={idx} className="flex flex-col items-center text-center group">
                  {/* Scaled down avatars for mobile, returning to normal size on md screens */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-56 md:h-56 bg-[#D9D9D9] rounded-full mb-2 md:mb-6 overflow-hidden relative shadow-lg">
                    <Image src={member.img} alt={member.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  {/* Scaled down typography for mobile to prevent text wrapping issues */}
                  <h3 className="text-white text-xs sm:text-sm md:text-2xl font-bold mb-1">{member.name}</h3>
                  <p className="text-white/90 text-[10px] sm:text-xs md:text-lg font-light leading-tight px-1">{member.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-4 md:h-6 bg-[#4B5320] blur-[2px]"></div>
        </section>

        {/* --- MARQUEE TECH STACK SECTION --- */}
        <section className="relative z-10 mt-12 md:mt-24 py-16 md:py-32 bg-white overflow-hidden">
          <div className="container mx-auto px-6 text-center mb-8 md:mb-12">
            <h2 className="text-xl md:text-4xl font-bold text-[#4A4A4A] tracking-[1px] md:tracking-[1.5px]">
              Built Fast With A Zero-Latency, Zero-Cost Architecture
            </h2>
          </div>

          <div
            className="relative flex overflow-hidden group"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
            }}
          >
            <div className="flex animate-marquee whitespace-nowrap items-center py-4">
              {[...techLogos, ...techLogos].map((logo, index) => (
                <div key={index} className="mx-4 md:mx-10 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-8 w-24 md:h-14 md:w-40 object-contain transition-transform duration-300 hover:scale-110 unzoomable"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- FOOTER SECTION --- */}
        <footer className="relative w-full h-[60vh] md:h-screen bg-white flex items-end justify-center overflow-hidden">
          
          {/* CUT-OUT TEXT (Background) */}
          <div className="absolute inset-0 flex items-center justify-center z-0 px-4 md:px-6 w-full">
            <svg 
              className="w-full max-w-[1600px] h-auto drop-shadow-sm unzoomable" 
              viewBox="0 0 1600 500" 
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="innerShadow">
                  <feOffset dx="8" dy="12" />
                  <feGaussianBlur stdDeviation="8" result="offset-blur" />
                  <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                  <feFlood floodColor="black" floodOpacity="0.35" result="color" />
                  <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                  <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                </filter>
              </defs>
              
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="#E8EBE4"
                className="font-inter font-bold uppercase"
                style={{ fontSize: '250px', letterSpacing: '14px' }}
                filter="url(#innerShadow)"
              >
                RECICLA
              </text>
            </svg>
          </div>

          {/* LEAVES IMAGE (Foreground) */}
          <img
            src="/images/footer.png" 
            alt="Tropical Leaves"
            className="relative z-10 w-full h-[40vh] md:h-[85vh] object-cover object-bottom pointer-events-none unzoomable drop-shadow-2xl"
          />
          
        </footer>
      </main>
    </div>
  );
}