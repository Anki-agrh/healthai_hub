import { useState, useEffect } from "react";


function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      className={`fixed bottom-24 right-6 md:bottom-10 md:right-10 w-[50px] h-[50px] rounded-full border-none bg-gradient-to-br from-[#0a4db8] to-[#1e6ff0] text-white text-[24px] cursor-pointer flex items-center justify-center shadow-[0_4px_15px_rgba(10,77,184,0.3)] z-[1000] transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_8px_20px_rgba(10,77,184,0.4)] ${visible ? "opacity-100 translate-y-0 visible" : "opacity-0 translate-y-[20px] invisible"}`}
      onClick={scrollUp}
      aria-label="Scroll to top"
      title="Back to top"
    >
      ↑
    </button>
  );
}

export default ScrollToTop;
