import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subscription } from 'rxjs';
import { ChineseExercise, ChineseExerciseRequest, ChineseKind, ChineseLearningService, ChineseVocabulary, ChineseVocabularyRequest, ChineseWord } from '../../services/chinese-learning.service';
import { LookupItem, LookupListService } from '../../services/lookup-list.service';
import { ChinesePinyinInputService } from '../../services/chinese-pinyin-input.service';

@Component({ selector: 'app-chinese-learning', standalone: true, imports: [CommonModule, FormsModule, NzIconModule, RouterLink], templateUrl: './chinese-learning.component.html', styleUrl: './chinese-learning.component.scss' })
export class ChineseLearningComponent implements OnInit, OnDestroy {
  @ViewChild('wordDialog') wordDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('exerciseDialog') exerciseDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('exerciseText') exerciseText?: ElementRef<HTMLElement>;
  @ViewChild('manualText') manualText?: ElementRef<HTMLTextAreaElement>;
  private readonly api = inject(ChineseLearningService);
  private readonly lookups = inject(LookupListService);
  private readonly pinyinInput = inject(ChinesePinyinInputService);
  private readonly destroy = inject(DestroyRef);
  private listRequest?: Subscription;
  private exerciseListRequest?: Subscription;
  readonly kinds: { id: ChineseKind; label: string; icon: string }[] = [
    { id: 'sentence', label: 'Dịch câu', icon: 'edit' }, { id: 'paragraph', label: 'Dịch đoạn', icon: 'read' }, { id: 'audio', label: 'Nghe và viết', icon: 'sound' },
  ];
  readonly manageTopicsLink = { tab: 'lookups', list: 'CHINESE_TOPIC' };
  topics: LookupItem[] = [];
  tab: 'practice' | 'exerciseList' | 'vocabulary' = 'practice';
  kind: ChineseKind = 'sentence'; topic = 'daily'; items: ChineseExercise[] = []; current?: ChineseExercise;
  vocabulary: ChineseVocabulary[] = []; collectionFilter = ''; answer = ''; revealed = false; selectedWord = '';
  collectionChoice = '';
  loading = false; generating = false; saving = false; error = ''; wordError = ''; audioError = '';
  exerciseList: ChineseExercise[] = []; exerciseListPage = 1; exerciseListTotal = 0; exerciseListLoading = false; exerciseListError = '';
  savingExercise = false; exerciseError = '';
  suggestedWords: ChineseWord[] = []; wordsLoading = false; wordsError = '';
  private wordsRequest = 0;
  pinyinEnabled = false; pinyinQuery = ''; pinyinCandidates: readonly string[] = []; pinyinLoading = false; pinyinError = '';
  private pinyinRequest = 0; private insertionStart = 0; private insertionEnd = 0;
  exerciseDraft: ChineseExerciseRequest = { Kind: 'sentence', Topic: '', Text: '', Pinyin: '', Translation: '' };
  draft: ChineseVocabularyRequest = { Word: '', Pinyin: '', Meaning: '', Collection: '', Example: '', ExamplePinyin: '', ExampleTranslation: '' };
  ngOnInit(): void { this.loadTopics(); this.loadWords(); }
  ngOnDestroy(): void { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
  get collections(): string[] { return [...new Set(this.vocabulary.map(x => x.Collection))].sort((a, b) => a.localeCompare(b, 'vi')); }
  get filteredWords(): ChineseVocabulary[] { return this.collectionFilter ? this.vocabulary.filter(x => x.Collection === this.collectionFilter) : this.vocabulary; }
  topicName(item: LookupItem): string { return this.lookups.name(item); }
  loadTopics(): void {
    this.loading = true; this.error = '';
    this.lookups.list('CHINESE_TOPIC').pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: topics => {
        this.topics = topics;
        if (!topics.some(x => x.Code === this.topic)) this.topic = topics[0]?.Code || '';
        if (this.topic) this.loadExercises(); else { this.loading = false; this.items = []; this.current = undefined; }
      },
      error: () => { this.loading = false; this.topics = []; this.topic = ''; this.error = 'Không thể tải chủ đề. Vui lòng thử lại.'; },
    });
  }
  chooseKind(kind: ChineseKind): void { if (this.kind !== kind && !this.generating) { this.kind = kind; if (this.topic) { this.loadExercises(); if (this.tab === 'exerciseList') this.loadExerciseList(1); } } }
  changeTopic(): void { if (!this.generating) { this.loadExercises(); if (this.tab === 'exerciseList') this.loadExerciseList(1); } }
  showExerciseList(): void { this.tab = 'exerciseList'; if (this.topic) this.loadExerciseList(1); }
  loadExerciseList(page: number): void {
    this.exerciseListRequest?.unsubscribe(); this.exerciseListPage = page; this.exerciseListLoading = true; this.exerciseListError = ''; this.exerciseList = [];
    this.api.exerciseList(this.kind, this.topic, page).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: result => { this.exerciseListLoading = false; this.exerciseList = result.Items; this.exerciseListTotal = result.Total; this.exerciseListPage = page; },
      error: () => { this.exerciseListLoading = false; this.exerciseListError = 'Không thể tải danh sách bài luyện. Vui lòng thử lại.'; },
    });
  }
  selectExercise(item: ChineseExercise): void { this.listRequest?.unsubscribe(); this.loading = false; this.current = item; this.resetAnswer(); this.tab = 'practice'; }
  loadExercises(preferredId?: string): void {
    this.listRequest?.unsubscribe(); this.loading = true; this.error = ''; this.current = undefined; this.items = []; this.resetAnswer();
    this.listRequest = this.api.exercises(this.kind, this.topic).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: items => { this.loading = false; this.items = items; if (preferredId) this.current = items.find(x => x.Id === preferredId); if (!this.current && items.length) this.next(); },
      error: () => { this.loading = false; this.error = 'Không thể tải bài luyện. Vui lòng thử lại.'; },
    });
  }
  generate(): void {
    if (this.generating || !this.topic) return; this.generating = true; this.error = '';
    this.api.generate(this.kind, this.topic).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.generating = false; this.loadExercises(); },
      error: (e: HttpErrorResponse) => { this.generating = false; this.error = e.status === 429 ? 'Đang vượt giới hạn tạo bài. Bạn hãy thử lại sau hoặc dùng các bài đã lưu.' : e.error?.Code === 'GroqNotConfigured' ? 'Chức năng tạo bài chưa được cấu hình.' : 'Không thể tạo bài lúc này. Hãy thử lại hoặc dùng các bài đã lưu.'; },
    });
  }
  openExercise(): void {
    if (!this.topic || this.generating) return;
    this.exerciseError = '';
    this.exerciseDraft = { Kind: this.kind, Topic: this.topic, Text: '', Pinyin: '', Translation: '' };
    this.pinyinEnabled = false; this.pinyinQuery = ''; this.pinyinCandidates = []; this.pinyinError = ''; this.pinyinRequest++; this.insertionStart = 0; this.insertionEnd = 0;
    this.exerciseDialog?.nativeElement.showModal();
  }
  rememberInsertion(): void {
    const input = this.manualText?.nativeElement;
    if (input) { this.insertionStart = input.selectionStart; this.insertionEnd = input.selectionEnd; }
  }
  async searchPinyin(): Promise<void> {
    const request = ++this.pinyinRequest; const query = this.pinyinQuery.trim();
    this.pinyinCandidates = []; this.pinyinError = '';
    if (!query) { this.pinyinLoading = false; return; }
    this.pinyinLoading = true;
    try {
      const matches = await this.pinyinInput.candidates(query);
      if (request === this.pinyinRequest) this.pinyinCandidates = matches;
    } catch {
      if (request === this.pinyinRequest) this.pinyinError = 'Không thể tải từ điển. Hãy thử lại.';
    } finally { if (request === this.pinyinRequest) this.pinyinLoading = false; }
  }
  insertCandidate(word: string): void {
    const text = this.exerciseDraft.Text;
    const start = Math.min(this.insertionStart, text.length); const end = Math.min(this.insertionEnd, text.length);
    if (text.length - (end - start) + word.length > 500) { this.pinyinError = 'Nội dung tiếng Trung tối đa 500 ký tự.'; return; }
    this.exerciseDraft.Text = text.slice(0, start) + word + text.slice(end);
    this.insertionStart = this.insertionEnd = start + word.length;
    this.pinyinQuery = ''; this.pinyinCandidates = []; this.pinyinError = ''; this.pinyinLoading = false; this.pinyinRequest++;
    const input = this.manualText?.nativeElement;
    if (input) { input.value = this.exerciseDraft.Text; input.setSelectionRange(this.insertionStart, this.insertionEnd); }
  }
  pinyinKeydown(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if ((event.key === 'Enter' || event.key === ' ') && this.pinyinCandidates.length) { event.preventDefault(); this.insertCandidate(this.pinyinCandidates[0]); }
    else if (event.key === 'Enter') event.preventDefault();
  }
  saveExercise(form: NgForm): void {
    if (this.savingExercise) return;
    if (form.invalid || !this.exerciseDraft.Text.trim() || !this.exerciseDraft.Pinyin.trim() || !this.exerciseDraft.Translation.trim()) {
      this.exerciseError = 'Vui lòng nhập nội dung tiếng Trung, pinyin và bản dịch.'; return;
    }
    this.savingExercise = true; this.exerciseError = '';
    this.api.createExercise(this.exerciseDraft).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: result => { this.savingExercise = false; this.exerciseDialog?.nativeElement.close(); this.loadExercises(result.Id); },
      error: () => { this.savingExercise = false; this.exerciseError = 'Không thể lưu bài luyện. Vui lòng thử lại.'; },
    });
  }
  next(): void {
    if (!this.items.length) return;
    const choices = this.items.length > 1 ? this.items.filter(x => x.Id !== this.current?.Id) : this.items;
    this.current = choices[Math.floor(Math.random() * choices.length)]; this.resetAnswer();
  }
  private resetAnswer(): void { this.answer = ''; this.revealed = false; this.selectedWord = ''; this.audioError = ''; this.wordsRequest++; this.suggestedWords = []; this.wordsLoading = false; this.wordsError = ''; if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
  async revealAnswer(): Promise<void> {
    this.revealed = true;
    const current = this.current;
    if (!current || current.Words.length) return;
    const request = ++this.wordsRequest; this.wordsLoading = true; this.wordsError = '';
    try {
      const words = await this.pinyinInput.words(current.Text);
      if (request === this.wordsRequest) this.suggestedWords = words;
    } catch {
      if (request === this.wordsRequest) this.wordsError = 'Không thể tách từ. Bạn vẫn có thể bôi đen từ trong bài để lưu.';
    } finally { if (request === this.wordsRequest) this.wordsLoading = false; }
  }
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
    this.collectionChoice = this.collections[0] || '';
    this.wordError = ''; this.draft = { Word: text, Pinyin: match?.Pinyin || '', Meaning: match?.Meaning || '', Collection: this.collectionChoice, Example: this.current.Text, ExamplePinyin: this.current.Pinyin, ExampleTranslation: this.current.Translation };
    this.wordDialog?.nativeElement.showModal();
  }
  chooseCollection(value: string): void { this.collectionChoice = value; this.draft.Collection = value; this.wordError = ''; }
  saveWord(form: NgForm): void {
    if (this.saving) return;
    if (form.invalid || !this.draft.Word.trim() || !this.draft.Pinyin.trim() || !this.draft.Meaning.trim() || !this.draft.Collection.trim()) { this.wordError = 'Vui lòng nhập đủ từ, pinyin, nghĩa và tên bộ sưu tập.'; return; }
    const name = this.draft.Collection.trim();
    const existing = this.collections.find(x => x.localeCompare(name, 'vi', { sensitivity: 'accent' }) === 0);
    if (!this.collectionChoice && existing) { this.wordError = 'Bộ sưu tập này đã tồn tại. Hãy chọn bộ sưu tập trong danh sách.'; return; }
    this.draft.Collection = this.collectionChoice || name;
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
