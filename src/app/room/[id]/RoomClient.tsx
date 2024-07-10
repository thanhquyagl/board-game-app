// src/app/room/[id]/RoomClient.tsx
'use client';

import { useEffect, useState } from "react";
import { ref, remove, get, onValue } from "firebase/database";
import { database } from "../../../lib/firebase/config";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "antd";

type Props = {
  params: { id: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

type PlayerRoom = {
  id: string;
  id_player: string;
  id_room: string;
  del_flg: number;
  [key: string]: any;
};

const RoomClient = ({ params }: Props) => {
  const id = params.id;
  const [room, setRoom] = useState<any>(null);
  const [playerxroom, setPlayerxroom] = useState<PlayerRoom[]>([]);
  const [players, setPlayers] = useState<{ [key: string]: any }>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const idAdmin = searchParams.get('idAdmin') || '';

  const [open, setOpen] = useState<boolean>(false);

  const handleOk = () => {
    handleDeleteRoom();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  useEffect(() => {
    const roomRef = ref(database, `rooms/${id}`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoom(snapshot.val());
      } else {
        router.push('/room/');
      }
    }, (error) => {
      console.log(error);
    });

    const playerRoomsRef = ref(database, 'player-x-room');
    const unsubscribePlayerRoom = onValue(playerRoomsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const playerRoomsData: any = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data as object,
        }));
        setPlayerxroom(playerRoomsData);

        const playerPromises = playerRoomsData.map(async (playerRoom: any) => {
          const playerRef = ref(database, `players/${playerRoom.id_player}`);
          const playerSnapshot = await get(playerRef);
          if (playerSnapshot.exists()) {
            return { [playerRoom.id_player]: playerSnapshot.val() };
          } else {
            return { [playerRoom.id_player]: { name: '...' } };
          }
        });

        const playerResults = await Promise.all(playerPromises);
        const playerData = playerResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setPlayers(playerData);
      } else {
        console.log('Không tìm thấy dữ liệu');
      }
    }, (error) => {
      console.error('Lỗi lấy dữ liệu player-x-room: ', error);
    });

    return () => {
      unsubscribeRoom();
      unsubscribePlayerRoom();
    };
  }, [id, router]);

  const handleDeleteRoom = async () => {
    try {
      await remove(ref(database, `rooms/${id}`));
      const playerRoomsRef = ref(database, 'player-x-room');
      const playerRoomsSnapshot = await get(playerRoomsRef);
      if (playerRoomsSnapshot.exists()) {
        const playerRoomsData: any = Object.entries(playerRoomsSnapshot.val()).map(([id, data]) => ({
          id,
          ...data as object,
        }));
        playerRoomsData.forEach(async (playerRoom: any) => {
          if (playerRoom.id_room === id) {
            await remove(ref(database, `player-x-room/${playerRoom.id}`));
          }
        });
      }
      router.push('/');
    } catch (error) {
      console.error('Lỗi xoá room: ', error);
    }
  };

  const filteredPlayerxroom = playerxroom.filter(playerRoom => playerRoom.id_room === id);

  return (
    <div className="bg-slate-900 text-white min-h-screen pt-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold">Phòng - {room ? room.name : 'Loading...'}</h1>
        {room && room.admin === idAdmin && (
          <div className="flex gap-4 pb-6 my-6 border-b">
            <button
              className="flex-none bg-red-700 rounded text-slate-50 px-3 py-2 font-bold"
              onClick={() => {
                setOpen(true);
              }}
            >
              Back
            </button>
            <button
              className="flex-none bg-white rounded text-slate-900 px-3 py-2 font-bold"
            >
              Setting
            </button>

            <Modal title="Xoá Phòng" open={open} onOk={handleOk} onCancel={handleCancel} >
              <p>Bạn thật sự muốn xoá phòng chơi này?</p>
            </Modal>
          </div>
        )}

        <h2 className="text-2xl pb-4 my-6 border-b">Danh sách người chơi</h2>
        <table className="w-full text-center">
          <tbody>
            <tr>
              <th className="px-2 py-4 border-b">STT</th>
              <th className="px-2 py-4 border-b">Tên Player</th>
              <th className="px-2 py-4 border-b">Trạng thái</th>
            </tr>
            {filteredPlayerxroom.map((playerRoom, index) => (
              <tr key={playerRoom.id}>
                <td className="px-2 py-4 border-b">{index + 1}</td>
                <td className="px-2 py-4 border-b">{players[playerRoom.id_player]?.name || 'Loading...'}</td>
                <td className="px-2 py-4 border-b">{playerRoom.del_flg == 0 ? 'Hoạt động' : 'Off'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomClient;
