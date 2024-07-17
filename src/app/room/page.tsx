'use client'
import { push, get, ref, set, update, onValue } from "firebase/database";
import { useEffect, useState } from "react";
import { database } from "../../lib/firebase/config";
import { useRouter } from "next/navigation";
import { Alert } from "antd";
import Link from "next/link";
import { rule } from "postcss";


type Room = {
  id: string;
  name: string;
  [key: string]: any;
};

const Room = () => {

  const [rooms, setRooms] = useState<Room[]>([])
  const [idPlayer, setIdPlayer] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const usesRef = ref(database, 'rooms')
    const showRoom = onValue(usesRef, async (snapshot) => {
      if (snapshot.exists()) {
        const userArray: any = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data as object,
        }))
        setRooms(userArray);
      } else {
        console.log('Chưa có phòng chơi nào!')
      }
    })
    return () => {
      showRoom();
      setIdPlayer(sessionStorage.getItem('idPlayerStorage'))
    }

  }, [])

  const handAddPlayerRoom = (idRoom: string, idPlayer: string) => {
    if (idPlayer !== '') {
      try {
        const usesRef = ref(database, 'player-x-room')
        const newDataRef = push(usesRef)
        set(newDataRef, {
          id_room: idRoom,
          id_player: idPlayer,
          del_flg: 0
        })
        router.push(`/room/${idRoom}`)
      } catch (error) {
        console.log(error)
      }
    } else {
      router.push(`/room/${idRoom}`)
    }
  }


  const handleJoinRoom = async (roomId: string) => {
    if (!idPlayer) return;

    const playerRoomRef = ref(database, 'player-x-room');
    const playerRoomSnapshot = await get(playerRoomRef);
    if (playerRoomSnapshot.exists()) {
      const playerRoomsData: any = playerRoomSnapshot.val();
      const playerRoomKeys = Object.keys(playerRoomsData);
      const existingPlayerRoom = playerRoomKeys.find(
        (key) => playerRoomsData[key].id_player === idPlayer && playerRoomsData[key].id_room === roomId
      );

      if (existingPlayerRoom) {
        update(ref(database, `player-x-room/${existingPlayerRoom}`), { rule: true, del_flg: 0 });
        router.push(`/room/${roomId}`);
        return;
      }
    }

    const newPlayerRoomRef = push(ref(database, 'player-x-room'));
    const newPlayerRoom = {
      id_player: idPlayer,
      id_room: roomId,
      del_flg: 0,
      rule: true
    };

    set(newPlayerRoomRef, newPlayerRoom).then(() => {
      router.push(`/room/${roomId}`);
    });
  };

  if (idPlayer) {
    return (
      <div className="bg-slate-900 text-white min-h-screen pt-16 px-2">

        <div className="max-w-3xl mx-auto ">

          <h1 className="text-4xl font-bold">List Rooms</h1>

          <hr className="mt-3 mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {rooms.map((room) => (
              <div key={room.id} className="px-4 py-2 bg-slate-800 rounded">
                <h2 className="text-2xl font-bold">{room.name}</h2>
                <button
                  className="bg-slate-900 rounded hover:bg-slate-700 mt-4 p-2"
                  onClick={() => {
                    handleJoinRoom(room.id)
                  }}
                >
                  Tham gia
                </button>
              </div>
            ))
            }
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <div className="bg-slate-900 text-white min-h-screen pt-16 px-2">
        <div className="max-w-3xl mx-auto ">
          <h1 className="text-4xl font-bold">List Rooms</h1>
          <hr className="my-3" />
          <Alert
            message="Đăng Nhập"
            description="Vui lòng tạo tài khoản"
            type="info"
            showIcon
            action={
              <Link href='/' className="bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-1">
                Home
              </Link>
            }
          />
        </div>
      </div>
    )
  }
};

export default Room;