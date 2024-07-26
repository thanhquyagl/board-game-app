'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { push, set, ref } from "firebase/database";
import { database } from "../lib/firebase/config";
import Slugify from "../lib/help/slugify";
import { usePlayer } from "../lib/PlayerContext";
import { Select, message } from "antd";

export default function Home() {
  const [nameRoom, setNameRoom] = useState('');
  const [typeRoom, setTypeRoom] = useState('');
  const [passRoom, setPassRoom] = useState('');
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
    if (nameRoom) {
      try {
        const slug = Slugify(nameRoom);
        const usesRef = ref(database, 'rooms');
        const newDataRef = push(usesRef);
        const roomId = newDataRef.key;
        const idAdmin = newDataRef.key as string;
        set(newDataRef, {
          id: roomId,
          name: nameRoom,
          slug,
          admin: idAdmin,
          limit: 16,
          type: typeRoom,
          pass: passRoom,
        });
        sessionStorage.setItem("idAdminStorage", idAdmin);
        setIdAdmin(idAdmin)
        setNameRoom('');
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
      <div className="bg-transparent absolute top-0 left-0 w-full text-white z-10">
        <div className="flex justify-between gap-2 max-w-2xl  min-h-[60px] mx-auto py-3 px-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-2xl font-semibold"> AGL Game Board</h1>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 bg-hero-standard  text-white min-h-screen pt-16 px-2">
        <div className="absolute top-0 left-0 bg-hero-standard w-full h-full bg-filter"></div>
        <div className="max-w-2xl mx-auto relative">
          <h2 className="text-xl font-medium text-center border-b border-dashed py-4 mb-4">TẠO PHÒNG</h2>
          <div className="border-b border-dashed pb-4">
            <label className="mt-3 mb-2 block">Tên Phòng:</label>
            <div className="mb-6 group-input">
              <input
                type="text"
                className="bg-transparent border-b px-2 py-1 relative focus:outline-none w-full"
                value={nameRoom}
                onChange={(e) => setNameRoom(e.target.value)}
              />
            </div>
            <label className="mt-3 mb-2 block">Mật Khẩu <span className="text-xs">(Tùy Chọn)</span>:</label>
            <div className="mb-6 group-input">
              <input
                type="text"
                className="bg-transparent border-b px-2 py-1 relative focus:outline-none w-full"
                value={passRoom}
                onChange={(e) => setPassRoom(e.target.value)}
              />
            </div>

            <label className="mt-3 mb-2 block">Chọn Game:</label>
            <div className="mb-6 group-input">
              <Select
                defaultValue="Chọn game"
                onChange={(e) => { setTypeRoom(e) }}
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
