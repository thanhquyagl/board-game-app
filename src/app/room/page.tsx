'use client'
import { push, get, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { database } from "../../lib/firebase/config";
import { useRouter, useSearchParams } from "next/navigation";
type Room = {
  id: string;
  name: string;
  [key: string]: any;
};

const Room = () => {

  const [rooms, setRooms] = useState<Room[]>([])
  const searchParams = useSearchParams();
  const idPlayer = searchParams.get('idPlayer') || '';


  useEffect(() => {
    const usesRef = ref(database, 'rooms')
    get(usesRef).then((snapshot) => {
      if (snapshot.exists()) {
        const userArray: any = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data as object,
        }))
        setRooms(userArray);
      } else {
        console.log('No data available')
      }
    }).catch((error) => {
      console.log(error)
    })
  })

  const router = useRouter()

  const handAddPlayerRoom = (idRoom: string, idPlayer: string) => {
    console.log(idRoom, idPlayer)

    if (idPlayer !== '') {
      try {
        const usesRef = ref(database, 'player-x-room')
        const newDataRef = push(usesRef)
        const playerRoomId = newDataRef.key
        set(newDataRef, {
          id: playerRoomId,
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


  return (
    <div className="bg-slate-900 text-white min-h-screen pt-16">

      <div className="max-w-3xl mx-auto ">

        <h1 className="text-4xl font-bold">List Rooms</h1>

        <hr className="my-3" />
        {
          rooms.map((room) => (
            <div key={room.id}>
              <div className="flex gap-1">
                <button
                  className=""
                  onClick={() => {
                    handAddPlayerRoom(room.id, idPlayer)
                  }}
                >
                  {room.name}
                </button>


              </div>
            </div>
          ))
        }

      </div>
    </div>
  );
};

export default Room;