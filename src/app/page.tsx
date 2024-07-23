'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { push, set, ref } from "firebase/database";
import { database } from "../lib/firebase/config";
import Slugify from "../lib/help/slugify";
import { usePlayer } from "../lib/PlayerContext";
import { Select, message } from "antd";

export default function Home() {
  const [newRoom, setNewRoom] = useState('');
  const [newPlayer, setNewPlayer] = useState('');
  const { setIdPlayer, setIdAdmin } = usePlayer();
  const router = useRouter();

  const [messageApi, contextHolder] = message.useMessage();

  const error = () => {
    messageApi.open({
      type: 'warning',
      content: 'Vui lòng chọn phòng',
    });
  };

  const handleAddRoom = () => {
    if (newRoom) {
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
    } else {
      error()
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
    <>
      {contextHolder}
      <div className="bg-slate-900 bg-hero-standard text-white min-h-screen pt-16 px-2">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-medium text-center border-b border-dashed py-4 mb-4">TẠO PHÒNG</h2>
          <div className="border-b border-dashed pb-4">
            <label className="mt-3 mb-2 block">Tên Phòng:</label>
            <div className="mb-6 group-input">
              <input
                type="text"
                className="bg-transparent border-b px-2 py-1 relative focus:outline-none w-full"
              />
            </div>
            <label className="mt-3 mb-2 block">Mật Khẩu <span className="text-xs">(Tùy Chọn)</span>:</label>
            <div className="mb-6 group-input">
              <input
                type="text"
                className="bg-transparent border-b px-2 py-1 relative focus:outline-none w-full"
              />
            </div>

            <label className="mt-3 mb-2 block">Chọn Game:</label>
            <div className="mb-6 group-input">
              <Select
                defaultValue="Chọn game"
                onChange={(e) => { setNewRoom(e) }}
                options={[
                  { value: 'Werewolf', label: 'Werewolf' },
                  { value: 'Uno', label: 'Uno' },
                ]}
                className="w-full input-select border-b py-1"
              />
            </div>

            <div className="text-center">
              <div className="c-btn__main">
                <button
                  onClick={handleAddRoom}
                  className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900"
                >
                  <span className="relative">Tạo Phòng</span>
                </button>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-medium text-center border-b border-dashed py-4 mb-4 mt-10">ĐĂNG NHẬP</h2>
          <div className="border-b border-dashed pb-4">
            <div className="mb-6 group-input">
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
        </div>
      </div>
    </>
  );
}
