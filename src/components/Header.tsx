'use client'

import { useRouter } from "next/navigation";
import { Dropdown, Button, Space } from "antd";
import { LeftOutlined, LogoutOutlined } from "@ant-design/icons";
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
    <div className="bg-transparent absolute top-0 left-0 w-full text-white">
      <div className="flex justify-between gap-2 max-w-2xl  min-h-[60px] mx-auto py-3 px-2">
        <button
          className="px-2 hidden"
        >
          <LeftOutlined /> Back
        </button>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-2xl font-semibold"> AGL Game Board</h1>
        </div>
        {/* {
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
        } */}
      </div>
    </div>
  )
}
