// Cấu hình trang chủ lấy từ SysParameter (giá trị JSON), thay cho hardcode.

export interface IHomeBanner {
  title: string;
  description: string;
  image: string;
  buttonText?: string;
  buttonLink?: string;
}

export interface IHomeIntro {
  name: string;
  avatar?: string;
  shortDescription?: string;
  description?: string;
  address?: string;
}

export interface ISocialLink {
  icon: string; // mã nền tảng: twitter | facebook | instagram | linkedin | github | youtube | tiktok
  link: string;
}

export interface IHomeFeaturedImage {
  image: string;
  caption?: string;
}

// Danh sách bài hát của trình phát ở banner trang chủ (mã HOME_MUSIC).
// Bài mặc định không nằm trong mảng này mà lấy từ cột DefaultValueVi/En của
// chính tham số đó - giá trị là `id` của một phần tử bên dưới.
export interface IHomeSong {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  audioSrc: string;
}
