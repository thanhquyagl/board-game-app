'use client';

import { useEffect, useState } from "react";
import { ref, remove, get, update, onValue } from "firebase/database";
import { database } from "../../../lib/firebase/config";
import { useRouter } from "next/navigation";
import { Input, InputNumber, Modal, message } from "antd";
import type { InputNumberProps } from 'antd';
import { SendOutlined, CloseOutlined, SettingOutlined, PlayCircleOutlined } from "@ant-design/icons";
import Image from "next/image";

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
      <div className="bg-slate-900 bg-hero-standard backdrop-filter text-white  p-2">
        {/* <div className="max-w-3xl mx-auto">
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
        </div> */}
        <div className="grid grid-cols-[350px_minmax(900px,_1fr)] gap-5 min-h-[calc(100vh-60px-1rem)]">
          <div className="flex flex-col h-full">
            <h1 className="text-center font-medium text-2xl uppercase">Phòng {room && room.name}</h1>
            <div className="flex items-center px-2 py-1 mt-3 border">
              <button
                className="p-2"
                title="Thoát phòng"
                onClick={() => {
                  if (idAdmin) {
                    setOpen(true);
                  } if (idPlayer) {
                    setOpenPopupPlayerOut(true);
                  }
                }}
              >
                <CloseOutlined />
              </button>
              <button
                className="p-2"
                title="Setting"
                onClick={() => { setOpenSetting(true) }}
              >
                <SettingOutlined />
              </button>
              {idAdmin && (
                <button
                  className={"p-2 " + (filteredPlayerxroom.length === room.limit ? '' : 'opacity-50')}
                  title="Start Game"
                  disabled={filteredPlayerxroom.length === room.limit ? false : true}
                  onClick={() => { openMessage() }}
                >
                  <PlayCircleOutlined />
                </button>
              )}

              <div className="text-center w-full">
                10s
              </div>

              <Modal title="Xoá Phòng" open={open} onOk={handleOk} onCancel={() => { setOpen(false) }} >
                <p>Bạn thật sự muốn xoá phòng chơi này?</p>
              </Modal>
              <Modal
                title="Thoát phòng"
                open={openPopupPlayerOut}
                onOk={handleOkPopupPlayerOut}
                onCancel={handleCancelPopupPlayerOut}
              >
                <p>Bạn muốn thoát khỏi phòng?</p>
              </Modal>
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
            <div className="flex flex-wrap gap-2 p-2 mt-3 border">
              <div className="w-[60px] h-[60px] bg-slate-500"></div>
            </div>
            <div className="mt-auto">
              <div className="mt-2 p-2 bg-slate-600 h-[500px] overflow-auto rounded scrollbar-thin scrollbar-gutter-auto scrollbar-track-white scrollbar-thumb-black">
                <div className="my-2">
                  <span className="bg-slate-800 px-2 py-1 rounded mr-2">1 x player :</span>
                  <span>số 1 là ma sói</span>
                </div>
              </div>
              <div className="flex mt-2 gap-2 relative">
                <input type="text"
                  className="w-full text-slate-900 p-2 pr-[50px] rounded focus:outline-none"
                  placeholder="Type your message"
                />
                <button
                  className=" text-slate-500 px-4 py-2 rounded absolute top-0 right-0 focus:outline-none"
                >
                  <SendOutlined />
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 items-start gap-4">
            {filteredPlayerxroom.map((playerRoom, index) => (
              <div key={index}>
                <div className="min-h-[calc((100vh-60px)/3-1rem)] bg-slate-900 bg-wolvesville-large bg-contain bg-no-repeat bg-bottom relative">
                  <p className="bg-slate-600 px-4 py-2 rounded absolute top-2 left-1/2 -translate-x-1/2 text-nowrap">{index + 1} x {players[playerRoom.id_player]?.name || 'Loading...'}</p>
                  <span className="absolute top-[60px] left-1/2 -translate-x-1/2">{playerRoom.del_flg === 0 ? '' : 'Offline'}</span>
                  <Image
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-[75%]"
                    src="/assets/avatar-03.png"
                    width={500}
                    height={500}
                    alt="Picture of the author"
                  />
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </>
  );
};

export default RoomClient;
