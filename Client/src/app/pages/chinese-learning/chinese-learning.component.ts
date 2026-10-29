import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subscription } from 'rxjs';
import { ChineseExercise, ChineseKind, ChineseLearningService, ChineseVocabulary, ChineseVocabularyRequest, ChineseWord } from '../../services/chinese-learning.service';

@Component({ selector: 'app-chinese-learning', standalone: true, imports: [CommonModule, FormsModule, NzIconModule], templateUrl: './chinese-learning.component.html', styleUrl: './chinese-learning.component.scss' })
export class ChineseLearningComponent implements OnInit, OnDestroy {
  @ViewChild('wordDialog') wordDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('exerciseText') exerciseText?: ElementRef<HTMLElement>;
  private readonly api = inject(ChineseLearningService);
  private readonly destroy = inject(DestroyRef);
  private listRequest?: Subscription;
  readonly kinds: { id: ChineseKind; label: string; icon: string }[] = [
    { id: 'sentence', label: 'Dịch câu', icon: 'edit' }, { id: 'paragraph', label: 'Dịch đoạn', icon: 'read' }, { id: 'audio', label: 'Nghe và viết', icon: 'sound' },
  ];
  readonly topics = [{ id: 'daily', label: 'Hằng ngày' }, { id: 'greetings', label: 'Chào hỏi' }, { id: 'hotel', label: 'Khách sạn' }, { id: 'food', label: 'Ăn uống' }];
  tab: 'practice' | 'vocabulary' = 'practice';
  kind: ChineseKind = 'sentence'; topic = 'daily'; items: ChineseExercise[] = []; current?: ChineseExercise;
  vocabulary: ChineseVocabulary[] = []; collectionFilter = ''; answer = ''; revealed = false; selectedWord = '';
  loading = false; generating = false; saving = false; error = ''; wordError = ''; audioError = '';
  draft: ChineseVocabularyRequest = { Word: '', Pinyin: '', Meaning: '', Collection: '', Example: '', ExamplePinyin: '', ExampleTranslation: '' };
  ngOnInit(): void { this.loadExercises(); this.loadWords(); }
  ngOnDestroy(): void { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
  get collections(): string[] { return [...new Set(this.vocabulary.map(x => x.Collection))].sort((a, b) => a.localeCompare(b, 'vi')); }
  get filteredWords(): ChineseVocabulary[] { return this.collectionFilter ? this.vocabulary.filter(x => x.Collection === this.collectionFilter) : this.vocabulary; }
  chooseKind(kind: ChineseKind): void { if (this.kind !== kind && !this.generating) { this.kind = kind; this.loadExercises(); } }
  changeTopic(): void { if (!this.generating) this.loadExercises(); }
  loadExercises(preferredId?: string): void {
    this.listRequest?.unsubscribe(); this.loading = true; this.error = ''; this.current = undefined; this.items = []; this.resetAnswer();
    this.listRequest = this.api.exercises(this.kind, this.topic).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: items => { this.loading = false; this.items = items; if (preferredId) this.current = items.find(x => x.Id === preferredId); if (!this.current && items.length) this.next(); },
      error: () => { this.loading = false; this.error = 'Không thể tải bài luyện. Vui lòng thử lại.'; },
    });
  }
  generate(): void {
    if (this.generating) return; this.generating = true; this.error = '';
    this.api.generate(this.kind, this.topic).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.generating = false; this.loadExercises(); },
      error: (e: HttpErrorResponse) => { this.generating = false; this.error = e.status === 429 ? 'Đang vượt giới hạn tạo bài. Bạn hãy thử lại sau hoặc dùng các bài đã lưu.' : e.error?.Code === 'GroqNotConfigured' ? 'Chức năng tạo bài chưa được cấu hình.' : 'Không thể tạo bài lúc này. Hãy thử lại hoặc dùng các bài đã lưu.'; },
    });
  }
  next(): void {
    if (!this.items.length) return;
    const choices = this.items.length > 1 ? this.items.filter(x => x.Id !== this.current?.Id) : this.items;
    this.current = choices[Math.floor(Math.random() * choices.length)]; this.resetAnswer();
  }
  private resetAnswer(): void { this.answer = ''; this.revealed = false; this.selectedWord = ''; this.audioError = ''; if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
  speak(text: string): void {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) { this.audioError = 'Trình duyệt không hỗ trợ phát âm.'; return; }
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(x => /^zh[-_]CN$/i.test(x.lang)) || voices.find(x => /^(zh[-_](SG|TW)|cmn(?:[-_].*)?|zh)$/i.test(x.lang));
    if (!voice) { this.audioError = 'Thiết bị chưa có giọng đọc tiếng Trung. Hãy cài giọng đọc tiếng Trung trong thiết bị hoặc trình duyệt.'; return; }
    this.audioError = ''; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = voice.lang; utterance.voice = voice; utterance.rate = .8;
    utterance.onerror = () => { this.audioError = 'Không thể phát âm trên thiết bị này.'; }; window.speechSynthesis.speak(utterance);
  }
  captureSelection(): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !this.exerciseText?.nativeElement.contains(selection.anchorNode) || !this.exerciseText.nativeElement.contains(selection.focusNode)) { this.selectedWord = ''; return; }
    const text = selection.toString().trim(); this.selectedWord = text.length <= 60 ? text : '';
  }
  openWord(word?: ChineseWord): void {
    if (!this.current) return;
    const text = word?.Word || this.selectedWord;
    if (!text || !this.current.Text.includes(text)) return;
    const match = word || this.current.Words.find(x => x.Word === text);
    this.wordError = ''; this.draft = { Word: text, Pinyin: match?.Pinyin || '', Meaning: match?.Meaning || '', Collection: this.collections[0] || 'Từ của tôi', Example: this.current.Text, ExamplePinyin: this.current.Pinyin, ExampleTranslation: this.current.Translation };
    this.wordDialog?.nativeElement.showModal();
  }
  saveWord(form: NgForm): void {
    if (this.saving) return;
    if (form.invalid || !this.draft.Word.trim() || !this.draft.Pinyin.trim() || !this.draft.Meaning.trim() || !this.draft.Collection.trim()) { this.wordError = 'Vui lòng nhập đủ từ, pinyin, nghĩa và tên bộ sưu tập.'; return; }
    this.saving = true; this.wordError = '';
    this.api.saveWord(this.draft).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.saving = false; this.wordDialog?.nativeElement.close(); this.loadWords(); },
      error: (e: HttpErrorResponse) => { this.saving = false; this.wordError = e.status === 409 ? 'Từ này đã có trong bộ sưu tập.' : 'Không thể lưu từ. Vui lòng thử lại.'; },
    });
  }
  loadWords(): void { this.api.words().pipe(takeUntilDestroyed(this.destroy)).subscribe({ next: items => { this.vocabulary = items; }, error: () => { this.error = 'Không thể tải bộ sưu tập từ vựng.'; } }); }
  deleteWord(item: ChineseVocabulary): void {
    if (!window.confirm(`Xóa “${item.Word}” khỏi bộ sưu tập?`)) return;
    this.api.deleteWord(item.Id).pipe(takeUntilDestroyed(this.destroy)).subscribe({ next: () => this.loadWords(), error: () => { this.error = 'Không thể xóa từ. Vui lòng thử lại.'; } });
  }
}
