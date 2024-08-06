import { useState } from "react";
import { push, set, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import {
  Select,
  Snackbar,
  SnackbarCloseReason,
  MenuItem,
  Alert
} from '@mui/material'
import Slugify from "../lib/slugify";
import { database } from "../firebase/config";
import { usePlayer } from "../contexts/AuthContext";

export default function FormCreateRoom() {
  const [nameRoom, setNameRoom] = useState('');
  const [typeRoom, setTypeRoom] = useState('');
  const [passRoom, setPassRoom] = useState('');
  const [opensnackbar, setOpenSnackbar] = useState(false);
  const { setIdAdmin } = usePlayer();
  const router = useRouter();

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const roles = {
    fool: 1,
    hunter: 1,
    seer: 1,
    werewolf: 1,
    halfWerewolf: 1,
    witch: 1,
    guardian: 1,
    villager: 1,
    revealedOnDeath: false,
  };
  
  const handleAddRoom = () => {
    if (nameRoom) {
      try {
        const slug = Slugify(nameRoom);
        const usesRef = ref(database, 'rooms');
        const newDataRef = push(usesRef);
        const roomId = newDataRef.key;
        const idAdmin = newDataRef.key as string;

        set(newDataRef, {
          id: roomId,
          name: nameRoom,
          slug,
          admin: idAdmin,
          limit: 2,
          type: typeRoom,
          pass: passRoom,
          roles: roles
        });

        sessionStorage.setItem("idAdminStorage", idAdmin);
        setIdAdmin(idAdmin)
        setNameRoom('');
        router.push(`/admin`);
      } catch (error) {
        console.log(error);
      }
    } else {
      setOpenSnackbar(true);
    }
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
          severity="warning"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Không để trống tên phòng
        </Alert>
      </Snackbar>
      <h2 className="text-xl font-medium text-center border-b border-dashed py-4 mb-4">TẠO PHÒNG</h2>
      <div className="border-b border-dashed pb-4 flex flex-col gap-4">
        <label className="block">Tên Phòng:</label>
        <div className="group-input">
          <input
            type="text"
            className="bg-transparent border-b px-2 py-1 relative focus:outline-none w-full"
            value={nameRoom}
            onChange={(e) => setNameRoom(e.target.value)}
          />
        </div>
        <label className="block">Mật Khẩu <span className="text-xs">(Tùy Chọn)</span>:</label>
        <div className="group-input">
          <input
            type="text"
            className="bg-transparent border-b px-2 py-1 relative focus:outline-none w-full"
            value={passRoom}
            onChange={(e) => setPassRoom(e.target.value)}
          />
        </div>

        <label className="block">Chọn Game:</label>
        <div className="group-input">
          <div className="border-b w-full">
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={typeRoom}
              onChange={(e) => { setTypeRoom(e.target.value) }}
              style={{ width: '100%' }}
              className="text-white"
              inputProps={{
                className: 'px-2 py-1 text-white',
              }}
              sx={{
                "& fieldset": { border: 'none' },
                "& svg": { color: 'white' },
              }}
            >
              <MenuItem value={'Werewolf'} autoFocus={true}>Werewolf</MenuItem>
              <MenuItem value={'Uno'}>Uno</MenuItem>
            </Select>
          </div>
        </div>

        <div className="text-center">
          <div className="c-btn__main">
            <button
              onClick={handleAddRoom}
              className="flex-none bg-transparent text-white px-6 py-1 font-semibold hover:text-slate-900"
            >
              <span className="relative">Tạo Phòng</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}