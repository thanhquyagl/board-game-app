'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dropdown, Button, Space } from "antd";
import { DownOutlined, LogoutOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { usePlayer } from "../lib/PlayerContext";
import { database } from "../lib/firebase/config";
import { remove, ref } from "firebase/database";

export default function Header() {
  const { idPlayer, setIdPlayer, idAdmin, setIdAdmin } = usePlayer();
  const router = useRouter();

  const handleMenuClick: MenuProps['onClick'] = () => {
    if (idPlayer) {
      remove(ref(database, `players/${idPlayer}`));
      sessionStorage.removeItem('idPlayerStorage');
      setIdPlayer(null);
      router.push('/');
    }
  };

  const items: MenuProps['items'] = [
    {
      label: 'Logout',
      key: '1',
      icon: <LogoutOutlined />,
    }
  ];

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <div className="bg-slate-900 text-white py-3 px-2 h-[40px]">
      <div className="flex justify-between gap-2 max-w-3xl mx-auto">
        <div className="flex gap-4">
          <Link href='/'>Board Games</Link>
        </div>
        {
          idPlayer && (
            <Dropdown menu={menuProps}>
              <Button>
                <Space>
                  Player
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          ) 
        }
        {
          idAdmin && "Hi Admin"
        }
      </div>
    </div>
  )
}
