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
      appearance: {
        variables: {
          colorPrimary: '#ffa657',
          colorBackground: '#18181c',
          colorInputBackground: '#111111',
          colorInputText: '#f2f0ea',
          colorText: '#f2f0ea',
          colorTextSecondary: '#9a9892',
          borderRadius: '6px',
          fontFamily:
            'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        },
        elements: {
          rootBox: {
            width: '100%',
          },
          cardBox: {
            width: '100%',
            boxShadow: 'none',
          },
          card: {
            width: '100%',
            backgroundColor: '#18181c',
            border: '1px solid #35353a',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
          },
          headerTitle: {
            color: '#f2f0ea',
            fontSize: '1.25rem',
            fontWeight: '800',
            letterSpacing: '0',
          },
          headerSubtitle: {
            color: '#9a9892',
            fontWeight: '700',
          },
          socialButtonsBlockButton: {
            backgroundColor: '#202026',
            borderColor: '#383840',
            color: '#f2f0ea',
            fontWeight: '800',
          },
          dividerLine: {
            backgroundColor: '#383840',
          },
          dividerText: {
            color: '#9a9892',
            fontWeight: '800',
          },
          formFieldLabel: {
            color: '#f2f0ea',
            fontWeight: '800',
          },
          formFieldInput: {
            backgroundColor: '#111111',
            borderColor: '#3f3f45',
            color: '#f2f0ea',
            fontWeight: '700',
          },
          formButtonPrimary: {
            backgroundColor: '#ffa657',
            color: '#111111',
            fontWeight: '900',
          },
          footer: {
            backgroundColor: '#202026',
            borderTop: '1px solid #35353a',
          },
          footerActionText: {
            color: '#9a9892',
            fontWeight: '800',
          },
          footerActionLink: {
            color: '#ffa657',
            fontWeight: '900',
          },
        },
      },
    });
  }

  async mountUserButton(element: HTMLDivElement): Promise<void> {
    await this.load();
    element.replaceChildren();
    this.clerk?.mountUserButton(element, {
      userProfileMode: 'modal',
      appearance: {
        variables: {
          colorPrimary: '#ffa657',
          colorBackground: '#111111',
          colorText: '#f2f0ea',
          colorTextSecondary: '#858585',
          borderRadius: '4px',
        },
        elements: {
          userButtonAvatarBox: {
            width: '2.5rem',
            height: '2.5rem',
          },
          userButtonPopoverCard: {
            backgroundColor: '#111111',
            border: '1px solid #3d3d3d',
            boxShadow: '0 18px 48px rgba(0, 0, 0, 0.5)',
          },
        },
      },
    });
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
      this.formatDisplayName(
        clerk.user?.username ??
          clerk.user?.firstName ??
          clerk.user?.primaryEmailAddress?.emailAddress,
      ),
    );
  }

  private formatDisplayName(value?: string | null): string {
    const firstToken = value?.trim().split(/\s+/)[0]?.split('@')[0] ?? '';
    const normalized = firstToken.toLocaleLowerCase();

    return normalized || 'user';
  }
}
