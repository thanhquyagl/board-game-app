'use client';

import FormCreatePlayer from "../../components/FormCreatePlayer";
import FormCreateRoom from "../../components/FormCreateRoom";

export default function Home() {

  return (
    <>
      <div className="bg-transparent absolute top-0 left-0 w-full text-white z-10">
        <div className="flex justify-between gap-2 max-w-2xl  min-h-[60px] mx-auto py-3 px-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-base md:text-2xl font-semibold"> AGL Game Board</h1>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 bg-hero-standard text-white min-h-screen pt-16 px-2 relative">
        <div className="absolute top-0 left-0 bg-hero-standard w-full h-full bg-filter"></div>
        <div className="max-w-2xl mx-auto relative">
          <FormCreateRoom />
          <FormCreatePlayer />
        </div>
      </div>
    </>
  );
}
