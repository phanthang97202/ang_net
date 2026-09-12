export const CONSTANTS_APP = {
  PAGE_INDEX: 0,
  PAGE_SIZE: 10,
  // Số bài xem trước trong mỗi thẻ danh mục ngoài trang chủ. Thanh chọn chủ đề
  // và khối "Khám phá theo chủ đề" phải dùng chung con số này: khoá cache của
  // NewsCacheService tính theo nó, lệch nhau là thành hai lần gọi API.
  CATEGORY_PREVIEW_TAKE: 3,
};
