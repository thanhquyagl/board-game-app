'use client'
import { get, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { database } from "../../lib/firebase/config";
import Link from "next/link";

const Room = () => {

  const [rooms, setRooms] = useState([])


  useEffect(() => {
    const usesRef = ref(database, 'rooms')
    get(usesRef).then((snapshot) => {
      if (snapshot.exists()) {
        const userArray = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
        }))
        setRooms(userArray);
      } else {
        console.log('No data available')
      }
    }).catch((error) => {
      console.log(error)
    })
  })

  return (
    <div className="bg-slate-900 text-white min-h-screen pt-16">
    
      <div className="max-w-3xl mx-auto ">

        <h1 className="text-4xl font-bold">List Rooms</h1>

        <hr className="my-3" />
        {
          rooms.map((room) => (
            <div key={room.id}>
              <div className="flex gap-1">
                <Link href={`/room/${room.id}`} id={room.id}>{room.name}</Link>
              </div>
            </div>
          ))
        }

      </div>
    </div>
  );
};

export default Room;