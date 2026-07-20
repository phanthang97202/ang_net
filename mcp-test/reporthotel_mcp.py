"""
MCP server đọc-only cho module quản lý báo cáo ca trực khách sạn (reporthotel).
Khớp đúng schema: ShiftReport, ShiftReportRoomSale, ShiftReportTransaction.

Cài đặt:
    pip install "mcp[cli]" psycopg2-binary

Chạy (đặt biến môi trường trước, KHÔNG hardcode connection string vào code):
    export REPORTHOTEL_DB_URL="postgresql://user:password@host/dbname"
    python3 reporthotel_mcp.py

Server này CHỈ ĐỌC (SELECT) - không có tool ghi/sửa/xóa, đúng theo yêu cầu ban đầu.
Mọi câu query đều lọc "FlagActive" = true để chỉ lấy dữ liệu chưa bị soft-delete.
"""

import os
import psycopg2
import psycopg2.extras
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("reporthotel")


def get_connection():
    """Mở kết nối Postgres từ biến môi trường REPORTHOTEL_DB_URL."""
    db_url = os.environ.get("postgresql://angnet0726_user:nh3Bf3hEcIIYFUHHzgEPYrZumsiK42Gc@dpg-d92h70eq1p3s73fpr0jg-a.oregon-postgres.render.com/angnet0726")
    if not db_url:
        raise RuntimeError("Chưa đặt biến môi trường REPORTHOTEL_DB_URL")
    return psycopg2.connect(db_url)


@mcp.tool()
def search_shift_reports(
    date_from: str = "",
    date_to: str = "",
    receptionist_name: str = "",
    shift_type: str = "",
    limit: int = 20,
) -> str:
    """Tìm các báo cáo ca trực theo khoảng ngày, tên lễ tân, hoặc loại ca.

    Args:
        date_from: ngày bắt đầu lọc, định dạng YYYY-MM-DD (để trống nếu không lọc)
        date_to: ngày kết thúc lọc, định dạng YYYY-MM-DD (để trống nếu không lọc)
        receptionist_name: tên lễ tân trực ca, tìm gần đúng (để trống nếu không lọc)
        shift_type: loại ca, ví dụ 'Sáng', 'Chiều', 'Đêm' (để trống nếu không lọc)
        limit: số kết quả tối đa (mặc định 20)
    """
    conditions = ['"FlagActive" = true']
    params = []
    if date_from:
        conditions.append('"ShiftDate" >= %s')
        params.append(date_from)
    if date_to:
        conditions.append('"ShiftDate" <= %s')
        params.append(date_to)
    if receptionist_name:
        conditions.append('"ReceptionistName" ILIKE %s')
        params.append(f"%{receptionist_name}%")
    if shift_type:
        conditions.append('"ShiftType" = %s')
        params.append(shift_type)

    query = f"""
        SELECT id, "ShiftDate", "ShiftType", "ReceptionistName", "ReceiverName",
               "TotalCash", "TotalTransfer", "TotalExpense", "HandoverAmount"
        FROM public."ShiftReport"
        WHERE {' AND '.join(conditions)}
        ORDER BY "ShiftDate" DESC, "StartTime" DESC
        LIMIT %s
    """
    params.append(limit)

    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

    if not rows:
        return "Không tìm thấy báo cáo ca trực nào khớp điều kiện."
    return "\n".join(
        f"#{r['id']} | {r['ShiftDate']} | Ca {r['ShiftType']} | "
        f"Lễ tân: {r['ReceptionistName']} → bàn giao: {r['ReceiverName']} | "
        f"Tiền mặt: {r['TotalCash']:,.0f} | Chuyển khoản: {r['TotalTransfer']:,.0f} | "
        f"Chi phí: {r['TotalExpense']:,.0f} | Bàn giao: {r['HandoverAmount']:,.0f}"
        for r in rows
    )


