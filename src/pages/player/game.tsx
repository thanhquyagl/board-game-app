'use client'

import { useEffect, useRef, useState } from "react";
import { ref, get, update, onValue } from "firebase/database";
import { database } from "../../../firebase/config";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PlayerCard from "../../../components/PlayerCard";
import ModalComponent from "../../../components/ModalComponent";
import roleData from "../../../lib/rolesWolvesvilles.json";
import IconDayMoon from "../../../components/IconDayMoon";
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
  const [roomDetail, setRoomDetail] = useState<any>(null);
  const [idPlayer, setIdPlayer] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ [key: string]: any }>({});
  const [playerxroom, setPlayerxroom] = useState<PlayerRoom[]>([]);
  const [idPlayerRoom, setIdPlayerRoom] = useState<string | null>(null);
  const [rolePlayer, setRolePlayer] = useState<string>('')

  const [openModal, setOpenModal] = useState(false);
  const [openModalSeeRole, setOpenModalSeeRole] = useState(false);
  const handleClose = () => setOpenModal(false);
  const handleCloseSeeRole = () => setOpenModalSeeRole(false);
  const isVoted = useRef(false)

  useEffect(() => {
    setIdPlayer(sessionStorage.getItem('idPlayerStorage'));
    setId(sessionStorage.getItem('idRoom'));

    const roomRef = ref(database, `rooms/${id}`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoomDetail(snapshot.val());
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
      setIdPlayerClicked('')
    };
  }, [id, idPlayer, router]);

  useEffect(() => {
    if (idPlayerRoom) {
      const playerRoomRef = ref(database, `player-x-room/${idPlayerRoom}`);
      const unsubscribePlayerRoom = onValue(playerRoomRef, (snapshot) => {
        setRolePlayer(snapshot.val()?.role)
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

  const [idPlayerClicked, setIdPlayerClicked] = useState<string>('')

  const handleMorningVote = async (id: string, idRoom: string, role: string) => {
    setIdPlayerClicked(id)
    if (idPlayerClicked !== id) {
      console.log(idPlayerClicked);

      isVoted.current = false
      try {

        const previousVotedPlayerRoom = playerxroom.find((pr: any) => pr.id_player === idPlayerClicked && pr.id_room === idRoom);
        if (previousVotedPlayerRoom) {
          const previousVotedPlayerRoomRef = ref(database, `player-x-room/${previousVotedPlayerRoom.id}`);
          await update(previousVotedPlayerRoomRef, {
            vote_player: previousVotedPlayerRoom.vote_player !== 0 && previousVotedPlayerRoom.vote_player - 1
          });
        }
      } catch (error) {
        console.error(error)
      }

    }
    if (isVoted.current) return
    const voterPlayerRoom = playerxroom.find((pr: any) => pr.id_player === id && pr.id_room === idRoom);
    const votePlayers = voterPlayerRoom?.vote_player
    try {
      if (voterPlayerRoom?.id) {
        const playerRoomRef = ref(database, `player-x-room/${voterPlayerRoom.id}`);
        await update(playerRoomRef, { vote_player: votePlayers + 1 });
        handleClose()
        isVoted.current = true
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (roomDetail?.votes) {
      isVoted.current = false
    }
  }, [roomDetail?.votes])

  const filteredPlayerxroom = playerxroom.filter(playerRoom => playerRoom.id_room === id && playerRoom.rule === true);

  return (
    <>
      <Head>
        <title>PLay Game {roomDetail && roomDetail.type}</title>
      </Head>
      <div className="bg-transparent absolute top-0 left-0 w-full z-10 text-white">
        <div className="flex justify-between gap-2 max-w-2xl  min-h-[60px] mx-auto py-3 px-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-base md:text-2xl font-semibold"> AGL Game Board</h1>
          </div>
          <>
            <button className="px-2" onClick={() => { setOpenModal(true) }}>
              <ArrowBackIosNewIcon sx={{ fontSize: '14px', marginBottom: '2px' }} />
              <span>Back</span>
            </button>
            <ModalComponent
              isOpen={openModal}
              onClose={handleClose}
              title="Thoát Phòng"
              content={
                <p>Bạn muốn thoát phòng?</p>
              }
              actions={
                <>
                  <button className="border rounded px-3 py-1" onClick={() => { handleClose() }} >Canel</button>
                  <button className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm" onClick={() => { handleMoveRoom() }} >Exit</button>
                </>
              }
            />
            <button className="p-2" title="Setting" onClick={() => { setOpenModalSeeRole(true) }}>[ Xem Vai Trò ]</button>
            <ModalComponent
              isOpen={openModalSeeRole}
              onClose={handleCloseSeeRole}
              title={<p>Vai Trò Của Bạn : [{roleData.roles.find(role => role.key === rolePlayer)?.name}]</p>}
              content={
                <>
                  <div className="border-t border-dashed py-3 px-4 my-4 flex flex-col gap-4 items-start">
                    <Image
                      src={roleData.roles.find(role => role.key === rolePlayer)?.image || "/images/seer.png"}
                      width={120}
                      height={120}
                      alt="Picture of the author"
                    />
                  </div>
                  <div className="border-y border-dashed py-5 px-4 my-4 flex flex-col gap-2 items-start text-wrap">
                    <p>Mô Tả Vai Trò:</p>
                    <p>
                      {roleData.roles.find(role => role.key === rolePlayer)?.description}
                    </p>
                  </div>
                </>
              }
              actions={
                <>
                  <button className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm" onClick={() => { handleCloseSeeRole() }} >Đóng</button>
                </>
              }
            />
          </>
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
          <div>
          </div>
          <div className="grid grid-cols-4 items-start gap-1 mt-2 mb-auto">
            {filteredPlayerxroom.map((playerRoom, index) => (
              <>
                <PlayerCard
                  key={index}
                  index={index}
                  playerRoom={playerRoom}
                  players={players}
                  showRemoveButton={false}
                  idPlayer={idPlayer}
                  handleRound={roomDetail?.votes && handleMorningVote}
                />
              </>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}