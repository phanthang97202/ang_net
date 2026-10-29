import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PersonalNoteService } from './personal-note.service';

describe('Personal note share requests', () => {
  it('sends share tokens in a header instead of the URL', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    const api = TestBed.inject(PersonalNoteService);
    const http = TestBed.inject(HttpTestingController);
    const token = 'a'.repeat(64);
    api.publicNote(token).subscribe();
    api.sharedNote(token).subscribe();
    api.saveShared(token, { Title: 'Test', ContentJson: '{}', Version: 1 }).subscribe();
    const requests = http.match(() => true);
    expect(requests.length).toBe(3);
    for (const req of requests) {
      expect(req.request.url).not.toContain(token);
      expect(req.request.headers.get('X-Note-Token')).toBe(token);
      req.flush({});
    }
    http.verify();
  });
});
