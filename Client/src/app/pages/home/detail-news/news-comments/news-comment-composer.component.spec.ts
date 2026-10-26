import { Component, EventEmitter, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { SendOutline } from '@ant-design/icons-angular/icons';
import { TurnstileComponent } from '../../../../components/turnstile/turnstile.component';
import { NewsCommentComposerComponent } from './news-comment-composer.component';

@Component({ selector: 'app-turnstile', standalone: true, template: '' })
class CaptchaStub {
  @Output() tokenChange = new EventEmitter<string>();
}

describe('Comment CAPTCHA and draft', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NewsCommentComposerComponent, TranslateModule.forRoot()],
      providers: [{ provide: NZ_ICONS, useValue: [SendOutline] }],
    });
    TestBed.overrideComponent(NewsCommentComposerComponent, {
      remove: { imports: [TurnstileComponent] },
      add: { imports: [CaptchaStub] },
    });
  });

  it('blocks button and keyboard submissions until verification succeeds, and consumes a token once', () => {
    const fixture = TestBed.createComponent(NewsCommentComposerComponent);
    const composer = fixture.componentInstance;
    const submitted = jasmine.createSpy();
    composer.submitted.subscribe(submitted);
    composer.draft = '  hello  ';
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.composer__send').disabled
    ).toBeTrue();
    composer.onKeydown(
      new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true })
    );
    expect(submitted).not.toHaveBeenCalled();
    fixture.debugElement
      .query(By.directive(CaptchaStub))
      .componentInstance.tokenChange.emit('token');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.composer__send').disabled
    ).toBeFalse();
    composer.send();
    composer.send();
    expect(submitted).toHaveBeenCalledOnceWith({
      content: 'hello',
      turnstileToken: 'token',
    });
    expect(composer.draft).toBe('  hello  ');
    fixture.destroy();
  });

  it('preserves a failed draft, clears only a successful draft, and resets verification after both outcomes', () => {
    const fixture = TestBed.createComponent(NewsCommentComposerComponent);
    fixture.detectChanges();
    const composer = fixture.componentInstance;
    const reset = jasmine.createSpy();
    composer.captcha = { reset } as unknown as TurnstileComponent;
    composer.draft = 'keep my reply';
    composer.turnstileToken = 'used-token';
    composer.completeSubmission(false);
    expect(composer.draft).toBe('keep my reply');
    expect(composer.turnstileToken).toBe('');
    composer.completeSubmission(true);
    expect(composer.draft).toBe('');
    expect(reset).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });

  it('disables sending again when verification expires', () => {
    const fixture = TestBed.createComponent(NewsCommentComposerComponent);
    fixture.detectChanges();
    const composer = fixture.componentInstance;
    const captcha = fixture.debugElement.query(
      By.directive(CaptchaStub)
    ).componentInstance;
    composer.draft = 'hello';
    captcha.tokenChange.emit('token');
    expect(composer.canSend).toBeTrue();
    captcha.tokenChange.emit('');
    expect(composer.canSend).toBeFalse();
    fixture.destroy();
  });
});
