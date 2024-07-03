// src/app/page.tsx
'use client';

import { useState } from "react";
import { push, set, ref } from "firebase/database";
import { database } from "../lib/firebase/config";
import { useRouter } from "next/navigation";

export default function Home() {
  const [newRoom, setNewRoom] = useState('');
  const [newPlayer, setNewPlayer] = useState('');
  const router = useRouter();

  const handleAddRoom = () => {
    try {
      const slug = newRoom.trim().toLowerCase().replace(/\s+/g, '-');
      const usesRef = ref(database, 'rooms');
      const newDataRef = push(usesRef);
      const roomId = newDataRef.key;
      set(newDataRef, {
        id: roomId,
        name: newRoom,
        slug,
      });
      setNewRoom('');
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddPlayer = () => {
    try {
      const usesRef = ref(database, 'players');
      const newDataRef = push(usesRef);
      set(newDataRef, {
        name: newPlayer,
      });
      setNewPlayer('');
      alert('Data được tạo thành công!!');
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen pt-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold">Đăng nhập</h1>
        <hr className="my-6" />
        <label className="mt-3 mb-2 block">Tạo room</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập tên phòng"
            className="w-full px-3 py-2 rounded text-slate-800 focus:outline-none"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
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
