"use client"; 

import React, { useState, useEffect } from 'react';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Listen for scroll events to hide/show the button
  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when the user scrolls down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    
    // Cleanup the event listener when the component unmounts
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Function to scroll smoothly to the top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`
        fixed bottom-6 right-15 md:bottom-10 md:right-16 z-50 p-4 md:p-5 bg-[#8b9c64] hover:bg-[#81915A] text-white 
        rounded-full shadow-lg hover:scale-110 transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
      `}
    >
      <svg 
        className="w-6 h-6 md:w-10 md:h-10" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
      </svg>
    </button>
  );
};

export default BackToTop;

