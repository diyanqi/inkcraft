'use client';

import { useEffect } from 'react';
import NProgress from 'nprogress';
import { usePathname } from 'next/navigation';
import 'nprogress/nprogress.css';

// 配置 NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.3
});

// 自定义进度条样式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    #nprogress .bar {
      height: 4px !important;
    }
  `;
  document.head.appendChild(style);
}

export function LoadingBar() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.start();
    // 短暂延迟后完成加载动画，以确保动画效果流畅
    const timer = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname]);

  return null;
}