import { Component, signal } from '@angular/core';
import { AiStudyAssistantComponent } from './components/gino-ai-study-assistant/ai-study-assistant.component';

@Component({
  selector: 'app-root',
  imports: [AiStudyAssistantComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('gino-ai-assistant');
}
