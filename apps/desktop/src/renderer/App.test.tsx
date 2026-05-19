import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./components/ui/sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar" />,
}));

vi.mock('./pages/Writing', () => ({
  default: () => <section data-route="writing" />,
}));

vi.mock('./pages/Knowledge', () => ({
  default: () => <section data-route="knowledge" />,
}));

vi.mock('./pages/KnowledgeDetail', () => ({
  default: () => <section data-route="knowledge-detail" />,
}));

vi.mock('./pages/History', () => ({
  default: () => <section data-route="history" />,
}));

vi.mock('./pages/Settings', () => ({
  default: () => <section data-route="settings" />,
}));

describe('App routing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the root route when the packaged renderer is loaded from a file URL', () => {
    stubWindowLocation(
      'file:///C:/Users/test/AppData/Local/Programs/Jizhi/resources/app.asar/out/renderer/index.html',
    );

    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('data-route="writing"');
  });
});

function stubWindowLocation(url: string) {
  const parsed = new URL(url);
  const win = {
    location: {
      hash: parsed.hash,
      href: parsed.href,
      origin: parsed.origin,
      pathname: parsed.pathname,
      search: parsed.search,
    },
    history: {
      state: { idx: 0 },
      go: vi.fn(),
      pushState: vi.fn(),
      replaceState: vi.fn(),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  vi.stubGlobal('window', win);
  vi.stubGlobal('document', {
    defaultView: win,
    querySelector: vi.fn(() => null),
  });
}
