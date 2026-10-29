import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import * as icons from '@ant-design/icons-angular/icons';
import { ChineseLearningComponent } from './chinese-learning.component';
import { ChinesePinyinInputService } from '../../services/chinese-pinyin-input.service';

describe('Chinese learning', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, ChineseLearningComponent, TranslateModule.forRoot()], providers: [provideRouter([]), { provide: NZ_ICONS, useValue: Object.values(icons) }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('hides answers until requested and saves an editable word', () => {
    const fixture = TestBed.createComponent(ChineseLearningComponent); fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/LookupList')).flush([{ Code: 'daily', NameVi: 'Hằng ngày', NameEn: 'Daily', FlagActive: true }]);
    http.expectOne(req => req.url.endsWith('/exercises')).flush([{ Id: '1', Kind: 'sentence', Topic: 'daily', Text: '我在酒店工作。', Pinyin: 'wǒ zài jiǔdiàn gōngzuò', Translation: 'Tôi làm việc ở khách sạn', Words: [{ Word: '酒店', Pinyin: 'jiǔdiàn', Meaning: 'khách sạn' }] }]);
    http.expectOne(req => req.url.endsWith('/vocabulary')).flush([]); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.solution')).toBeNull();
    fixture.componentInstance.revealed = true; fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.solution').textContent).toContain('khách sạn');
    fixture.componentInstance.openWord(fixture.componentInstance.current!.Words[0]);
    expect(fixture.componentInstance.draft.Word).toBe('酒店');
    fixture.componentInstance.draft.Meaning = 'khách sạn đã kiểm tra';
    fixture.componentInstance.saveWord({ invalid: false } as never);
    const request = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/vocabulary'));
    expect(request.request.body.Meaning).toBe('khách sạn đã kiểm tra'); request.flush({ Id: '1' });
    http.expectOne(req => req.method === 'GET' && req.url.endsWith('/vocabulary')).flush([]);
  });
  it('keeps saved exercises available when generation is rate limited', () => {
    const fixture = TestBed.createComponent(ChineseLearningComponent); fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/LookupList')).flush([{ Code: 'daily', NameVi: 'Hằng ngày', NameEn: 'Daily', FlagActive: true }]);
    http.expectOne(req => req.url.endsWith('/exercises')).flush([{ Id: '1', Kind: 'sentence', Topic: 'daily', Text: '你好', Pinyin: 'nǐ hǎo', Translation: 'Xin chào', Words: [] }]);
    http.expectOne(req => req.url.endsWith('/vocabulary')).flush([]);
    fixture.componentInstance.generate(); http.expectOne(req => req.url.endsWith('/generate')).flush({}, { status: 429, statusText: 'Limit' });
    expect(fixture.componentInstance.current?.Text).toBe('你好');
    expect(fixture.componentInstance.error).toContain('giới hạn');
  });
  it('loads a personal topic and requests exercises using its stable code', () => {
    const fixture = TestBed.createComponent(ChineseLearningComponent); fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/LookupList')).flush([{ Code: 'custom1', NameVi: 'Tiếp khách', NameEn: 'Guests', FlagActive: true }]);
    const request = http.expectOne(req => req.url.endsWith('/exercises'));
    expect(request.request.params.get('topic')).toBe('custom1'); request.flush([]);
    http.expectOne(req => req.url.endsWith('/vocabulary')).flush([]); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select').textContent).toContain('Tiếp khách');
  });
  it('saves a manually created exercise and displays it', () => {
    const fixture = TestBed.createComponent(ChineseLearningComponent); fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/LookupList')).flush([{ Code: 'daily', NameVi: 'Hằng ngày', NameEn: 'Daily', FlagActive: true }]);
    http.expectOne(req => req.url.endsWith('/exercises')).flush([]);
    http.expectOne(req => req.url.endsWith('/vocabulary')).flush([]); fixture.detectChanges();
    fixture.componentInstance.openExercise();
    fixture.componentInstance.exerciseDraft.Text = '你好'; fixture.componentInstance.exerciseDraft.Pinyin = 'nǐ hǎo'; fixture.componentInstance.exerciseDraft.Translation = 'Xin chào';
    fixture.componentInstance.saveExercise({ invalid: false } as never);
    const request = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/exercises'));
    expect(request.request.body.Topic).toBe('daily'); request.flush({ Id: 'new' });
    http.expectOne(req => req.method === 'GET' && req.url.endsWith('/exercises')).flush([{ Id: 'new', Kind: 'sentence', Topic: 'daily', Text: '你好', Pinyin: 'nǐ hǎo', Translation: 'Xin chào', Words: [] }]);
    expect(fixture.componentInstance.current?.Id).toBe('new');
  });
  it('offers pinyin candidates and inserts the selected word at the cursor', async () => {
    const fixture = TestBed.createComponent(ChineseLearningComponent); fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/LookupList')).flush([{ Code: 'daily', NameVi: 'Hằng ngày', NameEn: 'Daily', FlagActive: true }]);
    http.expectOne(req => req.url.endsWith('/exercises')).flush([]);
    http.expectOne(req => req.url.endsWith('/vocabulary')).flush([]); fixture.detectChanges();
    fixture.componentInstance.openExercise(); fixture.detectChanges();
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea[name="text"]');
    fixture.componentInstance.exerciseDraft.Text = '我工作'; textarea.value = '我工作';
    textarea.setSelectionRange(1, 1); fixture.componentInstance.rememberInsertion();
    spyOn(TestBed.inject(ChinesePinyinInputService), 'candidates').and.resolveTo(['在']);
    fixture.componentInstance.pinyinQuery = 'zai'; await fixture.componentInstance.searchPinyin();
    expect(fixture.componentInstance.pinyinCandidates).toEqual(['在']);
    fixture.componentInstance.insertCandidate('在');
    expect(fixture.componentInstance.exerciseDraft.Text).toBe('我在工作');
    expect(fixture.componentInstance.pinyinQuery).toBe('');
  });
  it('looks up real pinyin in the bundled dictionary', async () => {
    expect(await TestBed.inject(ChinesePinyinInputService).candidates('nihao')).toContain('你好');
  });
  it('suggests words for a manually saved exercise and lets the user save one', async () => {
    const fixture = TestBed.createComponent(ChineseLearningComponent); fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/LookupList')).flush([{ Code: 'daily', NameVi: 'Hằng ngày', NameEn: 'Daily', FlagActive: true }]);
    http.expectOne(req => req.url.endsWith('/exercises')).flush([{ Id: 'manual', Kind: 'sentence', Topic: 'daily', Text: '我在酒店工作。', Pinyin: 'wǒ zài jiǔdiàn gōngzuò', Translation: 'Tôi làm việc ở khách sạn', Words: [] }]);
    http.expectOne(req => req.url.endsWith('/vocabulary')).flush([]); fixture.detectChanges();
    await fixture.componentInstance.revealAnswer(); fixture.detectChanges();
    const hotel = fixture.componentInstance.suggestedWords.find(word => word.Word === '酒店');
    expect(hotel?.Pinyin).toBe('jiǔdiàn');
    expect(fixture.nativeElement.querySelector('.word-chips').textContent).toContain('酒店');
    fixture.componentInstance.openWord(hotel); expect(fixture.componentInstance.draft.Meaning).toBe('');
    fixture.componentInstance.draft.Meaning = 'khách sạn';
    fixture.componentInstance.saveWord({ invalid: false } as never);
    const request = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/vocabulary'));
    expect(request.request.body.Word).toBe('酒店'); request.flush({ Id: '1' });
    http.expectOne(req => req.method === 'GET' && req.url.endsWith('/vocabulary')).flush([]);
  });
});
