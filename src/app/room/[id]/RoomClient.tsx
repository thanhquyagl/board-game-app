'use client';

import { useEffect, useState } from "react";
import { ref, get, remove } from "firebase/database";
import { database } from "../../../lib/firebase/config";
import { useRouter } from "next/navigation";

type Props = {
  params: { id: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

const RoomClient = ({ params }: Props) => {
  const id = params.id;
  const [room, setRoom] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const roomRef = ref(database, `rooms/${id}`);
    get(roomRef).then((snapshot) => {
      if (snapshot.exists()) {
        setRoom(snapshot.val());
      } else {
        console.log('Không có dữ liệu');
      }
    }).catch((error) => {
      console.log(error);
    });
  }, [id]);

  const handleDeleteRoom = () => {
    remove(ref(database, `rooms/${id}`));
    router.push('/');
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen pt-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold">Phòng - {room ? room.name : 'Loading...'}</h1>
        <hr className="my-3" />
        <div className="flex gap-4">
          <button
            className="flex-none bg-red-700 rounded text-slate-50 px-3 py-2 font-bold"
            onClick={handleDeleteRoom}
          >
            Back
          </button>
          <button
            className="flex-none bg-white rounded text-slate-900 px-3 py-2 font-bold"
          >
            Setting
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomClient;
