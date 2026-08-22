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
