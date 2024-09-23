import Image from "next/image";
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import roleData from "../lib/rolesWolvesvilles.json";

type PlayerCardProps = {
  index: number;
  playerRoom: any;
  players: any;
  idPlayer?: string | null;
  onRemovePlayer?: (id: string) => void;
  onModalActive?: () => void;
  showRemoveButton?: boolean;
  handleRound?: (id: string, idRoom: string, role: string) => void;
};

export default function PlayerCard({ index, playerRoom, players, idPlayer, showRemoveButton, onRemovePlayer, onModalActive, handleRound }: PlayerCardProps) {

  return (
    <>
      <div
        className={"min-h-[130px] h-[calc((100vh-122px)/4)] max-h-[180px] bg-slate-900 bg-wolvesville-large bg-contain bg-no-repeat bg-bottom relative border " + (players[playerRoom.id_player]?.id === idPlayer ? "border-blue-500 " : "border-slate-500 ") + (playerRoom.del_flg !== 0 && 'filter blur-[1px]')}

      >
        {idPlayer != playerRoom?.id_player && handleRound && (
          <button
            className="absolute top-0 left-0 bg-transparent w-full h-full z-10"
            onClick={() => {
              handleRound(playerRoom.id_player, playerRoom.id_room, playerRoom.role)
            }}
          ></button>
        )}
        <p className="bg-slate-600 px-2 py-1 rounded absolute top-2 left-1/2 -translate-x-1/2 text-nowrap text-xs md:text-sm flex flex-col items-center md:flex-row md:justify-center gap-1">
          <p>{index + 1}</p>
          <span className="hidden md:block"> x </span>
          <p>{players[playerRoom.id_player]?.name || ''}</p>
        </p>
        <span className="absolute top-[40px] left-1/2 -translate-x-1/2">
          {playerRoom.vote_player > 0 && playerRoom.vote_player}
        </span>
        <span className="absolute top-[40px] left-1/2 -translate-x-1/2">
          {playerRoom.del_flg !== 0 && 'Off'}
        </span>
        {showRemoveButton && onRemovePlayer && (
          <button
            className="absolute bottom-1 right-1 p-2 flex z-10"
            onClick={() => onRemovePlayer(playerRoom.id)}
          >
            <LinearScaleIcon sx={{ fontSize: '14px' }} />
          </button>
        )}
        {
          playerRoom?.rip ? (
            <Image
              className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-[50%]"
              src={'/images/icon_rip.png'}
              width={500}
              height={500}
              alt="Picture of the author"
            />
          ) : (
            <Image
              className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-[75%]"
              src={players[playerRoom.id_player]?.avatar || '/images/avatar-01.png'}
              width={500}
              height={500}
              alt="Picture of the author"
            />
          )
        }
        {showRemoveButton && (
          <span className="absolute bottom-[90px] md:bottom-7 left-1/2 -translate-x-1/2 text-nowrap text-xs md:text-base">[{roleData.roles.find(role => role.key === playerRoom?.role)?.name}]</span>
        )}
        {onModalActive &&(

          <button
          className="absolute bottom-1 left-1/2 -translate-x-1/2 text-nowrap text-xs md:text-base"
          onClick={() => {
            if (onModalActive) {
              onModalActive();
            }
            
          }}
          >
          [ Hành Động ]
        </button>
        )}
      </div>
    </>
  )
}