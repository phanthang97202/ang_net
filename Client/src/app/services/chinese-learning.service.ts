import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

export type ChineseKind = 'sentence' | 'paragraph' | 'audio';
export interface ChineseWord { Word: string; Pinyin: string; Meaning: string; }
export interface ChineseExercise { Id: string; Kind: ChineseKind; Topic: string; Text: string; Pinyin: string; Translation: string; Words: ChineseWord[]; }
export type ChineseExerciseRequest = Pick<ChineseExercise, 'Kind' | 'Topic' | 'Text' | 'Pinyin' | 'Translation'>;
export interface ChineseVocabulary extends ChineseWord { Id: string; Collection: string; Example: string; ExamplePinyin: string; ExampleTranslation: string; }
export type ChineseVocabularyRequest = Omit<ChineseVocabulary, 'Id'>;

@Injectable({ providedIn: 'root' })
export class ChineseLearningService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}ChineseLearning`;
  exercises(kind: ChineseKind, topic: string) { return this.http.get<ChineseExercise[]>(`${this.url}/exercises`, { params: new HttpParams().set('kind', kind).set('topic', topic) }); }
  createExercise(exercise: ChineseExerciseRequest) { return this.http.post<{ Id: string }>(`${this.url}/exercises`, exercise); }
  generate(kind: ChineseKind, topic: string) { return this.http.post<{ Count: number }>(`${this.url}/generate`, { Kind: kind, Topic: topic }); }
  words() { return this.http.get<ChineseVocabulary[]>(`${this.url}/vocabulary`); }
  saveWord(word: ChineseVocabularyRequest) { return this.http.post(`${this.url}/vocabulary`, word); }
  deleteWord(id: string) { return this.http.delete(`${this.url}/vocabulary/${encodeURIComponent(id)}`); }
}
