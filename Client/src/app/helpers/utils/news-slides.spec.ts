import { buildNewsSlides, stepSlide, FALLBACK_THUMBNAIL } from './news-slides';

describe('buildNewsSlides', () => {
  const THUMB = 'https://cdn.test/thumb.webp';

  it('ảnh đại diện đứng đầu, rồi tới ảnh trong bài theo đúng thứ tự', () => {
    const slides = buildNewsSlides(
      THUMB,
      '<p>mở bài</p><img src="https://cdn.test/a.jpg"><p>giữa</p><img src="https://cdn.test/b.jpg">'
    );

    expect(slides).toEqual([THUMB, 'https://cdn.test/a.jpg', 'https://cdn.test/b.jpg']);
  });

  it('không tạo slide trùng khi ảnh đại diện được dùng lại trong bài', () => {
    const slides = buildNewsSlides(
      THUMB,
      `<img src="${THUMB}"><img src="https://cdn.test/a.jpg"><img src="https://cdn.test/a.jpg">`
    );

    expect(slides).toEqual([THUMB, 'https://cdn.test/a.jpg']);
  });

  it('bỏ ảnh base64 và src rỗng/thiếu', () => {
    const slides = buildNewsSlides(
      THUMB,
      '<img src="data:image/png;base64,iVBORw0KGgo="><img src=""><img><img src="https://cdn.test/a.jpg">'
    );

    expect(slides).toEqual([THUMB, 'https://cdn.test/a.jpg']);
  });

  it('bài toàn chữ thì chỉ còn đúng 1 slide', () => {
    expect(buildNewsSlides(THUMB, '<p>bài viết toàn chữ</p>')).toEqual([THUMB]);
  });

  it('nội dung rỗng cũng không vỡ', () => {
    expect(buildNewsSlides(THUMB, '')).toEqual([THUMB]);
  });

  it('không có ảnh đại diện thì dùng ảnh mặc định làm slide đầu', () => {
    const slides = buildNewsSlides('', '<img src="https://cdn.test/a.jpg">');

    expect(slides).toEqual([FALLBACK_THUMBNAIL, 'https://cdn.test/a.jpg']);
  });

  it('đọc được ảnh nằm sâu trong thẻ lồng nhau', () => {
    const slides = buildNewsSlides(
      THUMB,
      '<div><figure><a href="#"><img src="https://cdn.test/a.jpg"></a></figure></div>'
    );

    expect(slides).toEqual([THUMB, 'https://cdn.test/a.jpg']);
  });
});

describe('stepSlide', () => {
  it('tiến 1 slide', () => {
    expect(stepSlide(0, 3, 1)).toBe(1);
  });

  it('tiến từ slide cuối thì quay về đầu', () => {
    expect(stepSlide(2, 3, 1)).toBe(0);
  });

  // Chỗ dễ sai nhất: trong JS (-1 % 3) ra -1 chứ không phải 2.
  it('lùi từ slide đầu thì quay về cuối', () => {
    expect(stepSlide(0, 3, -1)).toBe(2);
  });

  it('chỉ có 1 slide thì đứng yên', () => {
    expect(stepSlide(0, 1, 1)).toBe(0);
    expect(stepSlide(0, 1, -1)).toBe(0);
  });

  it('chưa có slide nào thì không trả về chỉ số âm', () => {
    expect(stepSlide(0, 0, -1)).toBe(0);
  });
});
