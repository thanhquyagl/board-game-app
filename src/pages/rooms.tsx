import { push, get, ref, set, update, onValue } from "firebase/database";
import { useEffect, useState } from "react";
import { database } from "../../firebase/config";
import { useRouter } from "next/navigation";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

type Rooms = {
  id: string;
  name: string;
  length: number;
  [key: string]: any;
};

const Rooms = () => {

  const [rooms, setRooms] = useState<Rooms[]>([])
  const [idPlayer, setIdPlayer] = useState<string | null>(null)
  const [namePlayer, setNamePlayer] = useState<string | null>('')
  const router = useRouter()

  useEffect(() => {
    setIdPlayer(sessionStorage.getItem('idPlayerStorage'))
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
    }
  }, [])

  useEffect(() => {
    const usesRefPlayer = ref(database, `players/${idPlayer}/name`)
    const showNamePlayer = onValue(usesRefPlayer, async (snapshot) => {
      if (snapshot.exists()) {
        setNamePlayer(snapshot.val())
      }
      else {
        console.log('error');
      }
    })
    return () => {
      showNamePlayer();
    }
  }, [idPlayer])

  const handleJoinRoom = async (roomId: string, roomLength: number) => {
    if (!idPlayer) return;
    sessionStorage.setItem("idRoom", roomId);

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
        router.push(`/player/`);
        return;
      }
    }

    try {
      update(ref(database, `rooms/${roomId}`), { length: roomLength + 1 });
    } catch (error) {
      console.log('update room length' + error);
    }

    const newPlayerRoomRef = push(ref(database, 'player-x-room'));
    const newPlayerRoom = {
      id_player: idPlayer,
      id_room: roomId,
      del_flg: 0,
      rule: true
    };

    set(newPlayerRoomRef, newPlayerRoom).then(() => {
      router.push(`/player/`);
    });
  };

  return (
    <>
      <div className="bg-transparent absolute top-0 left-0 w-full text-white z-10">
        <div className="flex justify-between gap-2 max-w-2xl  min-h-[60px] mx-auto py-3 px-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-2xl font-semibold"> AGL Game Board</h1>
          </div>
          <button
            className="px-2"
            onClick={() => {
              router.push('/');
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: '14px', marginBottom: '2px' }} />
            <span>Back</span>
          </button>
        </div>
      </div>
      <div className="bg-slate-900 bg-hero-standard  text-white min-h-screen pt-16 px-2">
        <div className="absolute top-0 left-0 bg-hero-standard w-full h-full bg-filter"></div>

        <div className="relative max-w-2xl mx-auto">
          <p className="text-xl font-medium border-b border-dashed py-4 mb-4">Người Chơi: {namePlayer}</p>
          <h2 className="text-xl font-medium border-b border-dashed py-4 mb-4">Danh Sách Phòng</h2>

          <div className="grid grid-cols-1 gap-4">

            {rooms.map((room) => (
              <div key={room.id} className="w-full group-input border-b border-dashed py-4 mb-4">
                <button
                  className="w-full p-2 flex justify-between"
                  onClick={() => {
                    if (room.length === room.limit) {
                      alert('Room Full')
                    } else {
                      handleJoinRoom(room.id, room.length)
                    }
                  }}
                >
                  <span>Phòng {room.name}</span>
                  <span>{room.length}/{room.limit}</span>
                </button>
              </div>
            ))
            }
          </div>
        </div>
      </div>
    </>
  )
};

export default Rooms;