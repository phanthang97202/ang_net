// Ảnh dùng khi bài viết không có ảnh đại diện.
export const FALLBACK_THUMBNAIL =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsBGOs2225fFqTfnl5EKlrEUBn5-drby1x3Q&s';

// Danh sách ảnh cho slide ở đầu trang chi tiết: ảnh đại diện đứng đầu, sau đó
// tới ảnh lấy từ nội dung bài viết theo đúng thứ tự xuất hiện.
export function buildNewsSlides(
  thumbnail: string,
  contentBody: string
): string[] {
  const cover = thumbnail || FALLBACK_THUMBNAIL;
  // Ảnh đại diện thường được dùng lại trong bài, không muốn nó ra 2 slide.
  const seen = new Set<string>([cover]);
  const slides = [cover];

  for (const src of extractContentImages(contentBody)) {
    if (!seen.has(src)) {
      seen.add(src);
      slides.push(src);
    }
  }

  return slides;
}

// Lùi/tiến 1 slide, chạy vòng ở cả hai đầu. Cộng thêm total trước khi chia dư
// vì trong JS (-1 % 3) ra -1 chứ không phải 2.
export function stepSlide(
  current: number,
  total: number,
  step: 1 | -1
): number {
  if (total <= 0) return 0;
  return (current + step + total) % total;
}

// ContentBody là HTML do trình soạn thảo sinh ra, nên đọc bằng DOMParser thay
// vì regex. Document tạo ra là inert - ảnh không bị tải, script không chạy.
// App chỉ render phía client nên luôn có DOMParser.
function extractContentImages(html: string): string[] {
  if (!html) return [];

  return Array.from(
    new DOMParser().parseFromString(html, 'text/html').querySelectorAll('img')
  )
    .map(img => img.getAttribute('src') || '')
    // Bỏ ảnh nhúng dạng data: (trình soạn thảo hay chèn ảnh base64 rất nặng)
    // và mọi src rỗng/tương đối không dùng được.
    .filter(src => src.startsWith('https://') || src.startsWith('http://'));
}
