import { Injectable, signal } from '@angular/core';
import type { Clerk as ClerkConstructor } from '@clerk/clerk-js';

declare global {
  interface Window {
    __internal_ClerkUICtor?: unknown;
  }
}

export type ClerkAuthStatus = 'loading' | 'signed-in' | 'signed-out' | 'missing-config' | 'error';

type ClerkInstance = InstanceType<typeof ClerkConstructor>;

type PublicAuthConfig = {
  clerkPublishableKey: string;
};

@Injectable({ providedIn: 'root' })
export class ClerkAuthService {
  readonly status = signal<ClerkAuthStatus>('loading');
  readonly displayName = signal('user');

  private clerk?: ClerkInstance;
  private loadPromise?: Promise<void>;

  load(): Promise<void> {
    this.loadPromise ??= this.loadClerk();
    return this.loadPromise;
  }

  async getToken(): Promise<string | null> {
    await this.load();
    return (await this.clerk?.session?.getToken()) ?? null;
  }

  async mountSignIn(element: HTMLDivElement): Promise<void> {
    await this.load();
    element.replaceChildren();
    this.clerk?.mountSignIn(element, {
      routing: 'hash',
    });
  }

  async mountUserButton(element: HTMLDivElement): Promise<void> {
    await this.load();
    element.replaceChildren();
    this.clerk?.mountUserButton(element);
  }

  private async loadClerk(): Promise<void> {
    const publishableKey = (await this.fetchPublishableKey()).trim();

    if (!publishableKey) {
      this.status.set('missing-config');
      return;
    }

    try {
      await this.loadUiBundle(publishableKey);

      const { Clerk } = await import('@clerk/clerk-js');
      const clerk = new Clerk(publishableKey);
      await clerk.load({
        ui: { ClerkUI: window.__internal_ClerkUICtor },
      } as never);

      this.clerk = clerk;
      this.syncState();
      clerk.addListener(() => this.syncState());
    } catch {
      this.status.set('error');
    }
  }

  private async fetchPublishableKey(): Promise<string> {
    const response = await fetch('/api/auth/config/public', {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load public app config.');
    }

    const config = (await response.json()) as PublicAuthConfig;
    return config.clerkPublishableKey ?? '';
  }

  private async loadUiBundle(publishableKey: string): Promise<void> {
    if (window.__internal_ClerkUICtor) {
      return;
    }

    const clerkDomain = atob(publishableKey.split('_')[2]).slice(0, -1);

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Clerk UI bundle.'));
      document.head.appendChild(script);
    });
  }

  private syncState(): void {
    const clerk = this.clerk;

    if (!clerk) {
      this.status.set('error');
      return;
    }

    this.status.set(clerk.isSignedIn ? 'signed-in' : 'signed-out');
    this.displayName.set(
      clerk.user?.username ??
        clerk.user?.firstName ??
        clerk.user?.primaryEmailAddress?.emailAddress ??
        'user',
    );
  }
}
