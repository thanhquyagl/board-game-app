import { useState } from "react";
import { push, set, ref } from "firebase/database";
import { database } from "../firebase/config";
import { usePlayer } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";


export default function FormCreatePlayer() {
  const [newPlayer, setNewPlayer] = useState('');
  const { setIdPlayer } = usePlayer();
  const router = useRouter();

  const handleAddPlayer = () => {
    try {
      const usesRef = ref(database, 'players');
      const newDataRef = push(usesRef);
      const playerId = newDataRef.key as string;
      set(newDataRef, {
        id: playerId,
        name: newPlayer,
      });
      sessionStorage.setItem("idPlayerStorage", playerId);
      setIdPlayer(playerId);
      setNewPlayer('');
      router.push(`/rooms/`);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      <h2 className="text-xl font-medium text-center border-b border-dashed py-4 mb-4 mt-10">ĐĂNG NHẬP</h2>
      <div className="border-b border-dashed pb-4 flex flex-col gap-4">
        <div className="group-input">
          <input
            type="text"
            placeholder="Nhập tên player"
            className="bg-transparent border-b px-2 py-1 relative focus:outline-none w-full"
            value={newPlayer}
            onChange={(e) => setNewPlayer(e.target.value)}
          />
        </div>
        <div className="text-center">
          <div className="c-btn__main">
            <button
              onClick={handleAddPlayer}
              className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900"
            >
              <span className="relative">Đăng Nhập</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}