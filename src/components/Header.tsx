import Link from "next/link";

export default function Header() {
  return (
    <div className="bg-slate-900 text-white py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-4">
          <Link href='/'>Board Games</Link>
        </div>
      </div>
    </div>
  )
}