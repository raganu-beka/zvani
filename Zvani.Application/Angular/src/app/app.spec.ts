import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { App } from './app';
import { ClerkAuthService, ClerkAuthStatus } from './auth/clerk-auth.service';

describe('App', () => {
  const clerkAuthMock = {
    status: signal<ClerkAuthStatus>('signed-in'),
    displayName: signal('user'),
    load: vi.fn().mockResolvedValue(undefined),
    mountSignIn: vi.fn().mockResolvedValue(undefined),
    mountUserButton: vi.fn().mockResolvedValue(undefined),
    getToken: vi.fn().mockResolvedValue('test-token'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), { provide: ClerkAuthService, useValue: clerkAuthMock }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the direct alert prompt', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('user@zvani');
    expect(compiled.textContent).not.toContain('22:28:38');
    expect(compiled.querySelector('#terminal-placeholder')?.textContent).toContain('alert message');
  });

  it('should keep the prompt identity fixed while sending', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance as unknown as {
      isSending: { set(value: boolean): void };
    };
    app.isSending.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('user@zvani');
    expect(compiled.textContent).not.toContain('sending@zvani');
    expect(compiled.querySelector('#terminal-placeholder')?.textContent).toContain(
      'sending alert message',
    );
    expect(compiled.querySelector('#terminal-placeholder')?.classList).not.toContain(
      'text-[#ff8274]',
    );
    expect(compiled.textContent).toContain('PRESS ENTER↵ TO SEND ALERT');
    expect(compiled.querySelector('.wrap-break-word')?.classList).not.toContain('text-[#ff8274]');
  });

  it('should only show the usage limit messages in red', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance as unknown as {
      isSending: { set(value: boolean): void };
      remainingUsage: {
        set(value: { limit: number; remaining: number; nextResetAtUtc: string | null }): void;
      };
    };

    app.isSending.set(true);
    app.remainingUsage.set({ limit: 1, remaining: 0, nextResetAtUtc: null });
    fixture.detectChanges();

    const placeholder = fixture.nativeElement.querySelector('#terminal-placeholder') as HTMLElement;
    expect(placeholder.textContent).toContain('alert limit reached');
    expect(placeholder.textContent).not.toContain('sending alert message');
    expect(placeholder.classList).toContain('text-[#ff8274]');

    const submitHint = fixture.nativeElement.querySelector('.wrap-break-word') as HTMLElement;
    expect(submitHint.textContent).toContain('ALERT LIMIT REACHED');
    expect(submitHint.classList).toContain('text-[#ff8274]');
  });

  it('should focus the terminal input after rendering', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    const input = fixture.nativeElement.querySelector('#terminal-input') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
  });
});
