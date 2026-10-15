import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  CloudUploadOutline,
  CloseOutline,
  LinkOutline,
} from '@ant-design/icons-angular/icons';
import { NzMessageService } from 'ng-zorro-antd/message';
import { of } from 'rxjs';
import { ArchiveItemFormComponent } from './archive-item-form.component';
import { ArchiveService, AuthService } from '../../../services';
import { IArchiveItemResponse } from '../../../interfaces';

describe('Archive pasted screenshots', () => {
  let canUpload: boolean;
  let archive: jasmine.SpyObj<ArchiveService>;
  let message: jasmine.SpyObj<NzMessageService>;
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';

  function screenshot(): File {
    return new File(
      [Uint8Array.from(atob(pngBase64), character => character.charCodeAt(0))],
      'screenshot.png',
      { type: 'image/png' }
    );
  }

  function paste(file?: File): ClipboardEvent {
    const clipboard = new DataTransfer();
    if (file) clipboard.items.add(file);
    else clipboard.setData('text/plain', 'https://example.com/image.png');
    return new ClipboardEvent('paste', {
      clipboardData: clipboard,
      bubbles: true,
      cancelable: true,
    });
  }

  function createForm() {
    const fixture = TestBed.createComponent(ArchiveItemFormComponent);
    const component = fixture.componentInstance;
    component.visible = true;
    component.collectionId = 'collection';
    component.ngOnChanges();
    component.setMode('link');
    fixture.detectChanges();
    return { fixture, component };
  }

  beforeEach(() => {
    canUpload = true;
    archive = jasmine.createSpyObj<ArchiveService>('ArchiveService', [
      'createItem',
      'uploadFile',
    ]);
    archive.createItem.and.returnValue(
      of({ Success: true } as IArchiveItemResponse)
    );
    message = jasmine.createSpyObj<NzMessageService>('NzMessageService', [
      'warning',
      'error',
      'success',
    ]);
    TestBed.configureTestingModule({
      imports: [ArchiveItemFormComponent, NoopAnimationsModule],
      providers: [
        { provide: ArchiveService, useValue: archive },
        { provide: NzMessageService, useValue: message },
        { provide: AuthService, useValue: { hasPermission: () => canUpload } },
        {
          provide: NZ_ICONS,
          useValue: [CloudUploadOutline, CloseOutline, LinkOutline],
        },
      ],
    });
  });

  it('previews an actual clipboard image and saves its base64 only after clicking Save', async () => {
    const { fixture, component } = createForm();
    const event = paste(screenshot());
    const originalRead = FileReader.prototype.readAsDataURL;
    const loaded = new Promise<void>(resolve => {
      spyOn(FileReader.prototype, 'readAsDataURL').and.callFake(function (
        this: FileReader,
        file: Blob
      ) {
        this.addEventListener('loadend', () => resolve(), { once: true });
        originalRead.call(this, file);
      });
    });
    document.querySelector('#item-source-url')!.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
    expect(component.isReadingImage).toBeTrue();
    component.submit();
    expect(archive.createItem).not.toHaveBeenCalled();
    await loaded;
    fixture.detectChanges();
    const image = document.querySelector<HTMLImageElement>(
      '.item-form__pasted-image img'
    );
    expect(image?.src).toBe(`data:image/png;base64,${pngBase64}`);
    await image!.decode();
    expect(image!.naturalWidth).toBe(1);
    expect(document.querySelector('#item-source-url')).toBeNull();
    expect(archive.uploadFile).not.toHaveBeenCalled();
    component.form.patchValue({ Title: 'Screenshot', Note: 'A note' });
    component.submit();
    expect(archive.createItem).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        CollectionId: 'collection',
        Kind: 'Image',
        SourceUrl: `data:image/png;base64,${pngBase64}`,
        StoragePublicId: '',
        ThumbnailUrl: '',
        Title: 'Screenshot',
        Note: 'A note',
      })
    );
    expect(archive.uploadFile).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('keeps text/URL paste native and saves external images without device upload permission', () => {
    canUpload = false;
    const { fixture, component } = createForm();
    const event = paste();
    component.onPaste(event);
    expect(event.defaultPrevented).toBeFalse();
    component.form.patchValue({
      SourceUrl: 'https://example.com/image.png',
      LinkKind: 'Image',
    });
    component.submit();
    expect(archive.createItem).toHaveBeenCalledWith(
      jasmine.objectContaining({
        Kind: 'Image',
        SourceUrl: 'https://example.com/image.png',
        StoragePublicId: '',
      })
    );
    expect(archive.uploadFile).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('rejects screenshots without permission, oversized images, and unsupported formats', () => {
    const { fixture, component } = createForm();
    canUpload = false;
    component.onPaste(paste(screenshot()));
    expect(component.isReadingImage).toBeFalse();
    expect(message.warning).toHaveBeenCalledWith(
      jasmine.stringMatching('quyền')
    );
    canUpload = true;
    component.onPaste(
      paste(
        new File([new Uint8Array(2 * 1024 * 1024)], 'large.png', {
          type: 'image/png',
        })
      )
    );
    expect(message.warning).toHaveBeenCalledWith(
      jasmine.stringMatching('2 MB')
    );
    component.onPaste(
      paste(new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' }))
    );
    expect(message.warning).toHaveBeenCalledWith(
      jasmine.stringMatching('JPG, PNG, GIF')
    );
    expect(component.form.controls.SourceUrl.value).toBe('');
    expect(archive.createItem).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('aborts pending reads when closing, switching modes, or destroying the form', () => {
    const { fixture, component } = createForm();
    const abort = spyOn(FileReader.prototype, 'abort').and.callThrough();
    component.onPaste(paste(screenshot()));
    component.close();
    expect(component.isReadingImage).toBeFalse();
    component.onPaste(paste(screenshot()));
    component.setMode('upload');
    expect(component.isReadingImage).toBeFalse();
    component.setMode('link');
    component.onPaste(paste(screenshot()));
    fixture.destroy();
    expect(abort).toHaveBeenCalledTimes(3);
    expect(component.form.controls.SourceUrl.value).toBe('');
  });
});
