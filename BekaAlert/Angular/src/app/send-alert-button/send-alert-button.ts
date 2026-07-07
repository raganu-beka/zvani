import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

type SendAlertResponse = {
  message: string;
};

@Component({
  selector: 'app-send-alert-button',
  templateUrl: './send-alert-button.html',
  styleUrl: './send-alert-button.scss',
})
export class SendAlertButton {
  protected readonly isSending = signal(false);
  protected readonly resultMessage = signal('');
  protected readonly errorMessage = signal('');
  private readonly http = inject(HttpClient);

  protected sendAlert(): void {
    if (this.isSending()) {
      return;
    }

    this.isSending.set(true);
    this.resultMessage.set('');
    this.errorMessage.set('');

    this.http
      .post<SendAlertResponse>('/api/alert/send', { message: 'Alert requested from Angular.' })
      .subscribe({
        next: (response) => {
          this.resultMessage.set(response.message);
          this.isSending.set(false);
        },
        error: () => {
          this.errorMessage.set('Could not send alert.');
          this.isSending.set(false);
        },
      });
  }
}
