import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { GeminiResponse } from '../models/gemini-models';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  sendMessage(prompt: string): Observable<GeminiResponse> {
    return this.http.post<GeminiResponse>(
      `${this.apiUrl}/gemini/generate`,
      { prompt },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
