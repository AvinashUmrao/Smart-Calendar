import { format } from "date-fns";

interface ImageBannerProps {
  currentMonth: Date;
}

// Switching to use Standard <img> tag and Picsum Seeds
// Standard <img> bypasses Next.js image optimization proxy which can be flakey in certain dev environments.
export default function ImageBanner({ currentMonth }: ImageBannerProps) {
  const monthName = format(currentMonth, 'MMMM').toLowerCase();
  
  // High-res Picsum URL with seed based on the month name for stability
  const currentImage = `https://picsum.photos/seed/calendar-${monthName}/800/1200`;

  return (
    <div className="relative w-full lg:w-[320px] shrink-0 h-48 sm:h-64 lg:h-auto overflow-hidden transition-all duration-1000 bg-stone-100 dark:bg-stone-800">
      {/* 
         Using standard <img> for maximum reliability across all environments.
         Bypasses Next.js proxy and unconfigured hostname issues.
      */}
      <img
        key={currentImage}
        src={currentImage}
        alt={format(currentMonth, 'MMMM')}
        className="absolute inset-0 w-full h-full object-cover animate-in fade-in zoom-in-110 duration-1000 ease-out"
        loading="eager"
      />
      
      {/* Multi-layer gradients for depth */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/40 shadow-inner" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent lg:hidden" />
      
      {/* Prominent Overlay Text - Responsive Positioning */}
      <div className="absolute inset-x-0 bottom-8 lg:bottom-12 p-8 lg:p-10 flex flex-col items-start gap-1 select-none animate-in slide-in-from-bottom-4 duration-1000 delay-200">
        <h2 className="text-white text-4xl sm:text-5xl lg:text-7xl font-light tracking-tighter drop-shadow-2xl">
          {format(currentMonth, 'MMMM')}
        </h2>
        <div className="flex items-center gap-3">
          <div className="h-[1px] lg:h-[2px] w-6 lg:w-8 bg-white/40" />
          <p className="text-white/60 text-sm lg:text-2xl font-medium tracking-[0.2em] lg:tracking-[0.3em] uppercase">
            {format(currentMonth, 'yyyy')}
          </p>
        </div>
      </div>
      
      {/* Texture/Paper Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/fiber-paper.png')]" />
    </div>
  );
}
