'use client';

import { useEffect, useState } from "react";
import { ref, remove, get, update, onValue } from "firebase/database";
import { database } from "../../../lib/firebase/config";
import { useRouter } from "next/navigation";
import { Input, InputNumber, Modal, Timeline, message } from "antd";
import type { InputNumberProps } from 'antd';

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
  const [idAdmin, setIdAdmin] = useState<string | null>(null);
  const [idPlayer, setIdPlayer] = useState<string | null>(null);
  const [idPlayerRoom, setIdPlayerRoom] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [openPopupRemovePlayer, setOpenPopupRemovePlayer] = useState<boolean>(false);
  const [openPopupPlayerOut, setOpenPopupPlayerOut] = useState<boolean>(false);
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);
  const [openSetting, setOpenSetting] = useState<boolean>(false);
  const [numberSetting, setNumberSetting] = useState<any>('');
  const [messageApi, contextHolder] = message.useMessage();

  const onChangeInputNumber: InputNumberProps['onChange'] = (value) => {
    setNumberSetting(value)
  };

  const key = 'updatable'
  const openMessage = () => {
    messageApi.open({
      key,
      type: 'loading',
      content: 'loading...',
    });

    setTimeout(() => {
      messageApi.open({
        key,
        type: 'success',
        content: 'Game Start',
        duration: 2,
      });
    }, 1000);
  };

  const handleOk = () => {
    handleDeleteRoom();
  };

  const handleOkPopupPlayer = () => {
    if (playerToRemove) {
      handleDeletePlayer(playerToRemove);
    }
  };

  const handleOkPopupPlayerOut = () => {
    handleMoveRoom();
  };


  const handleCancelPopupPlayer = () => {
    setOpenPopupRemovePlayer(false);
    setPlayerToRemove(null);
  };

  const handleCancelPopupPlayerOut = () => {
    setOpenPopupPlayerOut(false);
    setPlayerToRemove(null);
  };

  useEffect(() => {
    setIdAdmin(sessionStorage.getItem('idAdminStorage'));
    setIdPlayer(sessionStorage.getItem('idPlayerStorage'));
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

        const currentPlayerRoom = playerRoomsData.find((pr: any) => pr.id_player === idPlayer && pr.id_room === id);
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
          router.push('/room/');
        }
      });

      return () => unsubscribePlayerRoom();
    }
  }, [idPlayerRoom, router]);

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

  const handleDeletePlayer = async (idPlayerRoom: string) => {
    try {
      const playerRoomRef = ref(database, `player-x-room/${idPlayerRoom}`);
      await update(playerRoomRef, { rule: false });
      setOpenPopupRemovePlayer(false);
      setTimeout(() => {
        remove(ref(database, `player-x-room/${idPlayerRoom}`));
      }, 1000)
    } catch (error) {
      alert('không thể kích người chơi, vui lòng thử lại');
    }
  };

  const handleMoveRoom = async () => {
    try {
      if (idPlayerRoom) {
        const playerRoomRef = ref(database, `player-x-room/${idPlayerRoom}`);
        await update(playerRoomRef, { del_flg: 1 });
        setOpenPopupRemovePlayer(false);
        router.push('/room/');
      }
    } catch (error) {
      alert('không thể thoát người chơi, vui lòng thử lại');
    }
  };

  const handlePlayerLimits = async () => {
    try {
      const roomRef = ref(database, `rooms/${room.id}`)
      await update(roomRef, { limit: numberSetting })
    }
    catch (error) {
      console.log(error);
    }
  }

  const filteredPlayerxroom = playerxroom.filter(playerRoom => playerRoom.id_room === id && playerRoom.rule === true);


  return (
    <>
      {contextHolder}
      <div className="bg-slate-900 text-white min-h-screen pt-16 px-2">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold">Phòng - {room ? room.name : 'Loading...'}</h1>
          <div className="flex gap-4 pb-6 my-6 border-b">
            {room && room.admin === idAdmin && (
              <>
                <button
                  className="flex-none bg-red-700 rounded text-slate-50 px-3 py-2 font-bold"
                  onClick={() => {
                    setOpen(true);
                  }}
                >
                  Back
                </button>
                <Modal title="Xoá Phòng" open={open} onOk={handleOk} onCancel={() => { setOpen(false) }} >
                  <p>Bạn thật sự muốn xoá phòng chơi này?</p>
                </Modal>

                <button
                  className={"flex-none bg-blue-500 rounded text-slate-200 px-3 py-2 font-bold " + (filteredPlayerxroom.length === room.limit ? '' : 'opacity-50 cursor-no-drop')}
                  disabled={filteredPlayerxroom.length === room.limit ? false : true}
                  onClick={() => { openMessage() }}
                >
                  Start
                </button>
              </>
            )}
            {idPlayer && (
              <>
                <button
                  className="flex-none bg-red-700 rounded text-slate-50 px-3 py-2 font-bold"
                  onClick={() => {
                    setOpenPopupPlayerOut(true);
                  }}
                >
                  Back
                </button>
                <Modal
                  title="Thoát phòng"
                  open={openPopupPlayerOut}
                  onOk={handleOkPopupPlayerOut}
                  onCancel={handleCancelPopupPlayerOut}
                >
                  <p>Bạn muốn thoát khỏi phòng?</p>
                </Modal>
              </>
            )}
            <button
              className="flex-none bg-white rounded text-slate-900 px-3 py-2 font-bold"
              onClick={() => { setOpenSetting(true) }}
            >
              Setting
            </button>
            <Modal
              title="Cài Số Người Chơi"
              open={openSetting}
              onCancel={() => { setOpenSetting(false) }}
              onOk={() => {
                if (idAdmin) {
                  handlePlayerLimits()
                }
                setOpenSetting(false)
              }}
            >
              {
                idAdmin && (
                  <InputNumber
                    className="w-full"
                    min={0}
                    defaultValue={0}
                    onChange={onChangeInputNumber}
                  />
                )
              }
              {idPlayer && room && (
                <p>
                  Số người chời: {room.limit > 0 ? room.limit : '...'}
                </p>
              )}
            </Modal>
          </div>

          <h2 className="text-2xl pb-4 my-6 border-b">Danh sách người chơi</h2>
          <table className="w-full text-center">
            <tbody>
              <tr>
                <th className="px-2 py-4 border-b">STT</th>
                <th className="px-2 py-4 border-b">Tên Player</th>
                <th className="px-2 py-4 border-b">Trạng thái</th>
                {idAdmin && <th className="px-2 py-4 border-b">...</th>}
              </tr>
              {filteredPlayerxroom.map((playerRoom, index) => (
                <tr key={playerRoom.id}>
                  <td className="px-2 py-4 border-b">{index + 1}</td>
                  <td className="px-2 py-4 border-b">{players[playerRoom.id_player]?.name || 'Loading...'}</td>
                  <td className="px-2 py-4 border-b">{playerRoom.del_flg === 0 ? 'Online' : 'Offline'}</td>
                  {idAdmin && (
                    <td className="px-2 py-4 border-b">
                      <button
                        onClick={() => {
                          setPlayerToRemove(playerRoom.id);
                          setOpenPopupRemovePlayer(true);
                        }}
                        className="bg-red-800 text-slate-50 px-3 py-1 text-sm rounded font-semibold hover:bg-red-500 transition-all"
                      >
                        Kích
                      </button>
                      <Modal
                        title="Xoá Người Chơi"
                        open={openPopupRemovePlayer}
                        onOk={handleOkPopupPlayer}
                        onCancel={handleCancelPopupPlayer}
                      >
                        <p>Bạn muốn xoá người chơi này khỏi phòng?</p>
                      </Modal>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default RoomClient;
