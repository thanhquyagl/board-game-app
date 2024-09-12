'use client'

import { useEffect, useState } from "react";
import { ref, get, update, onValue } from "firebase/database";
import { database } from "../../../firebase/config";
import { useRouter } from "next/navigation";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Modal from '@mui/material/Modal';
import PlayerCard from "../../../components/PlayerCard";
import Head from "next/head";


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
  const handleClose = () => setOpenModal(false);

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
        console.error('Không tìm thấy dữ liệu');
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

  useEffect(() => {
    if (roomDetail?.start) {
      router.push('/player/game')
    }
  })

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

  const filteredPlayerxroom = playerxroom.filter(playerRoom => playerRoom.id_room === id && playerRoom.rule === true);

  return (
    <>
      <Head>
        <title>Phòng Chờ - Game {roomDetail && roomDetail.type}</title>
      </Head>
      <div className="bg-transparent absolute top-0 left-0 w-full text-white z-10">
        <div className="flex justify-between gap-2 max-w-2xl  min-h-[60px] mx-auto py-3 px-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-base md:text-2xl font-semibold"> AGL Game Board</h1>
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
                router.push(`/player/setting?idRoom=${id}`)
              }}
            >
              [ Setting ]
            </button>
          </>
        </div>
      </div>
      <div className="bg-slate-900 bg-hero-standard  text-white min-h-screen pt-16 pb-2 px-2 flex relative">
        <div className="absolute top-0 left-0 bg-hero-standard w-full h-full bg-filter"></div>
        <div className="relative max-w-2xl mx-auto w-full flex flex-col">
          <div className="px-2 py-1 border">
            <div className="relative text-center">
              [ {roomDetail && roomDetail.name} ] [ {roomDetail && roomDetail.type} ]
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-1 mt-2 mb-auto">
            {filteredPlayerxroom.map((playerRoom, index) => (
              <PlayerCard
                key={index}
                index={index}
                playerRoom={playerRoom}
                players={players}
                showRemoveButton={false}
                idPlayer={idPlayer}
              />
            ))}
          </div>
          <div className="text-center">
            <div className="c-btn__main">
              <span className="relative">Chờ Quản Trò Bắt Đầu Game</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}