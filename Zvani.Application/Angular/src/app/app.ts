import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';

type ConsoleLog = {
  time: string;
  kind: 'muted' | 'input' | 'noise' | 'success' | 'error';
  text: string;
};

type SendAlertResponse = {
  emailSucceeded: boolean;
  smsSucceeded: boolean;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit {
  protected readonly hasSent = signal(false);
  protected readonly currentInput = signal('');
  protected readonly cursorOffset = signal(0);
  protected readonly hasSelection = signal(false);
  protected readonly isSending = signal(false);
  protected readonly consoleLog = signal<ConsoleLog[]>(this.createInitialConsoleLog());
  protected readonly promptLabel = 'user';
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
  private readonly maxConsoleEntries = 12;
  private readonly minLogDelayMs = 107;
  private readonly maxLogDelayMs = 308;
  private readonly http = inject(HttpClient);
  @ViewChild('terminalInput') private readonly terminalInput?: ElementRef<HTMLInputElement>;

  ngAfterViewInit(): void {
    this.focusInput();
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

    if (!value || this.isSending()) {
      return;
    }

    this.appendLog('input', `$ ${value}`);
    this.setInputValue('');
    this.focusInput();
    this.sendAlert(value);
  }

  protected focusInput(): void {
    queueMicrotask(() => {
      this.terminalInput?.nativeElement.focus();
      this.syncCursor();
    });
  }

  private sendAlert(message: string): void {
    this.isSending.set(true);
    const noiseSequence = this.appendDelayedLogs([
      {
        kind: 'noise',
        text: 'PACKING ALERT INTO A VERY SMALL ENVELOPE ...',
      },
      {
        kind: 'noise',
        text: 'ASKING /api/alert/send IF IT IS READY FOR RESPONSIBILITY ...',
      },
    ]);

    this.http.post<SendAlertResponse>('/api/alert/send', { message }).subscribe({
      next: async (response) => {
        await noiseSequence;
        await this.appendDelayedLogs([
          {
            kind: 'success',
            text: `EMAIL ${this.formatChannelStatus(response.emailSucceeded)} / SMS ${this.formatChannelStatus(response.smsSucceeded)}`,
          },
          {
            kind: 'muted',
            text: 'TYPE ANOTHER MESSAGE TO BOTHER THE INTERNET AGAIN',
          },
        ]);
        this.hasSent.set(true);
        this.isSending.set(false);
        this.focusInput();
      },
      error: async () => {
        await noiseSequence;
        await this.appendDelayedLogs([
          {
            kind: 'error',
            text: 'ALERT PIPE SAID NO. RUDE.',
          },
        ]);
        this.isSending.set(false);
        this.focusInput();
      },
    });
  }

  private formatChannelStatus(succeeded: boolean): string {
    return succeeded ? 'SENT' : 'FAILED';
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
    for (const entry of entries) {
      await this.wait(this.randomLogDelay());
      this.appendLog(entry.kind, entry.text);
    }
  }

  private randomLogDelay(): number {
    const range = this.maxLogDelayMs - this.minLogDelayMs;

    return this.minLogDelayMs + Math.round(Math.random() * range);
  }

  private wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, milliseconds);
    });
  }

  private createInitialConsoleLog(): ConsoleLog[] {
    const now = new Date();

    return [
      {
        time: this.formatTime(this.addSeconds(now, -7)),
        kind: 'muted',
        text: 'HTTP REQUEST DETECTED ... probably yours',
      },
      {
        time: this.formatTime(this.addSeconds(now, -4)),
        kind: 'muted',
        text: 'SERVICE WAKING UP ... stretching semicolons',
      },
      {
        time: this.formatTime(now),
        kind: 'muted',
        text: 'TYPE MESSAGE AND PRESS ENTER TO SEND',
      },
    ];
  }

  private addSeconds(date: Date, seconds: number): Date {
    return new Date(date.getTime() + seconds * 1000);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }
}
