'use client'

import { useEffect, useState } from "react";
import { ref, remove, get, update, onValue } from "firebase/database";
import { database } from "../../../firebase/config";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import SendIcon from '@mui/icons-material/Send';
import Modal from '@mui/material/Modal';


type PlayerRoom = {
  id: string;
  id_player: string;
  id_room: string;
  del_flg: number;
  [key: string]: any;
};

export default function Player() {
  const router = useRouter();

  const [id, setId] = useState<string | null>('');
  const [roomDetail, serRoomDetail] = useState<any>(null);
  const [idPlayer, setIdPlayer] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ [key: string]: any }>({});
  const [playerxroom, setPlayerxroom] = useState<PlayerRoom[]>([]);
  const [idPlayerRoom, setIdPlayerRoom] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [openModalSeeRole, setOpenModalSeeRole] = useState(false);
  const handleClose = () => setOpenModal(false);
  const handleCloseSeeRole = () => setOpenModalSeeRole(false);

  useEffect(() => {
    setIdPlayer(sessionStorage.getItem('idPlayerStorage'));
    setId(sessionStorage.getItem('idRoom'));

    const roomRef = ref(database, `rooms/${id}`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        serRoomDetail(snapshot.val());
      } else {
        router.push('/rooms/');
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

        const currentPlayerRoom = playerRoomsData.find((pr: any) => pr.id_player === idPlayer && pr.id_room === id && pr.rule === true);
        if (currentPlayerRoom) {
          setIdPlayerRoom(currentPlayerRoom.id);
        }
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
  }, [id, idPlayer, router]);

  useEffect(() => {
    if (idPlayerRoom) {
      const playerRoomRef = ref(database, `player-x-room/${idPlayerRoom}`);
      const unsubscribePlayerRoom = onValue(playerRoomRef, (snapshot) => {
        const playerRoomData = snapshot.val();
        if (playerRoomData && playerRoomData.rule === false) {
          router.push('/rooms/');
        }
      });
      return () => unsubscribePlayerRoom();
    }
  }, [idPlayerRoom, router]);

  const handleMoveRoom = async () => {
    try {
      if (idPlayerRoom) {
        const playerRoomRef = ref(database, `player-x-room/${idPlayerRoom}`);
        await update(playerRoomRef, { del_flg: 1 });
        handleClose()
        router.push('/rooms/');
      }
    } catch (error) {
      alert('không thể thoát người chơi, vui lòng thử lại');
    }
  };

  useEffect(() => {
    if (roomDetail?.start === false) {
      router.push('/player/')
    }
  })

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
                <p className="my-2">Bạn muốn thoát phòng?</p>
                <div className="flex justify-end gap-3">
                  <button
                    className="border rounded px-3 py-1"
                    onClick={() => {
                      handleClose()
                    }}
                  >
                    Canel
                  </button>
                  <button
                    className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm"
                    onClick={() => {
                      handleMoveRoom()
                    }}
                  >
                    Exit
                  </button>
                </div>
              </div>
            </Modal>

            <button
              className="p-2"
              title="Setting"
              onClick={() => {
                setOpenModalSeeRole(true)
              }}
            >
              [ Xem Vai Trò ]
            </button>
            <Modal
              open={openModalSeeRole}
              onClose={handleCloseSeeRole}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >

              <div
                className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 border border-dashed max-w-full w-[600px] bg-gray-950 shadow-sm"
              >
                <p className="text-xl font-bold text-center">Vai Trò Của Bạn</p>
                <div className="border-t border-dashed py-3 px-4 my-4 flex flex-col gap-4 items-start">
                  <Image
                    src="/img-tien-tri.jpg"
                    width={120}
                    height={120}
                    alt="Picture of the author"
                  />
                </div>
                <div className="border-y border-dashed py-5 px-4 my-4 flex flex-col gap-2 items-start">
                  <p>Mô Tả Vai Trò:</p>
                  <p>
                    。。。。。。。。。。。。。。。。。。。。。。。。。。
                    。。。。。。。。。。。。。。。。。。。。。。。。。。
                    。。。。。。。。。。。。。。。。。。。。。。。。。。
                    。。。。。。。。。。。。。。。。。。。。。。。。。。
                    。。。。。。。。。。。。。。。。。。。。。。。。。。
                    。。。。。。。。。。。。。。。。。。。。。。。。。。
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm"
                    onClick={() => {
                      handleCloseSeeRole()
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </Modal>
          </>
        </div>
      </div>
      <div className="bg-slate-900 bg-hero-standard  text-white min-h-screen pt-16 pb-2 px-2 flex">
        <div className="absolute top-0 left-0 bg-hero-standard w-full h-full bg-filter"></div>
        <div className="relative max-w-2xl mx-auto w-full flex flex-col">
          <div className="px-2 py-1 border">
            <div className="relative pl-4">
              01:29
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-1 mt-2 mb-auto">
            {filteredPlayerxroom.map((playerRoom, index) => (
              <div className="h-[180px] bg-slate-900 bg-wolvesville-large bg-contain bg-no-repeat bg-bottom relative border border-slate-500" key={index}>
                <p className="bg-slate-600 px-2 py-1 rounded absolute top-2 left-1/2 -translate-x-1/2 text-nowrap text-sm">{index + 1} x {players[playerRoom.id_player]?.name || '...'}</p>
                <span className="absolute top-[40px] left-1/2 -translate-x-1/2">{playerRoom.del_flg !== 0 && 'Off'}</span>
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
          <div className="text-center">
            <div className="relative">
              <input type="text" className="border bg-transparent w-full py-3 pl-4 pr-11 focus:outline-none" />
              <SendIcon className="absolute top-1/2 -translate-y-1/2 right-3" sx={{ fontSize: "20px" }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}