import { createApp, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/app/App.vue';
import router from '../../src/app/router';

describe('Vue frontend shell', () => {
  let container: HTMLDivElement;
  let app: ReturnType<typeof createApp> | undefined;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.append(container);
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
    await router.push('/');
  });

  afterEach(async () => {
    app?.unmount();
    app = undefined;
    await router.push('/');
    container.remove();
    document.documentElement.classList.remove('dark');
  });

  async function mountAt(path: string): Promise<void> {
    await router.push(path);
    await router.isReady();
    app = createApp(App).use(router);
    app.mount(container);
    await nextTick();
  }

  it('renders home and navigates to LoginPage without a document reload', async () => {
    await mountAt('/');

    const documentElement = document.documentElement;
    const homeElement = container.firstElementChild;
    expect(container.querySelector('h1')?.textContent).toContain('Pendampingan Riset');

    await router.push('/login');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await nextTick();

    expect(router.currentRoute.value.path).toBe('/login');
    expect(container.querySelector('h1')?.textContent).toContain('Welcome back');
    expect(container.firstElementChild).not.toBe(homeElement);
    expect(document.documentElement).toBe(documentElement);
  });

  it('resolves the direct login route to the auth Feature page', async () => {
    await mountAt('/login');

    expect(container.querySelector('h1')?.textContent).toContain('Welcome back');
    expect(container.querySelector('form')).not.toBeNull();
  });

  it('renders the Vue 404 surface for unknown browser routes', async () => {
    await mountAt('/this-route-does-not-exist');

    expect(container.querySelector('[data-testid="not-found-page"]')).not.toBeNull();
    expect(container.querySelector('h1')?.textContent).toContain('Page not found');
  });
});
