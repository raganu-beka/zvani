import { HttpClient } from '@angular/common/http';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';

type ConsoleLog = {
  time: string;
  kind: 'muted' | 'input' | 'noise' | 'success' | 'error';
  text: string;
};

type SendAlertResponse = {
  message: string;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly hasSent = signal(false);
  protected readonly currentInput = signal('');
  protected readonly isSending = signal(false);
  protected readonly consoleLog = signal<ConsoleLog[]>(this.createInitialConsoleLog());
  protected readonly promptLabel = computed(() => {
    if (this.isSending()) {
      return 'sending';
    }

    if (this.hasSent()) {
      return 'again';
    }

    return 'alert';
  });
  protected readonly placeholder = computed(() => {
    if (this.isSending()) {
      return 'waiting for the alert pipe ...';
    }

    if (this.hasSent()) {
      return 'send another alert message ...';
    }

    return 'type alert message...';
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
  private readonly http = inject(HttpClient);
  @ViewChild('terminalInput') private readonly terminalInput?: ElementRef<HTMLInputElement>;

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
    this.sendAlert(value);
  }

  protected focusInput(): void {
    queueMicrotask(() => this.terminalInput?.nativeElement.focus());
  }

  private sendAlert(message: string): void {
    this.isSending.set(true);
    this.appendLog('noise', 'PACKING ALERT INTO A VERY SMALL ENVELOPE ...');
    this.appendLog('noise', 'ASKING /api/alert/send IF IT IS READY FOR RESPONSIBILITY ...');

    this.http.post<SendAlertResponse>('/api/alert/send', { message }).subscribe({
      next: (response) => {
        this.appendLog('success', `${response.message} TINY SIREN DEPLOYED`);
        this.appendLog('muted', 'TYPE ANOTHER MESSAGE TO BOTHER THE INTERNET AGAIN');
        this.hasSent.set(true);
        this.isSending.set(false);
        this.focusInput();
      },
      error: () => {
        this.appendLog('error', 'ALERT PIPE SAID NO. RUDE.');
        this.isSending.set(false);
        this.focusInput();
      },
    });
  }

  private setInputValue(value: string): void {
    this.currentInput.set(value);

    if (this.terminalInput) {
      this.terminalInput.nativeElement.value = value;
    }
  }

  private appendLog(kind: ConsoleLog['kind'], text: string): void {
    const entry = {
      time: this.formatTime(new Date()),
      kind,
      text,
    };

    this.consoleLog.update((items) => [...items, entry].slice(-12));
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
