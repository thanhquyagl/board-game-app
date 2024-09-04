import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import { database } from "../firebase/config"

type Message = {
  id_room?: string
  id_message?: string
  sender_id: string
  text: string
  timestamp: number
}

const useMessages = (roomId: string) => {
  const [messages, setMessages] = useState<Message[]>([])


  useEffect(() => {
    const messagesRef = ref(database, `messages/${roomId}`)

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const messagesArray = Object.keys(data).map((key) => ({
          id_message: key,
          ...data[key],
        }))
        setMessages(messagesArray)
      } else {
        setMessages([])
      }
    })

    return () => unsubscribe()
  }, [roomId])

  return messages
}

export default useMessages