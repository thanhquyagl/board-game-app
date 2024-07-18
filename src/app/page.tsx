'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { push, set, ref } from "firebase/database";
import { database } from "../lib/firebase/config";
import Slugify from "../lib/help/slugify";
import { usePlayer } from "../lib/PlayerContext";
import { Select } from "antd";

export default function Home() {
  const [newRoom, setNewRoom] = useState('');
  const [newPlayer, setNewPlayer] = useState('');
  const { setIdPlayer, setIdAdmin } = usePlayer();
  const router = useRouter();

  const handleAddRoom = () => {
    try {
      const slug = Slugify(newRoom);
      const usesRef = ref(database, 'rooms');
      const newDataRef = push(usesRef);
      const roomId = newDataRef.key;
      const idAdmin = newDataRef.key as string;
      set(newDataRef, {
        id: roomId,
        name: newRoom,
        slug,
        admin: idAdmin,
        limit: -1,
      });
      sessionStorage.setItem("idAdminStorage", idAdmin);
      setIdAdmin(idAdmin)
      setNewRoom('');
      router.push(`/room/${roomId}?`);
    } catch (error) {
      console.log(error);
    }
  };

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
      router.push(`/room/`);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen pt-16 px-2">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold">Đăng nhập</h1>
        <hr className="my-6" />
        <label className="mt-3 mb-2 block">Tạo room</label>
        <div className="flex gap-2">
          <Select
            defaultValue="Chọn phòng"
            onChange={(e) => { setNewRoom(e) }}
            options={[
              { value: 'Ma sói', label: 'Ma Sói' },
            ]}
            className="w-full h-[40px]"
          />
          <button
            onClick={handleAddRoom}
            className="flex-none bg-white rounded text-slate-900 px-3 py-2 font-bold"
          >
            Tạo
          </button>
        </div>
        <hr className="my-6" />
        <label className="mt-3 mb-2 block">Tạo player</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập tên player"
            className="w-full px-3 py-2 rounded text-slate-800 focus:outline-none"
            value={newPlayer}
            onChange={(e) => setNewPlayer(e.target.value)}
          />
          <button
            onClick={handleAddPlayer}
            className="flex-none bg-white rounded text-slate-900 px-3 py-2 font-bold"
          >
            Tạo
          </button>
        </div>
      </div>
    </div>
  );
}
