'use client'

import { useEffect, useState } from "react";
import { ref, remove, get, update, onValue } from "firebase/database";
import { database } from "../../../firebase/config";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import Modal from '@mui/material/Modal';


type PlayerRoom = {
  id: string;
  id_player: string;
  id_room: string;
  del_flg: number;
  [key: string]: any;
};

export default function Admin() {
  const router = useRouter();

  const [id, setId] = useState<string | null>('');
  const [roomDetail, serRoomDetail] = useState<any>(null);
  const [players, setPlayers] = useState<{ [key: string]: any }>({});
  const [playerxroom, setPlayerxroom] = useState<PlayerRoom[]>([]);
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [openModalPlayer, setOpenModalPlayer] = useState(false);
  const handleClose = () => setOpenModal(false);
  const handleClosePlayer = () => setOpenModalPlayer(false);

  useEffect(() => {
    const idAdminStorage = sessionStorage.getItem('idAdminStorage');
    setId(idAdminStorage);
  }, []);

  useEffect(() => {
    if (!id) return;
    const roomRef = ref(database, `rooms/${id}`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        serRoomDetail(snapshot.val());
      } else {
        router.push('/');
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
      sessionStorage.removeItem('idAdminStorage');
      router.push('/');
    } catch (error) {
      console.error('Lỗi xoá room: ', error);
    }
  };

  const handleOkPopupPlayer = () => {
    if (playerToRemove) {
      handleDeletePlayer(playerToRemove);
    }
  };

  const handleDeletePlayer = async (idPlayerRoom: string) => {
    try {
      const playerRoomRef = ref(database, `player-x-room/${idPlayerRoom}`);
      remove(ref(database, `player-x-room/${idPlayerRoom}`));
      await update(playerRoomRef, { rule: false });
      handleClosePlayer()
      setTimeout(() => {
        remove(ref(database, `player-x-room/${idPlayerRoom}`));
      }, 1000)
    } catch (error) {
      alert('không thể kích người chơi, vui lòng thử lại');
    }
  };

  const filteredPlayerxroom = playerxroom.filter(playerRoom => playerRoom.id_room === id && playerRoom.rule === true);

  return (
    <>
      <div className="bg-transparent absolute top-0 left-0 w-full text-white z-10">
        <div className="flex justify-between gap-2 max-w-2xl  min-h-[60px] mx-auto py-3 px-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-2xl font-semibold"> AGL Game Board</h1>
          </div>
          <>
            <button
              className="px-2"
              onClick={() => {
                setOpenModal(true)
              }}
            >
              <ArrowBackIosNewIcon sx={{ fontSize: '14px', marginBottom: '2px' }} />
              <span>Back</span>
            </button>
            <Modal
              open={openModal}
              onClose={handleClose}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <div
                className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 border rounded max-w-full w-[600px] bg-gray-950 shadow-sm"
              >
                <p className="text-2xl font-bold">Thoát Phòng</p>
                <p className="my-2">Bạn muốn thoát phòng? Phòng sẽ bị xoá khi bạn thoát ra!</p>
                <div className="flex justify-end gap-3">
                  <button
                    className="border rounded px-3 py-1"
                    onClick={() => {
                      handleClose()
                    }}
                  >
                    Quay lại
                  </button>
                  <button
                    className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm"
                    onClick={() => {
                      handleDeleteRoom()
                    }}
                  >
                    Tiếp trục
                  </button>
                </div>
              </div>
            </Modal>

            <button
              className="p-2"
              title="Setting"
              onClick={() => {
                router.push(`/admin/setting?idRoom=${id}`)
              }}
            >
              [ Setting ]
            </button>
          </>
        </div>
      </div>
      <div className="bg-slate-900 bg-hero-standard  text-white min-h-screen pt-16 pb-2 px-2 flex">
        <div className="absolute top-0 left-0 bg-hero-standard w-full h-full bg-filter"></div>
        <div className="relative max-w-2xl mx-auto w-full flex flex-col">
          <div className="px-2 py-1 border">
            <div className="relative text-center">
              [ {roomDetail && roomDetail.name} ] [ {roomDetail && roomDetail.type} ]
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-1 mt-2 mb-auto">
            {filteredPlayerxroom.map((playerRoom, index) => (
              <div className="h-[180px] bg-slate-900 bg-wolvesville-large bg-contain bg-no-repeat bg-bottom relative border border-slate-500" key={index}>
                <p className="bg-slate-600 px-2 py-1 rounded absolute top-2 left-1/2 -translate-x-1/2 text-nowrap text-sm">{index + 1} x {players[playerRoom.id_player]?.name || '...'}</p>
                <span className="absolute top-[40px] left-1/2 -translate-x-1/2">{playerRoom.del_flg !== 0 && 'Off'}</span>
                <button
                  className="absolute bottom-1 right-1 p-2 flex"
                  onClick={() => {
                    setPlayerToRemove(playerRoom.id)
                    setOpenModalPlayer(true)
                  }}
                >
                  <LinearScaleIcon sx={{ fontSize: '14px' }} />
                </button>
                <Image
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-[75%]"
                  src="/assets/avatar-03.png"
                  width={500}
                  height={500}
                  alt="Picture of the author"
                />
              </div>
            ))}
          </div>
          <>
            <Modal
              open={openModalPlayer}
              onClose={handleClosePlayer}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <div
                className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 border rounded max-w-full w-[600px] bg-gray-950 shadow-sm"
              >
                <p className="text-2xl font-bold">Xoá Người Chơi</p>
                <p className="my-2">Bạn muốn xoá người chơi ra <u>{roomDetail && roomDetail.name} </u> của bạn?</p>
                <div className="flex justify-end gap-3">
                  <button
                    className="border rounded px-3 py-1"
                    onClick={() => {
                      handleClosePlayer()
                    }}
                  >
                    Quay Lại
                  </button>
                  <button
                    className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm"
                    onClick={() => {
                      handleOkPopupPlayer()
                      setPlayerToRemove(playerToRemove)
                    }}
                  >
                    Tiếp trục
                  </button>
                </div>
              </div>
            </Modal>
          </>
          <div className="text-center">
            <div className="c-btn__main">
              <button
                className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900"
                disabled={roomDetail ? (filteredPlayerxroom.length === roomDetail.limit ? false : true) : true}
              >
                <span className="relative">Bắt Đầu Game</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}