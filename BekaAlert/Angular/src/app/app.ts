import { Component } from '@angular/core';
import { SendAlertButton } from './send-alert-button/send-alert-button';

@Component({
  selector: 'app-root',
  imports: [SendAlertButton],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
