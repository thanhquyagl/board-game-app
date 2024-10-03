'use client'

import { useEffect, useState } from "react";
import { ref, get, update, onValue, remove } from "firebase/database";
import { database } from "../../../firebase/config";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Head from "next/head";
import ModalComponent from "../../../components/ModalComponent";
import roleData from "../../../lib/rolesWolvesvilles.json";
import IconDayMoon from "../../../components/IconDayMoon";
import PlayerCard from "../../../components/PlayerCard";

type PlayerRoom = {
  id: string;
  id_player: string;
  id_room: string;
  del_flg: number;
  [key: string]: any;
};

function ChildModal() {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <div className="c-btn__main min-w-[200px] items-center">
        <button onClick={handleOpen} className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900 w-full">
          <span className="relative">Tiên tri soi bài</span>
        </button>
      </div>

      <ModalComponent
        isOpen={open}
        onClose={handleClose}
        title={<p className="text-center">Vai trò người chơi X</p>}
        content={
          <div className="px-2 py-3 border-y border-dashed my-4">
            <p>
              Vai Trò:

            </p>
            <p>
              - Đây là vai trò của người chơi được tiên tri soi bài
            </p>
          </div>
        }
        actions={
          <button onClick={handleClose} className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm">
            Đóng
          </button>
        }
      />
    </div>
  );
}

