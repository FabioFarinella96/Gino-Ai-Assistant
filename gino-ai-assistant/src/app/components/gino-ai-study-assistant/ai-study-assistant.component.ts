import * as pdfjsLib from 'pdfjs-dist/build/pdf';
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.min.js';
import { LucideAngularModule, Brain, Blend, NotebookPen, SquareTerminal } from 'lucide-angular';

import { Component, signal, ChangeDetectionStrategy, model, OnInit } from '@angular/core';
import { AiService } from '../../services/ai.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-ai-study-assistant',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: '../gino-ai-study-assistant/ai-study-assistant.component.html',
  styleUrls: ['../gino-ai-study-assistant/ai-study-assistant.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiStudyAssistantComponent implements OnInit {
  userText = model('');
  selectedMode = model<'explain-like-10' | 'summarize' | 'quiz'>('explain-like-10');
  aiResponse = signal<string>('');
  loading = signal<boolean>(false);
  pdfFile = signal<File | null>(null);
  alertMsg = signal<boolean>(false);

  // icons
  readonly brain = Brain;
  readonly blend = Blend;
  readonly notebookPen = NotebookPen;
  readonly squareTerminal = SquareTerminal;

  constructor(private aiService: AiService) {}

  ngOnInit(): void {
    console.log('environment in uso: ', environment);
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && file.type === 'application/pdf') {
      this.pdfFile.set(file);
      this.loading.set(true);

      try {
        const text = await this.extractTextFromPdf(file);
        this.userText.set(text);
      } catch (error) {
        console.error("Errore durante l'estrazione del PDF:", error);
        alert('Errore durante la lettura del PDF. Riprova.');
        this.pdfFile.set(null);
      } finally {
        this.loading.set(false);
      }
    } else {
      alert('Carica solo file PDF validi.');
      this.pdfFile.set(null);
    }
  }

  async extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((s: any) => s.str).join(' ') + '\n';
    }
    return text;
  }

  generatePrompt(): string {
    const text = this.userText();

    switch (this.selectedMode()) {
      case 'explain-like-10':
        return `Spiega in modo semplice:\n\n${text}`;
      case 'summarize':
        return `Riassumi i concetti chiave:\n\n${text}`;
      case 'quiz':
        return `Crea alcune domande di ripasso basate su questo testo:\n\n${text}`;
      default:
        return text;
    }
  }

  sendToAI() {
    if (!this.userText().trim()) {
      this.alertMsg.set(true);
      return;
    }

    this.loading.set(true);
    this.aiResponse.set('');
    this.alertMsg.set(false);
    const prompt = this.generatePrompt();

    this.aiService.sendMessage(prompt).subscribe({
      next: (res: any) => {
        const responseText =
          res.candidates?.[0]?.content?.parts?.[0]?.text || 'Nessuna risposta generata.';

        this.aiResponse.set(responseText);
        this.loading.set(false);
        this.userText.set('');
      },
      error: (err) => {
        console.error('Errore API:', err);
        this.aiResponse.set('Errore nella chiamata API. Riprova.');
        this.loading.set(false);
        this.userText.set('');
      },
    });
  }
}
