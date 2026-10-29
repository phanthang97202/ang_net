import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import * as icons from '@ant-design/icons-angular/icons';
import { ChineseLearningComponent } from './chinese-learning.component';

describe('Chinese learning', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, ChineseLearningComponent], providers: [{ provide: NZ_ICONS, useValue: Object.values(icons) }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('hides answers until requested and saves an editable word', () => {
    const fixture = TestBed.createComponent(ChineseLearningComponent); fixture.detectChanges();
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
    http.expectOne(req => req.url.endsWith('/exercises')).flush([{ Id: '1', Kind: 'sentence', Topic: 'daily', Text: '你好', Pinyin: 'nǐ hǎo', Translation: 'Xin chào', Words: [] }]);
    http.expectOne(req => req.url.endsWith('/vocabulary')).flush([]);
    fixture.componentInstance.generate(); http.expectOne(req => req.url.endsWith('/generate')).flush({}, { status: 429, statusText: 'Limit' });
    expect(fixture.componentInstance.current?.Text).toBe('你好');
    expect(fixture.componentInstance.error).toContain('giới hạn');
  });
});
