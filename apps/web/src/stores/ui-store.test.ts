import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from './ui-store';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ theme: 'light', collapsed: false });
  });

  it('toggles the theme', () => {
    expect(useUIStore.getState().theme).toBe('light');
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('dark');
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('sets the collapsed flag', () => {
    useUIStore.getState().setCollapsed(true);
    expect(useUIStore.getState().collapsed).toBe(true);
  });
});
