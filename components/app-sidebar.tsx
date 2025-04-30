"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import {
  IconCamera,
  IconQuote,
  IconHome,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconHelp,
  IconInnerShadowTop,
  IconPencilBolt,
  IconMessage2Star,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconAlignBoxLeftTop,
} from "@tabler/icons-react"

import { NavHistory } from "@/components/nav-history"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "首页",
      url: "/dashboard",
      icon: IconHome,
    },
    {
      title: "素材广场",
      url: "/dashboard/material-square",
      icon: IconQuote,
    },
    {
      title: "星选集",
      url: "/dashboard/favorites",
      icon: IconMessage2Star,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  history: [
    {
      name: "A rescue in a bottle",
      url: "#",
      icon: IconAlignBoxLeftTop,
    },
    {
      name: "Bikers",
      url: "#",
      icon: IconAlignBoxLeftTop,
    },
    {
      name: "Non-feathered angles",
      url: "#",
      icon: IconAlignBoxLeftTop,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  
  const userData = {
    name: session?.user?.name || session?.user?.email || "游客",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "/avatars/default.jpg",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconPencilBolt className="!size-5" />
                <span className="text-base font-semibold">墨灵</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavHistory items={data.history} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
