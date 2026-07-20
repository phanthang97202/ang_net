"""
MCP server đọc-only cho hệ thống báo cáo ca trực khách sạn, dùng PostgreSQL.

Cài đặt:
    pip install "mcp[cli]" psycopg2-binary

Chạy (đặt biến môi trường kết nối trước):
    export HOTEL_DB_HOST=localhost
    export HOTEL_DB_PORT=5432
    export HOTEL_DB_NAME=hotel_db
    export HOTEL_DB_USER=readonly_user
    export HOTEL_DB_PASSWORD=your_password
    python3 reporthotel_mcp.py

LƯU Ý QUAN TRỌNG:
- Server này CHỈ ĐỌC (SELECT). Không có tool ghi/xóa - đúng với yêu cầu bạn chọn.
- Nên tạo một user Postgres riêng chỉ có quyền SELECT (không phải superuser),
  để dù có lỗi trong code cũng không thể vô tình ghi/xóa dữ liệu thật.
- Đổi tên bảng/cột trong phần SCHEMA bên dưới cho khớp với database thật của bạn.
"""

import os
import psycopg2
import psycopg2.extras
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("reporthotel")

# ---- SCHEMA: đổi cho khớp với database thật của bạn ----
TABLE_NAME = "shift_reports"
# Giả định các cột: id, room_number, issue, status, shift_date, created_at
# Nếu bảng bạn đặt tên cột khác, sửa lại các câu SQL bên dưới cho khớp.


def get_connection():
    """Mở kết nối tới Postgres bằng thông tin lấy từ biến môi trường."""
    return psycopg2.connect(
        host=os.environ["HOTEL_DB_HOST"],
        port=os.environ.get("HOTEL_DB_PORT", "5432"),
        dbname=os.environ["HOTEL_DB_NAME"],
        user=os.environ["HOTEL_DB_USER"],
        password=os.environ["HOTEL_DB_PASSWORD"],
    )


@mcp.tool()
def search_reports(room: str = "", keyword: str = "", limit: int = 20) -> str:
    """Tìm báo cáo ca trực theo số phòng và/hoặc từ khóa trong nội dung sự cố.

    Args:
        room: số phòng cần lọc (để trống nếu không lọc theo phòng)
        keyword: từ khóa tìm trong mô tả sự cố (để trống nếu không lọc)
        limit: số kết quả tối đa trả về (mặc định 20)
    """
    conditions = []
    params = []
    if room:
        conditions.append("room_number = %s")
        params.append(room)
    if keyword:
        conditions.append("issue ILIKE %s")
        params.append(f"%{keyword}%")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    query = f"""
        SELECT id, room_number, issue, status, shift_date, created_at
        FROM {TABLE_NAME}
        {where_clause}
        ORDER BY created_at DESC
        LIMIT %s
    """
    params.append(limit)

    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

    if not rows:
        return "Không tìm thấy báo cáo nào khớp."
    return "\n".join(
        f"#{r['id']} | Phòng {r['room_number']} | {r['issue']} | "
        f"trạng thái: {r['status']} | {r['shift_date']}"
        for r in rows
    )


@mcp.tool()
def get_report_by_id(report_id: int) -> str:
    """Lấy chi tiết đầy đủ một báo cáo theo ID.

    Args:
        report_id: ID của báo cáo cần xem
    """
    query = f"""
        SELECT id, room_number, issue, status, shift_date, created_at
        FROM {TABLE_NAME}
        WHERE id = %s
    """
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, (report_id,))
            row = cur.fetchone()

    if not row:
        return f"Không tìm thấy báo cáo #{report_id}."
    return (
        f"Báo cáo #{row['id']}\n"
        f"Phòng: {row['room_number']}\n"
        f"Sự cố: {row['issue']}\n"
        f"Trạng thái: {row['status']}\n"
        f"Ca: {row['shift_date']}\n"
        f"Tạo lúc: {row['created_at']}"
    )


@mcp.tool()
def summarize_pending_reports() -> str:
    """Tóm tắt các báo cáo chưa xử lý xong (dùng để bàn giao ca)."""
    query = f"""
        SELECT id, room_number, issue, status
        FROM {TABLE_NAME}
        WHERE status NOT IN ('đã xử lý', 'đã đóng')
        ORDER BY created_at DESC
    """
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query)
            rows = cur.fetchall()

    if not rows:
        return "Không có báo cáo nào đang tồn đọng."
    lines = [f"Có {len(rows)} báo cáo chưa xử lý xong:"]
    lines += [
        f"- #{r['id']} Phòng {r['room_number']}: {r['issue']} (trạng thái: {r['status']})"
        for r in rows
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run(transport="stdio")
