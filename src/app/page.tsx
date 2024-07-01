'use client'

import { push, set, get, ref } from "firebase/database";
import { useEffect, useState } from "react";

import { database } from "../lib/firebase/config";

export default function Home() {

  const [rooms, setRooms] = useState([]);

  const [newRoom, setNewRoom] = useState('');

  const handleAddData = () => {
    try {
      const usesRef = ref(database, 'rooms');
      const newDataRef = push(usesRef);
      set(newDataRef, {
        name: newRoom,
      });
      setNewRoom('')
      alert('Data được tạo thành công!!')
    }
    catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    const usesRef = ref(database, 'rooms')
    get(usesRef).then((snapshot) => {
      if (snapshot.exists()) {
        const userArray = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
        }))
        setRooms(userArray);
      } else {
        console.log('No data available')
      }
    }).catch((error) => {
      console.log(error)
    })
  })

  return (
    <div className="bg-slate-900 text-white min-h-screen flex justify-center pt-16">
      <div className="max-w-3xl">
        <h1>Đăng nhập</h1>
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
            onClick={handleAddData}
            className="flex-none bg-white rounded text-slate-900 px-3 py-2 font-bold"
          >
            Tạo
          </button>
        </div>
        {
          rooms.map((room) => (
            <div key={room.id}>
              <div className="flex gap-1">
              <h2>{room.name}</h2>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
