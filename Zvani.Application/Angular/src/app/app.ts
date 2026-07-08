import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { ClerkAuthService } from './auth/clerk-auth.service';

type ConsoleLog = {
  time: string;
  kind: 'muted' | 'input' | 'noise' | 'success' | 'error';
  text: string;
};

type SendAlertResponse = {
  accepted: boolean;
  emailSucceeded: boolean;
  smsSucceeded: boolean;
  remainingUsage: RemainingUsage;
};

type RemainingUsage = {
  limit: number;
  remaining: number;
  nextResetAtUtc: string | null;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  protected readonly hasSent = signal(false);
  protected readonly currentInput = signal('');
  protected readonly cursorOffset = signal(0);
  protected readonly hasSelection = signal(false);
  protected readonly isSending = signal(false);
  protected readonly consoleLog = signal<ConsoleLog[]>([]);
  protected readonly placeholder = computed(() => {
    if (this.isSending()) {
      return 'sending alert message...';
    }

    if (this.hasSent()) {
      return 'send another alert message...';
    }

    return 'type alert message...';
  });
  protected readonly showPlaceholder = computed(() => {
    return !this.currentInput();
  });
  protected readonly asciiArt = String.raw`
 _______  __   __  _______  __    _  ___
|       ||  | |  ||   _   ||  |  | ||   |
|____   ||  |_|  ||  |_|  ||   |_| ||   |
 ____|  ||       ||       ||       ||   |
| ______||       ||       ||  _    ||   |
| |_____  |     | |   _   || | |   ||   |
|_______|  |___|  |__| |__||_|  |__||___|
`;
  private readonly clerkAuth = inject(ClerkAuthService);
  protected readonly authStatus = this.clerkAuth.status;
  protected readonly promptLabel = computed(() => this.clerkAuth.displayName());
  private readonly maxConsoleEntries = 12;
  private readonly minLogDelayMs = 260;
  private readonly maxLogDelayMs = 980;
  private readonly pendingTimers = new Set<number>();
  private hasInitializedTerminal = false;
  private logQueue = Promise.resolve();
  private readonly http = inject(HttpClient);
  @ViewChild('terminalInput') private readonly terminalInput?: ElementRef<HTMLInputElement>;
  @ViewChild('signInMount') private readonly signInMount?: ElementRef<HTMLDivElement>;
  @ViewChild('userButtonMount') private readonly userButtonMount?: ElementRef<HTMLDivElement>;
  private readonly bootMessages = [
    'HTTP REQUEST DETECTED ... wearing a tiny helmet',
    'BROWSER HAS ENTERED THE CHAT ... suspiciously confident',
    'TERMINAL BOOTING ... one pixel found the coffee',
    'CONSOLE OPENED ... no promises were emotionally harmed',
  ] as const;
  private readonly warmupMessages = [
    'SERVICE WAKING UP ... stretching semicolons',
    'LOADING VIBES ... PLEASE HOLD THE DRAMA',
    'ALIGNING ANTENNAS ... THEY REFUSE TO ALIGN BACK',
    'CHECKING WIRES ... MOSTLY FOR PERSONAL GROWTH',
  ] as const;
  private readonly promptMessages = [
    'TYPE MESSAGE AND PRESS ENTER TO SEND',
    'AWAITING WORDS ... PREFERABLY ON PURPOSE',
    'READY FOR ALERT TEXT ... MAKE IT BRIEF, MAKE IT LOUD',
    'INPUT PORT OPEN ... FEED IT A SENTENCE',
  ] as const;
  private readonly sendingMessages = [
    'PACKING ALERT INTO A VERY SMALL ENVELOPE ...',
    'ASKING /api/alert/send IF IT IS READY FOR RESPONSIBILITY ...',
    'NEGOTIATING WITH THE OUTBOX ... IT HAS DEMANDS',
    'POLISHING PAYLOAD ... NOW 14% MORE OFFICIAL',
    'TELLING THE NETWORK TO ACT NATURAL ...',
    'CONVERTING PANIC INTO STRUCTURED JSON ...',
  ] as const;
  private readonly emailSuccessMessages = [
    'EMAIL SENT ... THE INBOX HAS BEEN NOTIFIED WITH STYLE',
    'EMAIL DELIVERED ... TINY CELEBRATION IN PORT 443',
    'EMAIL SUCCESS ... THE SUBJECT LINE DID ITS JOB',
    'EMAIL MADE IT ... PLEASE PRETEND THIS WAS EASY',
  ] as const;
  private readonly emailFailureMessages = [
    'EMAIL FAILED ... THE INBOX LOOKED AWAY AT THE WRONG TIME',
    'EMAIL DID NOT SEND ... OUTBOX IS DOING PERFORMANCE ART',
    'EMAIL FAILURE ... SMTP SHRUGGED IN A TECHNICAL WAY',
    'EMAIL STALLED ... THE ENVELOPE GOT STAGE FRIGHT',
  ] as const;
  private readonly smsSuccessMessages = [
    'SMS SENT ... POCKET BUZZ PROBABLY INCOMING',
    'SMS DELIVERED ... THE TINY TEXT TRAIN LEFT THE STATION',
    'SMS SUCCESS ... THUMBS MAY NOW BE ALERTED',
    'SMS MADE IT ... SOMEWHERE A PHONE FEELS IMPORTANT',
  ] as const;
  private readonly smsFailureMessages = [
    'SMS FAILED ... THE PHONE VIBRATION UNION DECLINED',
    'SMS DID NOT SEND ... CARRIER SAID MAYBE LATER',
    'SMS FAILURE ... TEXT MESSAGE TRIPPED OVER A CLOUD',
    'SMS STALLED ... THE POCKET BUZZ HAS BEEN POSTPONED',
  ] as const;
  private readonly readyMessages = [
    'TYPE ANOTHER MESSAGE TO BOTHER THE INTERNET AGAIN',
    'READY AGAIN ... THE INTERNET HAS BEEN WARNED',
    'ANOTHER ALERT MAY NOW APPROACH THE BENCH',
    'QUEUE IS CLEAR ... TRY NOT TO GIVE IT A PERSONALITY',
  ] as const;
  private readonly alertFailureMessages = [
    'ALERT PIPE SAID NO. RUDE.',
    'REQUEST FAILED ... THE SERVER CHOSE MYSTERY',
    'ALERT DID NOT LAUNCH ... CONTROL TOWER IS SQUINTING',
    'NETWORK SAID ABSOLUTELY NOT ... VERY DRAMATIC',
  ] as const;
  private readonly usageLimitMessages = [
    'ALERT LIMIT REACHED ... THE WINDOW IS STILL ROLLING',
    'REQUEST BLOCKED ... DAILY CHAOS BUDGET IS EMPTY',
    'ALERT DENIED ... THREE REQUESTS ARE ALREADY ON THE BOARD',
    'RATE LIMIT SAYS WAIT ... IT BROUGHT RECEIPTS',
  ] as const;

  constructor() {
    effect(() => {
      const status = this.authStatus();

      queueMicrotask(() => {
        if (status === 'signed-in') {
          const userButtonMount = this.userButtonMount?.nativeElement;
          if (userButtonMount) {
            void this.clerkAuth.mountUserButton(userButtonMount);
          }

          void this.initializeTerminal();
          return;
        }

        if (status === 'signed-out') {
          const signInMount = this.signInMount?.nativeElement;
          if (signInMount) {
            void this.clerkAuth.mountSignIn(signInMount);
          }
        }
      });
    });
  }

  ngAfterViewInit(): void {
    void this.clerkAuth.load();
  }

  ngOnDestroy(): void {
    for (const timerId of this.pendingTimers) {
      window.clearTimeout(timerId);
    }

    this.pendingTimers.clear();
  }

  protected updateInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.currentInput.set(input.value);
    this.syncCursor(input);
  }

  protected syncCursorFromEvent(event: Event): void {
    const input = event.target as HTMLInputElement;

    queueMicrotask(() => this.syncCursor(input));
  }

  protected submitInput(): void {
    this.submitValue(this.terminalInput?.nativeElement.value ?? this.currentInput());
  }

  protected submitValue(rawValue: string): void {
    const value = rawValue.trim();

    if (!value || this.isSending() || this.authStatus() !== 'signed-in') {
      return;
    }

    this.setInputValue('');
    this.focusInput();
    void this.sendAlert(value);
  }

  protected focusInput(): void {
    if (this.authStatus() !== 'signed-in') {
      return;
    }

    queueMicrotask(() => {
      this.terminalInput?.nativeElement.focus();
      this.syncCursor();
    });
  }

  private async sendAlert(message: string): Promise<void> {
    this.isSending.set(true);
    await this.appendDelayedLogs([{ kind: 'input', text: `$ ${message}` }]);
    const noiseSequence = this.appendDelayedLogs(this.createSendingConsoleLog());

    this.http.post<SendAlertResponse>('/api/alert/send', { message }).subscribe({
      next: async (response) => {
        await noiseSequence;
        await this.appendDelayedLogs(this.createChannelResultConsoleLog(response));
        this.logRemainingUsage(response.remainingUsage);
        await this.appendDelayedLogs(this.createRemainingUsageConsoleLog(response.remainingUsage));
        await this.appendDelayedLogs([
          { kind: 'muted', text: this.randomMessage(this.readyMessages) },
        ]);
        this.hasSent.set(true);
        this.isSending.set(false);
        this.focusInput();
      },
      error: async (error: HttpErrorResponse) => {
        await noiseSequence;

        const response = this.getAlertErrorResponse(error);
        if (error.status === 429 && response?.remainingUsage) {
          this.logRemainingUsage(response.remainingUsage);
          await this.appendDelayedLogs([
            {
              kind: 'error',
              text: this.randomMessage(this.usageLimitMessages),
            },
            ...this.createRemainingUsageConsoleLog(response.remainingUsage),
          ]);
          this.isSending.set(false);
          this.focusInput();
          return;
        }

        await this.appendDelayedLogs([
          {
            kind: 'error',
            text: this.randomMessage(this.alertFailureMessages),
          },
        ]);
        this.isSending.set(false);
        this.focusInput();
      },
    });
  }

  private async initializeTerminal(): Promise<void> {
    if (this.hasInitializedTerminal) {
      this.focusInput();
      return;
    }

    this.hasInitializedTerminal = true;
    this.focusInput();
    await this.appendDelayedLogs(this.createInitialConsoleLog());
  }

  private setInputValue(value: string): void {
    this.currentInput.set(value);

    if (this.terminalInput) {
      this.terminalInput.nativeElement.value = value;
      this.syncCursor(this.terminalInput.nativeElement);
    }
  }

  private syncCursor(input = this.terminalInput?.nativeElement): void {
    if (!input) {
      return;
    }

    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const textBeforeCursor = input.value.slice(0, selectionStart);
    const textWidth = this.measureInputText(input, textBeforeCursor);
    const offset = Math.max(0, Math.min(textWidth - input.scrollLeft, input.clientWidth));

    this.cursorOffset.set(offset);
    this.hasSelection.set(selectionStart !== selectionEnd);
  }

  private measureInputText(input: HTMLInputElement, text: string): number {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return text.length * 10;
    }

    context.font = getComputedStyle(input).font;
    return context.measureText(text).width;
  }

  private appendLog(kind: ConsoleLog['kind'], text: string): void {
    const entry = {
      time: this.formatTime(new Date()),
      kind,
      text,
    };

    this.consoleLog.update((items) => [...items, entry].slice(-this.maxConsoleEntries));
  }

  private async appendDelayedLogs(
    entries: Array<Pick<ConsoleLog, 'kind' | 'text'>>,
  ): Promise<void> {
    const appendEntries = async () => {
      for (const entry of entries) {
        await this.wait(this.randomLogDelay());
        this.appendLog(entry.kind, entry.text);
      }
    };

    this.logQueue = this.logQueue.then(appendEntries, appendEntries);

    return this.logQueue;
  }

  private randomLogDelay(): number {
    const range = this.maxLogDelayMs - this.minLogDelayMs;

    return this.minLogDelayMs + Math.round(Math.random() * range);
  }

  private wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      const timerId = window.setTimeout(() => {
        this.pendingTimers.delete(timerId);
        resolve();
      }, milliseconds);

      this.pendingTimers.add(timerId);
    });
  }

  private createInitialConsoleLog(): Array<Pick<ConsoleLog, 'kind' | 'text'>> {
    return [
      {
        kind: 'muted',
        text: this.randomMessage(this.bootMessages),
      },
      {
        kind: 'muted',
        text: this.randomMessage(this.warmupMessages),
      },
      {
        kind: 'muted',
        text: this.randomMessage(this.promptMessages),
      },
    ];
  }

  private createSendingConsoleLog(): Array<Pick<ConsoleLog, 'kind' | 'text'>> {
    return this.randomMessages(this.sendingMessages, 2).map((text) => ({
      kind: 'noise',
      text,
    }));
  }

  private createChannelResultConsoleLog(
    response: SendAlertResponse,
  ): Array<Pick<ConsoleLog, 'kind' | 'text'>> {
    return [
      {
        kind: response.emailSucceeded ? 'success' : 'error',
        text: this.randomMessage(
          response.emailSucceeded ? this.emailSuccessMessages : this.emailFailureMessages,
        ),
      },
      {
        kind: response.smsSucceeded ? 'success' : 'error',
        text: this.randomMessage(
          response.smsSucceeded ? this.smsSuccessMessages : this.smsFailureMessages,
        ),
      },
    ];
  }

  private createRemainingUsageConsoleLog(
    remainingUsage: RemainingUsage,
  ): Array<Pick<ConsoleLog, 'kind' | 'text'>> {
    return [
      {
        kind: 'muted',
        text: `ALERTS REMAINING: ${remainingUsage.remaining}/${remainingUsage.limit}`,
      },
      {
        kind: 'muted',
        text: `NEXT RESET: ${this.formatResetAt(remainingUsage.nextResetAtUtc)}`,
      },
    ];
  }

  private logRemainingUsage(remainingUsage: RemainingUsage): void {
    console.info('Alert remaining usage', {
      remaining: remainingUsage.remaining,
      limit: remainingUsage.limit,
      nextResetAt: remainingUsage.nextResetAtUtc,
    });
  }

  private getAlertErrorResponse(error: HttpErrorResponse): SendAlertResponse | null {
    if (!error.error || typeof error.error !== 'object') {
      return null;
    }

    return error.error as SendAlertResponse;
  }

  private randomMessage(messages: readonly string[]): string {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private randomMessages(messages: readonly string[], count: number): string[] {
    return [...messages].sort(() => Math.random() - 0.5).slice(0, count);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }

  private formatResetAt(value: string | null): string {
    if (!value) {
      return 'NO ACTIVE WINDOW';
    }

    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      hour12: false,
    }).format(new Date(value));
  }
}
