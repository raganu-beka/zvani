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
  private readonly http = inject(HttpClient);

  @ViewChild('terminalInput') private readonly terminalInput?: ElementRef<HTMLInputElement>;

  protected readonly step = signal<'command' | 'message' | 'sent'>('command');
  protected readonly currentInput = signal('');
  protected readonly isSending = signal(false);
  protected readonly consoleLog = signal<ConsoleLog[]>([
    { time: '22:28:38', kind: 'muted', text: 'HTTP REQUEST DETECTED ... probably yours' },
    { time: '22:28:41', kind: 'muted', text: 'SERVICE WAKING UP ... stretching semicolons' },
    { time: '22:28:45', kind: 'muted', text: 'TYPE send alert TO BEGIN' },
  ]);

  protected readonly promptLabel = computed(() => {
    if (this.isSending()) {
      return 'sending';
    }

    if (this.step() === 'message') {
      return 'message';
    }

    if (this.step() === 'sent') {
      return 'again';
    }

    return 'zvani';
  });

  protected readonly placeholder = computed(() => {
    if (this.isSending()) {
      return 'waiting for the alert pipe ...';
    }

    if (this.step() === 'message') {
      return 'The database is on fire, but emotionally.';
    }

    if (this.step() === 'sent') {
      return 'send alert';
    }

    return 'send alert';
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

    if (this.step() === 'command' || this.step() === 'sent') {
      this.handleCommand(value);
      return;
    }

    this.sendAlert(value);
  }

  protected fillCommand(): void {
    this.setInputValue('send alert');
    this.focusInput();
  }

  protected focusInput(): void {
    queueMicrotask(() => this.terminalInput?.nativeElement.focus());
  }

  private handleCommand(command: string): void {
    const normalized = command.toLowerCase();

    if (
      normalized === 'send alert' ||
      normalized === 'zvani alert send' ||
      normalized === 'alert send'
    ) {
      this.appendLog('noise', 'COMMAND ACCEPTED ... putting on serious keyboard face');
      this.appendLog('noise', 'PLEASE PROVIDE MESSAGE ... make it dramatic');
      this.step.set('message');
      this.focusInput();
      return;
    }

    this.appendLog('error', `UNKNOWN COMMAND: ${command}`);
    this.appendLog('noise', 'TRY send alert ... the terminal only learned one trick');
  }

  private sendAlert(message: string): void {
    this.isSending.set(true);
    this.appendLog('noise', 'PACKING ALERT INTO A VERY SMALL ENVELOPE ...');
    this.appendLog('noise', 'ASKING /api/alert/send IF IT IS READY FOR RESPONSIBILITY ...');

    this.http.post<SendAlertResponse>('/api/alert/send', { message }).subscribe({
      next: (response) => {
        this.appendLog('success', `${response.message} tiny siren deployed`);
        this.appendLog('muted', 'TYPE send alert TO BOTHER THE INTERNET AGAIN');
        this.step.set('sent');
        this.isSending.set(false);
        this.focusInput();
      },
      error: () => {
        this.appendLog('error', 'ALERT PIPE SAID NO. RUDE.');
        this.step.set('message');
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
      time: new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date()),
      kind,
      text,
    };

    this.consoleLog.update((items) => [...items, entry].slice(-12));
  }
}
