import Image from "next/image"
type IconDM = {
  nightMode: boolean
}

const IconDayMoon = ({ nightMode }: IconDM) => {
  return (
    <>
      <div className="absolute top-12 right-12 w-[120px] h-[120px] group-icon-night-mode">
        <div
          className={"absolute top-0 left-0 items " + (nightMode ? '' : 'active')}
        >
          <Image
            src="/images/day-mode.png"
            alt="day mode"
            width={120}
            height={120}
          />
          <p className="text-center icon-text">Sáng Rồi</p>
        </div>
        <div
          className={"absolute top-0 left-0 items " + (nightMode ? 'active' : '')}
        >
          <Image
            src="/images/moon-mode.png"
            alt="day mode"
            width={120}
            height={120}
          />
          <p className="text-center icon-text">Tối Rồi</p>
        </div>
      </div>
    </>
  )
}

export default IconDayMoon