export default function Admin() {
  const router = useRouter();

  const [id, setId] = useState<string | null>('');
  const [players, setPlayers] = useState<{ [key: string]: any }>({});
  const [playerxroom, setPlayerxroom] = useState<PlayerRoom[]>([]);
  const [roomDetail, setRoomDetail] = useState<any>(null);

  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  const [openModalAction, setOpenModalAction] = useState(false);
  const [openModalConvert, setOpenModalConvert] = useState(false);

  const handleClose = () => setOpenModal(false);
  const handleCloseAction = () => setOpenModalAction(false);
  const handleCloseConvert = () => setOpenModalConvert(false);

  const handleOpenActionModal = (playerRoom: any) => {
    setSelectedPlayer(playerRoom);
    setOpenModalAction(true);
  };

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
  }, [id, router, roomDetail]);


  const handleStartGame = async () => {
    const updatedRoomDetail = {
      ...roomDetail,
      start: false,
    };
    try {
      await update(ref(database, `rooms/${id}`), updatedRoomDetail);
      setRoomDetail(updatedRoomDetail)
      router.push('/admin/')
    } catch (error) {
      console.error('Error starting game: ', error);
    }
  }

  const handleNightMode = async (nightMode: boolean) => {
    try {
      const updatedRoomDetail = {
        ...roomDetail,
        nightMode: nightMode,
      };
      await update(ref(database, `rooms/${id}`), updatedRoomDetail);
      setRoomDetail(updatedRoomDetail);
    } catch (error) {
      console.error('Error starting game: ', error);
    }
  };

  const handleRoomVotes = async (status: boolean) => {
    try {
      const updatedRoomDetail = {
        ...roomDetail,
        votes: status,
      };
      await update(ref(database, `rooms/${id}`), updatedRoomDetail);
      setRoomDetail(updatedRoomDetail);
    } catch (error) {
      console.error('Error starting game: ', error);
    }
  }

  const filteredPlayerxroom = playerxroom.filter(playerRoom => playerRoom.id_room === id && playerRoom.rule === true);

  const ResultVoted = () => {
    const { voted_player, id_voted_player } = filteredPlayerxroom.reduce(
      (acc, player) => {
        if (player.vote_player > acc.voted_player) {
          return {
            voted_player: player.vote_player,
            id_voted_player: player.id_player
          };
        }
        return acc;
      },
      { voted_player: 0, id_voted_player: '' }
    );

    const voterPlayerRoom = playerxroom.find((pr: any) => pr.id_player === id_voted_player && pr.id_room === id);
    const id_pxr = voterPlayerRoom?.id as string
    handleRipPlayer(id_pxr)
    handleRemoveAllVoteds(id as string);
  };

  const handleRipPlayer = async (id_pxr: string) => {
    try {
      await update(ref(database, `player-x-room/${id_pxr}`), { rip: true, vote_player: 0 });
    } catch (error) {
      console.error('Error starting game: ', error);
    }
  }

  const handleRemoveAllVoteds = (idRoom: string) => {
    filteredPlayerxroom.forEach(async (playerRoom: any) => {
      if (playerRoom.id_room === id) {
        update(ref(database, `player-x-room/${playerRoom.id}`), { vote_player: 0 });
      }
    });
  }

  return (
    <div>
      <Head>
        <title>Admin game</title>
      </Head>
      <div className="bg-transparent absolute top-0 left-0 w-full text-white z-10">
        <div className="flex justify-between gap-2 max-w-2xl  min-h-[60px] mx-auto py-3 px-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-base md:text-2xl font-semibold"> AGL Game Board</h1>
          </div>
          <button
            className="px-2"
            onClick={() => {
              setOpenModal(true)
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: '14px', marginBottom: '2px' }} />
            <span>Back</span>
          </button>
          <ModalComponent
            isOpen={openModal}
            onClose={handleClose}
            title="Thoát Game"
            content={
              <p>
                Bạn muốn thoát game? <br />
                Bạn sẽ quay về phòng chơi!
              </p>
            }
            actions={
              <div className="flex justify-end gap-3">
                <button className="border rounded px-3 py-1" onClick={() => { handleClose() }}>Quay lại</button>
                <button className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm" onClick={() => { handleStartGame() }}>Thoát Game</button>
              </div>
            }
          />
          <button
            className="p-2"
            title="Setting"
            onClick={() => {
              setOpenModalConvert(true)
            }}
          >
            [ Chuyển Đổi ]
          </button>
          <ModalComponent
            isOpen={openModalConvert}
            onClose={handleCloseConvert}
            title={<p className="text-center">Chuyển Đổi Giai Đoạn</p>}
            content={
              <div className="border-y border-dashed py-3 px-4 my-4 flex flex-col gap-4 items-start">
                <div className="c-btn__main min-w-[120px] items-center">
                  <button
                    className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900 w-full"
                    onClick={() => {
                      if (roomDetail?.nightMode) {
                        handleNightMode(false)
                      } else {
                        handleNightMode(true)
                      }
                    }}
                  >
                    <span className="relative">{roomDetail?.nightMode === false ? 'Ban đêm' : 'Ban ngày'}</span>
                  </button>
                </div>
                <div className="c-btn__main min-w-[120px] items-center">
                  <button
                    className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900 w-full"
                    onClick={() => {
                      alert('Thảo luận')
                    }}
                  >
                    <span className="relative">Thảo luận</span>
                  </button>
                </div>
                <div className="c-btn__main min-w-[120px] items-center">
                  <button
                    className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900 w-full"
                    onClick={() => {
                      alert('Bỏ phiếu')
                    }}
                  >
                    <span className="relative">Bỏ Phiếu</span>
                  </button>
                </div>
                <div className="c-btn__main min-w-[120px] items-center">
                  <button
                    className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900 w-full"
                  >
                    <span className="relative">...</span>
                  </button>
                </div>
              </div>
            }
            actions={
              <button className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm" onClick={() => { handleCloseConvert() }}>Đóng</button>
            }
          />
        </div>
      </div>
      <div className={(roomDetail?.nightMode === false ? 'bg-slate-600 ' : 'bg-slate-900 ') + "bg-hero-standard text-white min-h-screen pt-16 pb-2 px-2 flex relative overflow-hidden"}>
        <div className={"absolute top-0 left-0 bg-hero-standard w-full h-full " + (roomDetail?.nightMode === false ? 'bg-filter-night-mode' : 'bg-filter')}></div>
        <IconDayMoon
          nightMode={roomDetail?.nightMode}
        />
        <div className="relative max-w-2xl mx-auto w-full flex flex-col">
          <div className="px-2 py-1 border">
            <div className="relative pl-4">
              01:29
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-1 mt-2 mb-auto">
            {filteredPlayerxroom.map((playerRoom, index) => (
              <PlayerCard
                key={index}
                index={index}
                playerRoom={playerRoom}
                players={players}
                showRemoveButton={true}
                onModalActive={() => { handleOpenActionModal(playerRoom) }}
              />
            ))}
          </div>
          <ModalComponent
            isOpen={openModalAction}
            onClose={handleCloseAction}
            title={<p className="text-center">Chọn Hành Động</p>}
            content={
              <div>
                <div className="border-t border-dashed py-3 px-4 mt-4">
                  <div className="text-center c-btn__main min-w-[200px] items-center flex-none bg-transparent text-white px-6 py-1">

                    {selectedPlayer ? `Người chơi: ${players[selectedPlayer.id_player]?.name || '...'}` : 'Người chơi không tồn tại'}

                  </div>
                </div>
                <div className="border-y border-dashed py-3 px-4 mb-4 flex flex-col gap-2 items-start">
                  <div className="text-center c-btn__main min-w-[200px] items-center flex-none bg-transparent text-white px-6 py-1">
                    Bị treo cổ
                  </div>
                  <div className="text-center c-btn__main min-w-[200px] items-center flex-none bg-transparent text-white px-6 py-1">
                    Được bảo vệ
                  </div>
                  <div className="text-center c-btn__main min-w-[200px] items-center flex-none bg-transparent text-white px-6 py-1">
                    Bị sói cắn
                  </div>
                  <div className="c-btn__main min-w-[200px] items-center flex-none bg-transparent text-white px-6 py-1">
                    Bị phù thủy đầu độc
                  </div>
                  <ChildModal />
                </div>
              </div>
            }
            actions={
              <button className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm" onClick={() => { handleCloseAction() }}>Đóng</button>
            }
          />
          <div className="flex justify-between">
            <div className="c-btn__main">
              <button
                className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900"
                onClick={() => {
                  if (roomDetail?.nightMode) {
                    handleNightMode(false)
                  } else {
                    handleNightMode(true)
                  }
                }}
              >
                <span className="relative">{roomDetail?.nightMode === false ? 'Ban đêm' : 'Ban ngày'}</span>
              </button>
            </div>
            <div className="c-btn__main">
              <button
                className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900"
                onClick={() => {
                  alert('Thảo luận')
                }}
              >
                <span className="relative">Thảo luận</span>
              </button>
            </div>
            <div className="c-btn__main">
              <button
                className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900"
                onClick={() => {
                  if (roomDetail?.votes) {
                    handleRoomVotes(false)
                    ResultVoted()
                  } else {
                    handleRoomVotes(true)
                  }
                }}
              >
                <span className="relative">{roomDetail?.votes ? 'Dừng Bỏ Phiêu' : 'Bỏ Phiếu'}</span>
              </button>
            </div>
          </div>
        </div>
      </div >
    </div>
  )
}