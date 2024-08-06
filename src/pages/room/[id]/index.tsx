'use client';

import { useEffect, useState } from "react";
import { ref, remove, get, update, onValue } from "firebase/database";
import { database } from "../../../../firebase/config";
import { useRouter, useParams } from "next/navigation";
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

type FieldType = {
  roomname?: string;
  roompass?: string;
  roomlimit?: number;
  rolekengoc?: number;
  rolethosan?: number;
  roletientri?: number;
  rolesoi?: number;
  rolebansoi?: number;
  rolephuthuy?: number;
  rolebaove?: number;
  roledanlang?: number;
  statusrole?: string;
};


export default function RoomClient({ params }: Props) {
  const id = useParams().id;
  const router = useRouter();
  const [room, setRoom] = useState<any>(null);
  const [playerxroom, setPlayerxroom] = useState<PlayerRoom[]>([]);
  const [players, setPlayers] = useState<{ [key: string]: any }>({});
  const [idAdmin, setIdAdmin] = useState<string | null>(null);
  const [idPlayer, setIdPlayer] = useState<string | null>(null);
  const [idPlayerRoom, setIdPlayerRoom] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [openPopupRemovePlayer, setOpenPopupRemovePlayer] = useState<boolean>(false);
  const [openPopupPlayerOut, setOpenPopupPlayerOut] = useState<boolean>(false);
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);
  const [openSetting, setOpenSetting] = useState<boolean>(false);
  const [numberSetting, setNumberSetting] = useState<any>('');
  const [nameRoom, setNameRoom] = useState<string>('');
  const [onOffRole, setOnOffRole] = useState(1);

  const [time, setTime] = useState(5);
  const [timePlay, setTimePlay] = useState(false);


  useEffect(() => {
    let timer: any;
    if (timePlay && time > 0) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      setTimePlay(false);
    }

    return () => clearInterval(timer);
  }, [timePlay, time]);

  const formatTime = (seconds: any) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };


  const openMessage = () => {
    setTime(5)
    setTimePlay(true)
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

  useEffect(() => {
    setIdAdmin(sessionStorage.getItem('idAdminStorage'));
    setIdPlayer(sessionStorage.getItem('idPlayerStorage'));
    const roomRef = ref(database, `rooms/${id}`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoom(snapshot.val());
        setNameRoom(snapshot.val().name)
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
          router.push('/rooms/');
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
        router.push('/rooms/');
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

  var indents = [];
  for (var i = 0; i < 16; i++) {
    indents.push(
      <div className="h-[180px] bg-slate-900 bg-wolvesville-large bg-contain bg-no-repeat bg-bottom relative border border-slate-500" key={i}>
        <p className="bg-slate-600 px-4 py-2 rounded absolute top-2 left-1/2 -translate-x-1/2 text-nowrap">1</p>
        <span className="absolute top-[60px] left-1/2 -translate-x-1/2"> </span>
        {idAdmin && (
          <button
            className="absolute bottom-3 right-3"
          >
            ...
          </button>
        )}
        <Image
          className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-[75%]"
          src="/images/avatar-03.png"
          width={500}
          height={500}
          alt="Picture of the author"
        />
      </div>
    );
  }

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
                router.push('/')
                if (idAdmin) {
                  setOpen(true);
                } if (idPlayer) {
                  setOpenPopupPlayerOut(true);
                }
              }}
            >
              <span>Back</span>
            </button>
            {!timePlay ? (
              <button
                className="p-2"
                title="Setting"
                onClick={() => { setOpenSetting(true) }}
              >
                setting
              </button>
            ) :
              idAdmin ? (
                <button
                  className="p-2"
                  title="Chuyển Đổi"
                >
                  [Chuyển Đổi]
                </button>
              ) : (

                <button
                  className="p-2"
                  title="Xem Vai Trò"
                >
                  [Xem Vai Trò]
                </button>
              )
            }
          </>
        </div>
      </div>
      <div>
        {/* <Modal title="Xoá Phòng" open={open} onOk={handleOk} onCancel={() => { setOpen(false) }} >
          <p>Bạn thật sự muốn xoá phòng chơi này?</p>
        </Modal>
        <Modal
          title="Thoát phòng"
          open={openPopupPlayerOut}
          onOk={handleOkPopupPlayerOut}
          onCancel={() => {
            setOpenPopupPlayerOut(false);
            setPlayerToRemove(null);
          }}
        >
        </Modal>

        <Modal
          title="Cài Đặt"
          open={openSetting}
          footer={null}
          onCancel={() => { setOpenSetting(false) }}
        // onOk={() => {
        //   if (idAdmin) {
        //     handlePlayerLimits()
        //   }
        //   setOpenSetting(false)
        // }}
        >
          <Form
            name="basic"
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
            style={{ maxWidth: 600 }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="on"
            initialValues={{
              roomname: nameRoom,
              rolebansoi: 1,
              statusrole: 1
            }}
          >
            <Form.Item<FieldType>
              label="Tên Phòng"
              name="roomname"
            >
              <Input />
            </Form.Item>
            <Form.Item<FieldType>
              label="Mật Khẩu"
              name="roompass"
            >
              <Input />
            </Form.Item>
            <Form.Item<FieldType>
              wrapperCol={{ offset: 0, span: 16 }}
              labelCol={{ offset: 0, span: 8 }}
              label="Số Lượng Người Chơi"
              name="roomlimit"
            >
              <Input />
            </Form.Item>
            <p className="py-2 border-t border-dashed mb-3">Số Lượng Các Vai Trò:</p>
            <div className="grid grid-cols-2 gap-x-3 border-b border-dashed mb-2">
              <Form.Item<FieldType>
                labelCol={{ offset: 0, span: 7 }}
                wrapperCol={{ offset: 0, span: 17 }}
                label="Kẻ Ngốc"
                name="rolebansoi"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
              <Form.Item<FieldType>
                labelCol={{ offset: 0, span: 7 }}
                wrapperCol={{ offset: 0, span: 17 }}
                label="Thợ Săn"
                name="rolebansoi"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
              <Form.Item<FieldType>
                labelCol={{ offset: 0, span: 7 }}
                wrapperCol={{ offset: 0, span: 17 }}
                label="Tiên Tri"
                name="rolebansoi"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
              <Form.Item<FieldType>
                labelCol={{ offset: 0, span: 7 }}
                wrapperCol={{ offset: 0, span: 17 }}
                label="Sói"
                name="rolebansoi"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
              <Form.Item<FieldType>
                labelCol={{ offset: 0, span: 7 }}
                wrapperCol={{ offset: 0, span: 17 }}
                label="Tiên Tri"
                name="rolebansoi"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
              <Form.Item<FieldType>
                labelCol={{ offset: 0, span: 7 }}
                wrapperCol={{ offset: 0, span: 17 }}
                label="Sói"
                name="rolebansoi"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
              <Form.Item<FieldType>
                labelCol={{ offset: 0, span: 7 }}
                wrapperCol={{ offset: 0, span: 17 }}
                label="Bán Sói"
                name="rolebansoi"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
              <Form.Item<FieldType>
                labelCol={{ offset: 0, span: 7 }}
                wrapperCol={{ offset: 0, span: 17 }}
                label="Phù Thủy"
                name="rolebansoi"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
              <Form.Item<FieldType>
                labelCol={{ offset: 0, span: 7 }}
                wrapperCol={{ offset: 0, span: 17 }}
                label="Bảo Vệ"
                name="rolebansoi"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
              <Form.Item<FieldType>
                labelCol={{ offset: 0, span: 7 }}
                wrapperCol={{ offset: 0, span: 17 }}
                label="Dân Làng"
                name="rolebansoi"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
            </div>
            <Form.Item<FieldType>
              wrapperCol={{ offset: 0, span: 16 }}
              labelCol={{ offset: 0, span: 8 }}
              label="Số Lượng Các Vai Trò"
              name="statusrole"
            >
              <Radio.Group onChange={onChange} value={onOffRole}>
                <Radio value={1}>On</Radio>
                <Radio value={0}>OFF</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 0, span: 24 }}>
              <div className="text-center">
                <button className="bg-blue-600 text-white px-4 py-2 rounded">
                  Lưu Cài Đặt
                </button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Xoá Người Chơi"
          open={openPopupRemovePlayer}
          onOk={handleOkPopupPlayer}
          onCancel={() => {
            setOpenPopupRemovePlayer(false);
            setPlayerToRemove(null);
          }}
        >
          <p>Bạn muốn xoá người chơi này khỏi phòng?</p>
        </Modal> */}
      </div>
      <div className="bg-slate-900 bg-hero-standard  text-white min-h-screen pt-16 pb-2 px-2 flex">
        <div className="absolute top-0 left-0 bg-hero-standard w-full h-full bg-filter"></div>
        <div className="relative max-w-2xl mx-auto w-full flex flex-col">
          <div className="px-2 py-1 border">
            {!timePlay ? (
              <div className="relative text-center">
                [ {room && room.name} ] [ {room && room.type} ]
              </div>

            ) : (
              <div className="pl-10">
                {formatTime(time)}
              </div>
            )}

          </div>
          <div className="grid grid-cols-4 items-start gap-1 mt-2 mb-auto">
            {filteredPlayerxroom.map((playerRoom, index) => (
              <div className="h-[180px] bg-slate-900 bg-wolvesville-large bg-contain bg-no-repeat bg-bottom relative border border-slate-500" key={index}>
                <p className="bg-slate-600 px-2 py-1 rounded absolute top-2 left-1/2 -translate-x-1/2 text-nowrap text-sm">{index + 1} x {players[playerRoom.id_player]?.name || '...'}</p>
                <span className="absolute top-[40px] left-1/2 -translate-x-1/2">{playerRoom.del_flg !== 0 && 'Off'}</span>
                {idAdmin && (
                  <button
                    className="absolute bottom-3 right-3"
                    onClick={() => {
                      setPlayerToRemove(playerRoom.id)
                      setOpenPopupRemovePlayer(true)
                    }}
                  >
                    ...
                  </button>
                )}
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
          {idAdmin ? (
            <div className="text-center">
              <div className="c-btn__main mt-3">
                <button
                  onClick={() => { openMessage() }}
                  className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900"
                  disabled={room ? (filteredPlayerxroom.length === room.limit ? false : true) : true}
                >
                  <span className="relative">Bắt Đầu Game</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="c-btn__main mt-3">
                <div className="py-1 px-6">
                  <span className="relative">Chờ Quản Trò Bắt Đầu Game</span>
                </div>
              </div>
            </div>

          )}
        </div>
      </div>
    </>
  );
};

// export default RoomClient;