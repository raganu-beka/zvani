import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the direct alert prompt', async () => {
    const fixture = TestBed.createComponent(App);
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
    expect(compiled.querySelector('#terminal-placeholder')?.textContent).toContain('tiny siren');
  });

  it('should focus the terminal input after rendering', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    const input = fixture.nativeElement.querySelector('#terminal-input') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
  });
});
