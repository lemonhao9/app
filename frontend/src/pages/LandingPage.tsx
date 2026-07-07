import { NavBar } from '@/components/ui/NavBar';
import CrayonHorizontal2 from '@/assets/CrayonHorizontal2.png';

export function LandingPage() {
  return (
    <div className="h-screen overflow-hidden relative">
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: `url(${CrayonHorizontal2})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <NavBar />
      <div className="absolute top-20 sm:top-24 left-6 sm:left-10 z-10 max-w-[90%] sm:max-w-[70%] md:max-w-[50%]">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
          La réparation de votre vélo qui vient à vous !
        </h1>
        <p className="text-white/90 mt-3 text-base sm:text-lg font-semibold">Par les Cycles Lyonnais</p>
      </div>


    </div>
  );
}