@mcp.tool()
def get_shift_report_detail(report_id: int) -> str:
    """Lấy chi tiết đầy đủ một báo cáo ca trực, gồm cả danh sách phòng bán và giao dịch.

    Args:
        report_id: ID của báo cáo ca trực cần xem
    """
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                '''SELECT * FROM public."ShiftReport"
                   WHERE id = %s AND "FlagActive" = true''',
                (report_id,),
            )
            report = cur.fetchone()
            if not report:
                return f"Không tìm thấy báo cáo #{report_id}."

            cur.execute(
                '''SELECT "RoomNumber", "RoomCategory", "UnitPrice"
                   FROM public."ShiftReportRoomSale"
                   WHERE "ShiftReportId" = %s AND "FlagActive" = true
                   ORDER BY "RoomNumber"''',
                (report_id,),
            )
            room_sales = cur.fetchall()

            cur.execute(
                '''SELECT "OrderNumber", "RoomNumber", "InvoiceCode", "CustomerType",
                          "CashAmount", "TransferAmount", "PrepaidNote",
                          "ExpenseDescription", "ExpenseAmount"
                   FROM public."ShiftReportTransaction"
                   WHERE "ShiftReportId" = %s AND "FlagActive" = true
                   ORDER BY "OrderNumber"''',
                (report_id,),
            )
            transactions = cur.fetchall()

    lines = [
        f"Báo cáo ca trực #{report['id']} - {report['ShiftDate']} (ca {report['ShiftType']})",
        f"Thời gian: {report['StartTime']} → {report['EndTime']}",
        f"Lễ tân: {report['ReceptionistName']} | Người nhận bàn giao: {report['ReceiverName']}",
        f"Tổng tiền mặt: {report['TotalCash']:,.0f} | Tổng chuyển khoản: {report['TotalTransfer']:,.0f}",
        f"Tổng chi phí: {report['TotalExpense']:,.0f} | Số tiền bàn giao: {report['HandoverAmount']:,.0f}",
        "",
        f"Phòng đã bán ({len(room_sales)}):",
    ]
    lines += [
        f"  - Phòng {r['RoomNumber']} ({r['RoomCategory']}): {r['UnitPrice']:,.0f}"
        for r in room_sales
    ] or ["  (không có)"]

    lines.append("")
    lines.append(f"Giao dịch ({len(transactions)}):")
    for t in transactions:
        parts = [f"  #{t['OrderNumber']} phòng {t['RoomNumber']} ({t['InvoiceCode']}, {t['CustomerType']})"]
        if t["CashAmount"]:
            parts.append(f"tiền mặt {t['CashAmount']:,.0f}")
        if t["TransferAmount"]:
            parts.append(f"chuyển khoản {t['TransferAmount']:,.0f}")
        if t["ExpenseAmount"]:
            parts.append(f"chi phí {t['ExpenseAmount']:,.0f} ({t['ExpenseDescription']})")
        if t["PrepaidNote"]:
            parts.append(f"ghi chú: {t['PrepaidNote']}")
        lines.append(" | ".join(parts))

    return "\n".join(lines)


@mcp.tool()
def summarize_revenue_by_date(date: str) -> str:
    """Tổng hợp doanh thu tất cả các ca trực trong một ngày cụ thể.

    Args:
        date: ngày cần tổng hợp, định dạng YYYY-MM-DD
    """
    query = '''
        SELECT "ShiftType", "ReceptionistName",
               "TotalCash", "TotalTransfer", "TotalExpense", "HandoverAmount"
        FROM public."ShiftReport"
        WHERE "ShiftDate" = %s AND "FlagActive" = true
        ORDER BY "StartTime"
    '''
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, (date,))
            rows = cur.fetchall()

    if not rows:
        return f"Không có báo cáo ca trực nào ngày {date}."

    total_cash = sum(r["TotalCash"] for r in rows)
    total_transfer = sum(r["TotalTransfer"] for r in rows)
    total_expense = sum(r["TotalExpense"] for r in rows)

    lines = [f"Tổng hợp ngày {date} ({len(rows)} ca):"]
    lines += [
        f"  - Ca {r['ShiftType']} ({r['ReceptionistName']}): "
        f"tiền mặt {r['TotalCash']:,.0f}, chuyển khoản {r['TotalTransfer']:,.0f}, "
        f"chi phí {r['TotalExpense']:,.0f}"
        for r in rows
    ]
    lines.append("")
    lines.append(
        f"TỔNG: tiền mặt {total_cash:,.0f} | chuyển khoản {total_transfer:,.0f} | "
        f"chi phí {total_expense:,.0f} | doanh thu ròng {total_cash + total_transfer - total_expense:,.0f}"
    )
    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run(transport="stdio")