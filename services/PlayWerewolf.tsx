import { useState } from "react"

const PlayWerewolf = (props: any) => {
  let count = props
  
  let [round, setRound] = useState<object[]>([])

  if(count != 0 && count % 2 != 0) {
    const udpateRound = {
      ...round,
      count
    }
    setRound([udpateRound])
  }
  return round;
}

export default PlayWerewolf