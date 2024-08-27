
import Image from "next/image";
import LinearScaleIcon from '@mui/icons-material/LinearScale';

type PlayerCardProps = {
  index: number;
  playerRoom: any;
  players: any;
  idPlayer?: string | null;
  onRemovePlayer?: (id: string) => void;
  onModalActive?: () => void;
  showRemoveButton?: boolean;
};

export default function PlayerCard({ index, playerRoom, players, idPlayer, onRemovePlayer, onModalActive, showRemoveButton }: PlayerCardProps) {

  return (
    <>
      <div className={"min-h-[130px] h-[calc((100vh-122px)/4)] max-h-[180px] bg-slate-900 bg-wolvesville-large bg-contain bg-no-repeat bg-bottom relative border " + (players[playerRoom.id_player]?.id === idPlayer ? "border-blue-500" : "border-slate-500")} >
        <p className="bg-slate-600 px-2 py-1 rounded absolute top-2 left-1/2 -translate-x-1/2 text-nowrap text-xs md:text-sm">
          {index + 1} x {players[playerRoom.id_player]?.name || '...'}
        </p>
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
        <Image
          className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-[75%]"
          src="/images/avatar-02.png"
          width={500}
          height={500}
          alt="Picture of the author"
        />
      </div >

    </>
  )
}