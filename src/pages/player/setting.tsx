'use client'

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import {
  Snackbar,
  SnackbarCloseReason,
  Alert,
} from '@mui/material'

import { ref, onValue, update } from "firebase/database";
import { database } from "../../../firebase/config";
import Image from "next/image";
import ModalComponent from "../../../components/ModalComponent";
import listAvatar from "../../../lib/listAvatar.json";

const roleTranslations: { [key: string]: string } = {
  fool: 'Kẻ Ngốc',
  hunter: 'Thợ Săn',
  seer: 'Tiên Tri',
  werewolf: 'Sói',
  halfWerewolf: 'Bán Sói',
  witch: 'Phù Thủy',
  guardian: 'Bảo Vệ',
  villager: 'Dân Làng',
};

export default function Setting() {
  const searchParams = useSearchParams();
  const idRoom = searchParams.get('idRoom');
  const [idPlayer, setIdPlayer] = useState<string | null>(null);
  const [roomDetail, setRoomDetail] = useState<any>(null);
  const [player, setPlayer] = useState<any>([])
  const [opensnackbar, setOpenSnackbar] = useState(false);
  const [onOpenModal, setOnOpenModal] = useState<boolean>(false)
  const [avatarValue, setAvatarValue] = useState<string>('/images/avatar-01.png')

  const handleCloseModal = () => {
    setOnOpenModal(false);
  };

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  useEffect(() => {
    setIdPlayer(sessionStorage.getItem('idPlayerStorage'))
    const usesRefPlayer = ref(database, `players/${idPlayer}/`)
    const showNamePlayer = onValue(usesRefPlayer, async (snapshot) => {
      if (snapshot.exists()) {
        setPlayer(snapshot.val());
        setAvatarValue(snapshot.val()?.avatar)
      }
      else {
        console.log('error');
      }
    })
    return () => {
      showNamePlayer();
    }
  }, [idPlayer])

  useEffect(() => {
    if (!idRoom) return;

    const roomRef = ref(database, `rooms/${idRoom}`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoomDetail(snapshot.val());
      }
    }, (error) => {
      console.log(error);
    });

    return () => {
      unsubscribeRoom();
    };
  }, [idRoom]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlayer((prevDetail: any) => ({
      ...prevDetail,
      [name]: value,
    }));
  }

  const handleAvatarChange = (e: string) => {
    const value = e
    setPlayer((prevDetail: any) => ({
      ...prevDetail,
      "avatar": value,
    }));
  }

  const handleSaveSettings = async () => {
    try {
      await update(ref(database, `players/${idPlayer}`), player);
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error updating settings: ', error);
      alert('Failed to update settings');
    }
  };

  return (
    <div>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={opensnackbar}
        autoHideDuration={1000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Cập nhật Setting thành công!
        </Alert>
      </Snackbar>
      <div className="bg-transparent absolute top-0 left-0 w-full text-white z-10">
        <div className="flex justify-between gap-2 max-w-2xl min-h-[60px] mx-auto py-3 px-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-2xl font-semibold">AGL Game Board</h1>
          </div>
          <button className="px-2" onClick={() => history.back()}>
            <ArrowBackIosNewIcon sx={{ fontSize: '14px', marginBottom: '2px' }} />
            <span>Back</span>
          </button>
          <div className="p-2">　</div>
        </div>
      </div>
      <div className="bg-slate-900 bg-hero-standard text-white min-h-screen pt-16 pb-2 px-2 flex">
        <div className="absolute top-0 left-0 bg-hero-standard w-full h-full bg-filter"></div>
        <div className="relative max-w-2xl mx-auto w-full flex flex-col">
          <div className="border-t border-dashed py-3 px-2">
            <div className="flex items-center gap-4">
              <p>Tên Người Chơi: </p>
              <div className="group-input">
                <input
                  type="text"
                  className="bg-transparent border-b px-2 py-1 relative focus:outline-none w-full"
                  value={player?.name || ''}
                  onChange={handleInputChange}
                  name="name"
                />
              </div>

            </div>
          </div>
          <div className=" py-3 px-2">
            <div className="flex items-center gap-4">
              <p>Avatar: </p>
              <div className="border flex">
                <button onClick={() => { setOnOpenModal(true) }}>
                  <Image
                    src={avatarValue || '/images/avatar-01.png'}
                    alt="use-avatar"
                    width={100}
                    height={100}
                  />
                </button>
                <ModalComponent
                  isOpen={onOpenModal}
                  onClose={handleCloseModal}
                  title='Chọn ảnh đại diện cho bạn'
                  content={
                    <div className="grid  grid-cols-3 md:grid-cols-4 gap-1">
                      {
                        Object.entries(listAvatar.avatar).map((t, k) =>
                          <label
                            key={k}
                            className="flex items-center justify-center border cursor-pointer hover:border-blue-400"
                            htmlFor={'avatar' + k}
                          >
                            <input type="radio" id={'avatar' + k} value={t[1].url} hidden
                              onChange={(e) => {
                                setAvatarValue(e.target.value)
                                handleAvatarChange(e.target.value)
                              }}
                            />
                            <Image
                              src={t[1].url || 'images/avatar-01.png'}
                              alt="use-avatar"
                              width={120}
                              height={120}
                            />
                          </label>
                        )
                      }
                    </div>
                  }
                  actions={
                    <button onClick={handleCloseModal} className="border rounded px-3 py-1 bg-red-700 border-red-700 shadow-sm">
                      Đóng
                    </button>
                  }
                />
              </div>
              <div className="c-btn__main">
                <button
                  className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900"
                  onClick={handleSaveSettings}
                >
                  <span className="relative">Lưu</span>
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-dashed py-3 px-2">
            <div className="flex items-center gap-2">
              <p>Phòng: </p>

              <p className="border-b min-w-[150px] text-center">{roomDetail?.name}</p>
            </div>
          </div>
          {
            roomDetail?.pass && (
              <div className="border-t border-dashed py-3 px-2">
                <div className="flex items-center gap-2">
                  <p>Mật Khẩu: </p>
                  <div className="min-w-[150px] text-center border-b">
                    {roomDetail?.pass || '　'}
                  </div>
                </div>
              </div>
            )
          }
          <div className="border-t border-dashed py-3 px-2">
            <div className="flex items-center gap-2">
              <p>Số Lượng Người Chơi: </p>
              <p className="border-b min-w-[150px] text-center">{roomDetail?.limit}</p>
            </div>
          </div>
          <div className="border-y border-dashed py-3 px-2 mb-4">
            <p>Số Lượng Các Vai Trò:</p>
          </div>
          {['fool', 'hunter', 'seer', 'werewolf', 'halfWerewolf', 'witch', 'guardian', 'villager'].map(role => (
            <div className="py-1 px-4" key={role}>
              <div className="flex items-center gap-2">
                <p className="min-w-[100px]">{roleTranslations[role]}: </p>
                <div className="min-w-[150px] text-center border-b">
                  {roomDetail?.roles?.[role] || '0'}
                </div>
              </div>
            </div>
          ))}
          <div className="border-y border-dashed py-3 px-2 my-4">
            <p>Lộ Vai Trò Khi Chết: </p>
            <p>{roomDetail?.roles?.revealedOnDeath ? 'On' : 'Off'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
