'use client'

import { useEffect, useState } from "react";
import { ref, remove, get, update, onValue } from "firebase/database";
import { database } from "../../../firebase/config";
import { useRouter } from "next/navigation";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PlayerCard from "../../../components/PlayerCard";
import Head from 'next/head'
import ModalComponent from "../../../components/ModalComponent";

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
  const [roomDetail, setRoomDetail] = useState<any>(null);
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
        setRoomDetail(snapshot.val());
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
      await remove(ref(database, `messages/${id}`));

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
      await remove(ref(database, `player-x-room/${idPlayerRoom}`));
      await update(playerRoomRef, { rule: false });
      handleClosePlayer()
      setTimeout(() => {
        remove(playerRoomRef);
      }, 1000)
      handleLengthRoom();
    } catch (error) {
      alert('không thể kích người chơi, vui lòng thử lại');
    }
  };

  const handleStartGame = async () => {
    try {
      await assignRolesToPlayers();
      const updatedRoomDetail = {
        ...roomDetail,
        start: true,
        nightMode: false,
      };
      await update(ref(database, `rooms/${id}`), updatedRoomDetail);
      setRoomDetail(updatedRoomDetail);
      router.push('/admin/game');
    } catch (error) {
      console.error('Error starting game: ', error);
    }
  };


  const filteredPlayerxroom = playerxroom.filter(playerRoom => playerRoom.id_room === id && playerRoom.rule === true);

  const handleLengthRoom = async () => {
    const updatedRoomDetail = {
      ...roomDetail,
      length: filteredPlayerxroom.length - 1,
    };

    try {
      update(ref(database, `rooms/${id}`), updatedRoomDetail);
      setRoomDetail(updatedRoomDetail)

    } catch (error) {
      console.log('Error update room length');
    }
  }

  const handleRemovePlayer = (id: string) => {
    setPlayerToRemove(id);
    setOpenModalPlayer(true);
  };

  const [roleArray, setRoleArray] = useState<string[]>([]);
  const assignRolesToPlayers = async () => {
    if (!id || !roomDetail?.roles || roleArray.length > 0) return;

    const newRoleArray: string[] = [];
    Object.entries(roomDetail.roles).forEach(([role, count]) => {
      const roleCount = count as number;
      for (let i = 0; i < roleCount; i++) {
        newRoleArray.push(role);
      }
    });

    for (let i = newRoleArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newRoleArray[i], newRoleArray[j]] = [newRoleArray[j], newRoleArray[i]];
    }

    setRoleArray(newRoleArray);

    try {
      const playerRoomRef = ref(database, `player-x-room`);
      const snapshot = await get(playerRoomRef);

      if (snapshot.exists()) {
        const playerData = snapshot.val();
        const playersInRoom = Object.entries(playerData)
          .filter(([, value]) => (value as any).id_room === id)
          .map(([key]) => key);

        const updates: any = {};
        playersInRoom.forEach((playerId, index) => {
          const role = newRoleArray[index] || newRoleArray[newRoleArray.length - 1];
          updates[`${playerId}/role`] = role;
        });

        await update(playerRoomRef, updates);
        console.log("Roles assigned successfully!");
      }
    } catch (error) {
      console.error("Error assigning roles: ", error);
    }
  };

  return (
    <>
      <Head>
        <title>Admin index</title>
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
                setOpenModal(true);
              }}
            >
              <ArrowBackIosNewIcon sx={{ fontSize: '14px', marginBottom: '2px' }} />
              <span>Back</span>
            </button>
            <ModalComponent
              isOpen={openModal}
              onClose={handleClose}
              title="Thoát Phòng"
              content={<p>Bạn muốn thoát phòng? Phòng sẽ bị xoá khi bạn thoát ra!</p>}
              actions={
                <>
                  <button className="border rounded px-3 py-1" onClick={handleClose}>Quay lại</button>
                  <button className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm" onClick={handleDeleteRoom}>Tiếp tục</button>
                </>
              }
            />
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
                onRemovePlayer={handleRemovePlayer}
                showRemoveButton={true}
              />
            ))}
          </div>
          <>
            <ModalComponent
              isOpen={openModalPlayer}
              onClose={handleClosePlayer}
              title="Xoá Người Chơi"
              content={<p>Bạn muốn xoá người chơi ra <u>{roomDetail && roomDetail.name}</u> của bạn?</p>}
              actions={
                <>
                  <button className="border rounded px-3 py-1" onClick={handleClosePlayer}>Quay lại</button>
                  <button className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm" onClick={handleOkPopupPlayer}>Tiếp tục</button>
                </>
              }
            />
          </>
          <div className="text-center">
            <div className="c-btn__main">
              <button
                className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900"
                onClick={() => {
                  if (filteredPlayerxroom.length === roomDetail.limit) {
                    handleStartGame()
                  } else {
                    alert('Số lượng người chơi chưa trùng với số vai trò!!')
                  }
                }}
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