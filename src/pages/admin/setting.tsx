'use client'

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Snackbar,
  SnackbarCloseReason,
  Alert
} from '@mui/material'

import { ref, update, onValue } from "firebase/database";
import { database } from "../../../firebase/config";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const idRoom = searchParams.get('idRoom');

  const [statusPass, setStatusPass] = useState<boolean>(false);
  const [roomDetail, setRoomDetail] = useState<any>(null);
  const [opensnackbar, setOpenSnackbar] = useState(false);

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
    }
  }, [idRoom, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoomDetail((prevDetail: any) => ({
      ...prevDetail,
      [name]: value,
    }));
  };

  const handleInputChangeNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsedValue = parseInt(value);
    setRoomDetail((prevDetail: any) => ({
      ...prevDetail,
      [name]: parsedValue,
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoomDetail((prevDetail: any) => ({
      ...prevDetail,
      [name]: value === 'true',
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await update(ref(database, `rooms/${idRoom}`), roomDetail);
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error updating settings: ', error);
      alert('Failed to update settings');
    }
  };

  // Hàm tính tổng số lượng vai trò
  const calculateTotalLimit = (roles: { [key: string]: string }) => {
    return Object.values(roles).reduce((total, num) => total + (parseInt(num) || 0), 0)
  }

  useEffect(() => {
    if (roomDetail?.roles) {
      const total = calculateTotalLimit(roomDetail.roles);
      setRoomDetail((prevDetail: any) => ({
        ...prevDetail,
        limit: total,
      }));
    }
  }, [roomDetail?.roles]);

  const handleRoleChange = (role: string, value: string) => {
    const updatedRoles = {
      ...roomDetail.roles,
      [role]: parseInt(value),
    };
    const totalLimit = calculateTotalLimit(updatedRoles);
    setRoomDetail((prevDetail: any) => ({
      ...prevDetail,
      roles: updatedRoles,
      limit: totalLimit,
    }));
  };

  return (
    <>
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
        <div className="flex justify-between gap-2 max-w-2xl  min-h-[60px] mx-auto py-3 px-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-2xl font-semibold"> AGL Game Board</h1>
          </div>
          <button
            className="px-2"
            onClick={() => {
              history.back()
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: '14px', marginBottom: '2px' }} />
            <span>Back</span>
          </button>
          <div className="p-2" >　</div>
        </div>
      </div>
      <div className="bg-slate-900 bg-hero-standard  text-white min-h-screen pt-16 pb-2 px-2 flex">
        <div className="absolute top-0 left-0 bg-hero-standard w-full h-full bg-filter"></div>
        <div className="relative max-w-2xl mx-auto w-full flex flex-col">
          <div className="border-t border-dashed py-3 px-2">
            <div className="flex items-center gap-2">
              <p>Phòng: </p>
              <div className="group-input">
                <input
                  type="text"
                  className="bg-transparent border-b px-2 py-1 relative focus:outline-none w-full"
                  value={roomDetail?.name || ''}
                  onChange={handleInputChange}
                  name="name"
                />
              </div>
            </div>
          </div>
          <div className="border-t border-dashed py-3 px-2">
            <div className="flex items-center gap-2">
              <p>Mật Khẩu: </p>
              <div className="relative group-input">
                <form id="fakeForm" style={{ display: 'none' }}></form>
                <input
                  type={statusPass ? "text" : "password"}
                  className="bg-transparent border-b px-2 py-1 relative focus:outline-none w-full"
                  value={roomDetail?.pass || ''}
                  onChange={handleInputChange}
                  name="pass"
                  form="fakeForm"
                />
                <button
                  className="absolute top-1/2 -translate-y-1/2 right-3"
                  onClick={() => { setStatusPass(!statusPass) }}
                >
                  {statusPass ? (
                    <VisibilityOffIcon fontSize="small" />
                  ) : (
                    <VisibilityIcon fontSize="small" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-dashed py-3 px-2">
            <div className="flex items-center gap-2">
              <p>Số Lượng Người Chơi: </p>
              <div className="group-input">
                <div className="border-b min-w-[150px] text-center">{roomDetail?.limit || ''}</div>
              </div>
              <div className="text-sm">( Bằng tổng số lượng vai trò )</div>
            </div>

          </div>
          <div className="border-y border-dashed py-3 px-2 mb-4">
            <p>Số Lượng Các Vai Trò:</p>
          </div>
          {['fool', 'hunter', 'seer', 'werewolf', 'halfWerewolf', 'witch', 'guardian', 'villager'].map(role => (
            <div className="py-1 px-4" key={role}>
              <div className="flex items-center gap-2">
                <p className="min-w-[100px]">{roleTranslations[role]}: </p>
                <div className="group-input">
                  <input
                    type="number"
                    className="bg-transparent border-b px-2 py-1 relative focus:outline-none w-full"
                    value={roomDetail?.roles?.[role] || '0'}

                    onChange={(e) => handleRoleChange(role, e.target.value)}
                    name={role}
                    min={0}
                  />
                </div>
              </div>
            </div>
          ))}
          <FormControl component="fieldset" className="border-t border-dashed pt-3 px-2 my-4">
            <p>Lộ Vai Trò Khi Chết: </p>
            <RadioGroup
              name="revealedOnDeath"
              value={roomDetail?.revealedOnDeath ? 'true' : 'false'}
              onChange={handleRadioChange}
              row
            >
              <FormControlLabel value="true" control={<Radio sx={{ '& .MuiSvgIcon-root': { color: "#fff", }, }} />} label="On" />
              <FormControlLabel value="false" control={<Radio sx={{ '& .MuiSvgIcon-root': { color: "#fff", }, }} />} label="Off" />
            </RadioGroup>
          </FormControl>

          <div className="text-center border-t border-dashed py-4 px-2">
            <div className="c-btn__main">
              <button
                className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900"
                onClick={handleSaveSettings}
              >
                <span className="relative">Lưu Cài Đặt</span>
              </button>
            </div>
          </div>
        </div>
      </div >
    </>
  )
}