import { QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { RouterProvider } from 'react-router';
import { queryClient } from './lib/query-client';
import { router } from './router';
import { useUIStore } from './stores/ui-store';

export function App() {
  const mode = useUIStore((s) => s.theme);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={frFR}
        theme={{
          algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#4f46e5',
            colorInfo: '#4f46e5',
            colorLink: '#4f46e5',
            borderRadius: 10,
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
          components: {
            Layout: {
              headerBg: mode === 'dark' ? '#161629' : '#1e1b4b',
              siderBg: mode === 'dark' ? '#161629' : '#1e1b4b',
              triggerBg: mode === 'dark' ? '#161629' : '#1e1b4b',
              bodyBg: mode === 'dark' ? '#0d0d16' : '#f5f5fb',
              footerBg: 'transparent',
            },
            Menu: {
              darkItemBg: 'transparent',
            },
            Card: {
              borderRadiusLG: 14,
            },
          },
        }}
      >
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
