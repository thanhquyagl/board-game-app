'use client'

import { useRouter } from "next/navigation";
import { LeftOutlined } from "@ant-design/icons";
import { usePlayer } from "../lib/PlayerContext";
import { database } from "../lib/firebase/config";
import { remove, ref } from "firebase/database";

export default function Header() {
  const { idPlayer, setIdPlayer, idAdmin, setIdAdmin } = usePlayer();
  const router = useRouter();


  const handleMenuClick = () => {
    if (idPlayer) {
      remove(ref(database, `players/${idPlayer}`));
      sessionStorage.removeItem('idPlayerStorage');
      setIdPlayer(null);
      router.push('/');
    }
  };


  return (
    <div className="bg-transparent absolute top-0 left-0 w-full text-white z-10">
      <div className="flex justify-between gap-2 max-w-2xl  min-h-[60px] mx-auto py-3 px-2">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-2xl font-semibold"> AGL Game Board</h1>
        </div>
        <>
          <button
            className="px-2"
            onClick={() => {
              history.back();
            }}
          >
            <LeftOutlined />
            <span>Back</span>
          </button>
          <button
            className="px-2"
          >
            <span>Setting</span>
          </button>
        </>
      </div>
    </div>
  )
}
