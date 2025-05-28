'use client';

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from 'react';
import { usePathname } from 'next/navigation';

interface SegmentMap {
  [key: string]: string;
}

const segmentMap: SegmentMap = {
  "dashboard": "仪表盘",
  "create": "创建",
  "users": "用户",
  "settings": "设置",
  "profile": "个人资料",
  "correction": "批改",
  "wait": "等待",
  "favorites": "收藏夹",
  "material-square": "素材广场",
  "login": "登录",
  "register": "注册",
  "verify-request": "验证请求",
};

interface DynamicBreadcrumbsProps {
  segmentMap: SegmentMap;
}

const DynamicBreadcrumbs: React.FC<DynamicBreadcrumbsProps> = ({ segmentMap }) => {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(segment => segment);

  const breadcrumbItems = [];

  const isHomeLast = segments.length === 0;
  breadcrumbItems.push({ name: '首页', href: '/', isLast: isHomeLast });

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += '/' + segment;

    const isLast = index === segments.length - 1;

    const displayName = segmentMap[segment] || segment;

    if (segment) {
       breadcrumbItems.push({ name: displayName, href: currentPath, isLast });
    }
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href || item.name || index}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem className="inline-flex items-center">
              {item.isLast ? (
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.name}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <DynamicBreadcrumbs segmentMap={segmentMap} />
      </div>
    </header>
  );
}
