import { Injectable } from '@angular/core';
import { from, firstValueFrom, Observable, Subject } from 'rxjs';
import { format } from 'date-fns';
import { environment } from '../../../../../environments/environment';
import { ShiftReportService } from './shift-report.service';
import { AuthService } from '../../../../services';
import {
  CreateShiftReportDto,
  ShiftReportResponse,
  ShiftReportTransaction,
} from '../types/shift-report-type';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SHIFT_TYPES = ['Ca ngày', 'Ca đêm'];
const CUSTOMER_TYPES = [
  'k.ngày',
  'k.ngày/out',
  'k.đêm',
  'k.đêm/out',
  'k.giờ',
  'k.giờ/out',
];
const ROOM_CATEGORIES = ['KHÁCH GIỜ', 'KHÁCH ĐÊM', 'KHÁCH NGÀY'];

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_shifts',
      description:
        'Tìm danh sách ca trực theo khoảng ngày và/hoặc tên lễ tân. Trả về danh sách rút gọn (không có chi tiết giao dịch/phòng), dùng để tổng hợp theo khoảng thời gian hoặc tìm Id của 1 ca cụ thể để tra chi tiết.',
      parameters: {
        type: 'object',
        properties: {
          fromDate: { type: 'string', description: 'yyyy-MM-dd, để trống nếu không giới hạn' },
          toDate: { type: 'string', description: 'yyyy-MM-dd, để trống nếu không giới hạn' },
          receptionistName: { type: 'string', description: 'Tên lễ tân, để trống nếu không lọc' },
          shiftType: { type: 'string', description: '"Ca ngày" hoặc "Ca đêm", để trống nếu không lọc' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_shift_detail',
      description:
        'Lấy chi tiết đầy đủ 1 ca trực theo Id: danh sách giao dịch, danh sách phòng đã bán, phòng đã checkout, phòng chưa checkout.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Id của ca trực (lấy từ search_shifts)' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_summary',
      description:
        'Lấy số liệu DÒNG TIỀN trong 1 khoảng ngày: tổng tiền mặt và chuyển khoản thực thu (bao gồm cả các khoản không liên quan đến bán phòng như khách đối tiền, trả trước từ ca khác), và tổng tiền bàn giao. KHÔNG dùng tool này để trả lời câu hỏi về "doanh thu bán phòng" - hãy dùng get_room_statistics cho doanh thu bán phòng.',
      parameters: {
        type: 'object',
        properties: {
          fromDate: { type: 'string', description: 'yyyy-MM-dd' },
          toDate: { type: 'string', description: 'yyyy-MM-dd' },
        },
        required: ['fromDate', 'toDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_room_statistics',
      description:
        'Thống kê DOANH THU BÁN PHÒNG (tính từ giá phòng bán ra, KHÔNG phải tiền mặt/chuyển khoản thu được) trong 1 khoảng ngày: mỗi phòng bán được bao nhiêu lần và tổng doanh thu của phòng đó, cùng số lượt bán theo từng loại khách (KHÁCH GIỜ/KHÁCH ĐÊM/KHÁCH NGÀY). Đây là tool ĐÚNG để trả lời mọi câu hỏi về "doanh thu", ví dụ "doanh thu tháng này bao nhiêu", "phòng 402 bán được mấy lần", "doanh thu phòng nào cao nhất", "có bao nhiêu khách giờ/khách ngày/khách đêm". TotalRevenue trong kết quả trả về chính là tổng doanh thu.',
      parameters: {
        type: 'object',
        properties: {
          fromDate: { type: 'string', description: 'yyyy-MM-dd' },
          toDate: { type: 'string', description: 'yyyy-MM-dd' },
          roomNumber: { type: 'string', description: 'Chỉ thống kê 1 phòng cụ thể, để trống nếu lấy tất cả' },
        },
        required: ['fromDate', 'toDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_expenses',
      description:
        'Rà soát và tổng hợp các khoản chi tiêu (nội dung chi tiêu + tiền chi tiêu) trong nhiều ca trực theo khoảng ngày, có thể lọc theo tên lễ tân hoặc từ khóa trong nội dung chi tiêu. Dùng khi cần tổng hợp/báo cáo chi tiêu, tìm khoản chi cụ thể, hoặc kiểm tra khoản chi có được tính vào báo cáo doanh thu không.',
      parameters: {
        type: 'object',
        properties: {
          fromDate: { type: 'string', description: 'yyyy-MM-dd' },
          toDate: { type: 'string', description: 'yyyy-MM-dd' },
          receptionistName: { type: 'string', description: 'Tên lễ tân, để trống nếu không lọc' },
          keyword: {
            type: 'string',
            description: 'Từ khóa tìm trong nội dung chi tiêu, để trống nếu lấy tất cả',
          },
        },
        required: ['fromDate', 'toDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_shift',
      description:
        'Tạo mới 1 báo cáo ca trực. CHỈ gọi khi đã thu thập đủ thông tin bắt buộc qua hội thoại với người dùng (ngày ca, loại ca, giờ bắt đầu/kết thúc, lễ tân giao ca), và đã tóm tắt lại toàn bộ thông tin để người dùng xác nhận đồng ý tạo. Giao dịch/phòng bán có thể để mảng rỗng nếu người dùng chưa cung cấp.',
      parameters: {
        type: 'object',
        properties: {
          shiftDate: { type: 'string', description: 'yyyy-MM-dd' },
          shiftType: { type: 'string', enum: SHIFT_TYPES },
          startTime: { type: 'string', description: 'ISO datetime, ví dụ 2026-07-22T19:00:00' },
          endTime: { type: 'string', description: 'ISO datetime' },
          receptionistName: { type: 'string', description: 'Tên lễ tân giao ca' },
          receiverName: { type: 'string', description: 'Tên lễ tân nhận ca (không bắt buộc)' },
          transactions: {
            type: 'array',
            description: 'Danh sách giao dịch trong ca, để mảng rỗng nếu chưa có',
            items: {
              type: 'object',
              properties: {
                roomNumber: { type: 'string' },
                invoiceCode: { type: 'string' },
                customerType: { type: 'string', enum: CUSTOMER_TYPES },
                cashAmount: { type: 'number' },
                transferAmount: { type: 'number' },
                prepaidNote: { type: 'string' },
                expenseDescription: { type: 'string' },
                expenseAmount: { type: 'number' },
              },
            },
          },
          roomSales: {
            type: 'array',
            description: 'Danh sách phòng đã bán, để mảng rỗng nếu chưa có',
            items: {
              type: 'object',
              properties: {
                roomNumber: { type: 'string' },
                roomCategory: { type: 'string', enum: ROOM_CATEGORIES },
                unitPrice: { type: 'number' },
              },
              required: ['roomNumber', 'roomCategory', 'unitPrice'],
            },
          },
        },
        required: ['shiftDate', 'shiftType', 'startTime', 'endTime', 'receptionistName'],
      },
    },
  },
];

@Injectable({
  providedIn: 'root',
})
export class AiAssistantService {
  private conversation: any[] = [];

  /** Lịch sử hiển thị, sống xuyên suốt phiên làm việc (không mất khi đóng/mở lại modal). */
  messages: AiChatMessage[] = [this.buildGreeting()];

  /** Phát tín hiệu mỗi khi AI tạo thành công 1 ca trực mới. */
  readonly shiftCreated$ = new Subject<void>();

  constructor(
    private shiftReportService: ShiftReportService,
    private authService: AuthService
  ) {}

  private buildGreeting(): AiChatMessage {
    return {
      role: 'assistant',
      content:
        'Xin chào! Tôi có thể tra cứu ca trực (VD: "Tiền bàn giao ca trước là bao nhiêu?", "Phòng nào chưa checkout ngày 15-07-2026?"), thống kê phòng/khách (VD: "Phòng 402 bán được mấy lần tháng này, doanh thu bao nhiêu?", "Có bao nhiêu khách giờ, khách ngày, khách đêm?"), rà soát chi tiêu (VD: "Tổng chi tiêu tháng này bao nhiêu?") hoặc giúp bạn tạo ca trực mới (VD: "Tạo giúp tôi 1 ca đêm hôm nay, lễ tân Thắng"). Với việc tạo mới, tôi sẽ hỏi thêm thông tin còn thiếu và xác nhận trước khi lưu.',
    };
  }

  /** Xóa toàn bộ lịch sử, bắt đầu cuộc trò chuyện mới. */
  resetConversation(): void {
    this.conversation = [];
    this.messages = [this.buildGreeting()];
  }

  private isRoomCheckedOut(
    roomNumber: string,
    transactions: ShiftReportTransaction[]
  ): boolean {
    return transactions.some(
      t => t.RoomNumber === roomNumber && (t.CustomerType || '').includes('/out')
    );
  }

  private describeShiftDetail(report: ShiftReportResponse): any {
    const occupiedRooms = report.RoomSales.filter(
      sale => !this.isRoomCheckedOut(sale.RoomNumber, report.Transactions)
    ).map(sale => `${sale.RoomNumber} (${sale.RoomCategory})`);

    const checkedOutRooms = report.RoomSales.filter(sale =>
      this.isRoomCheckedOut(sale.RoomNumber, report.Transactions)
    ).map(sale => `${sale.RoomNumber} (${sale.RoomCategory})`);

    return {
      Id: report.Id,
      ShiftDate: report.ShiftDate,
      ShiftType: report.ShiftType,
      StartTime: report.StartTime,
      EndTime: report.EndTime,
      ReceptionistName: report.ReceptionistName,
      ReceiverName: report.ReceiverName,
      TotalCash: report.TotalCash,
      TotalTransfer: report.TotalTransfer,
      TotalExpense: report.TotalExpense,
      HandoverAmount: report.HandoverAmount,
      Transactions: report.Transactions,
      RoomSales: report.RoomSales,
      CheckedOutRooms: checkedOutRooms,
      RoomsNotCheckedOutYet: occupiedRooms,
    };
  }

  private buildCreateShiftDto(args: any): CreateShiftReportDto {
    return {
      ShiftDate: args.shiftDate,
      ShiftType: args.shiftType,
      StartTime: args.startTime,
      EndTime: args.endTime,
      ReceptionistName: args.receptionistName,
      ReceiverName: args.receiverName,
      Transactions: (args.transactions || []).map((t: any, i: number) => ({
        OrderNumber: i + 1,
        RoomNumber: t.roomNumber || '',
        InvoiceCode: t.invoiceCode || '',
        CustomerType: t.customerType || '',
        CashAmount: t.cashAmount ?? undefined,
        TransferAmount: t.transferAmount ?? undefined,
        PrepaidNote: t.prepaidNote || '',
        ExpenseDescription: t.expenseDescription || '',
        ExpenseAmount: t.expenseAmount ?? undefined,
        IsUseExpenseForReportRevenue: true,
      })),
      RoomSales: (args.roomSales || []).map((s: any) => ({
        RoomNumber: s.roomNumber,
        RoomCategory: s.roomCategory,
        UnitPrice: s.unitPrice,
      })),
    };
  }

  private confirmCreateShift(dto: CreateShiftReportDto): boolean {
    const summary = `AI đang chuẩn bị TẠO MỚI 1 báo cáo ca trực:
- Ngày ca: ${dto.ShiftDate}
- Loại ca: ${dto.ShiftType}
- Giờ: ${dto.StartTime} → ${dto.EndTime}
- Lễ tân giao ca: ${dto.ReceptionistName}${dto.ReceiverName ? '\n- Lễ tân nhận ca: ' + dto.ReceiverName : ''}
- Số giao dịch: ${dto.Transactions.length}
- Số phòng bán: ${dto.RoomSales.length}

Xác nhận tạo ca trực này?`;
    return window.confirm(summary);
  }

  private async searchExpenses(args: any): Promise<any> {
    const listResult = await firstValueFrom(
      this.shiftReportService.getAll({
        fromDate: args.fromDate,
        toDate: args.toDate,
        receptionistName: args.receptionistName,
        pageNumber: 1,
        pageSize: 200,
      })
    );

    const details = await Promise.all(
      listResult.Items.map(item =>
        firstValueFrom(this.shiftReportService.getById(item.Id))
      )
    );

    const keyword = (args.keyword || '').toLowerCase().trim();
    const expenses: any[] = [];

    for (const report of details) {
      for (const t of report.Transactions) {
        if (!t.ExpenseAmount && !t.ExpenseDescription) continue;
        if (
          keyword &&
          !(t.ExpenseDescription || '').toLowerCase().includes(keyword)
        ) {
          continue;
        }
        expenses.push({
          ShiftId: report.Id,
          ShiftDate: report.ShiftDate,
          ShiftType: report.ShiftType,
          ReceptionistName: report.ReceptionistName,
          RoomNumber: t.RoomNumber,
          InvoiceCode: t.InvoiceCode,
          ExpenseDescription: t.ExpenseDescription,
          ExpenseAmount: t.ExpenseAmount || 0,
          IsUseExpenseForReportRevenue: t.IsUseExpenseForReportRevenue,
        });
      }
    }

    const totalExpenseAmount = expenses.reduce(
      (sum, e) => sum + e.ExpenseAmount,
      0
    );

    return {
      Count: expenses.length,
      TotalExpenseAmount: totalExpenseAmount,
      Expenses: expenses,
    };
  }

  private async getRoomStatistics(args: any): Promise<any> {
    const listResult = await firstValueFrom(
      this.shiftReportService.getAll({
        fromDate: args.fromDate,
        toDate: args.toDate,
        pageNumber: 1,
        pageSize: 200,
      })
    );

    const details = await Promise.all(
      listResult.Items.map(item =>
        firstValueFrom(this.shiftReportService.getById(item.Id))
      )
    );

    const byRoom = new Map<
      string,
      { RoomNumber: string; TimesSold: number; TotalRevenue: number }
    >();
    const byCategory = new Map<
      string,
      { RoomCategory: string; TimesSold: number; TotalRevenue: number }
    >();

    for (const report of details) {
      for (const sale of report.RoomSales) {
        if (args.roomNumber && sale.RoomNumber !== args.roomNumber) continue;

        const room = byRoom.get(sale.RoomNumber) || {
          RoomNumber: sale.RoomNumber,
          TimesSold: 0,
          TotalRevenue: 0,
        };
        room.TimesSold += 1;
        room.TotalRevenue += sale.UnitPrice || 0;
        byRoom.set(sale.RoomNumber, room);

        const category = byCategory.get(sale.RoomCategory) || {
          RoomCategory: sale.RoomCategory,
          TimesSold: 0,
          TotalRevenue: 0,
        };
        category.TimesSold += 1;
        category.TotalRevenue += sale.UnitPrice || 0;
        byCategory.set(sale.RoomCategory, category);
      }
    }

    const rooms = Array.from(byRoom.values()).sort(
      (a, b) => b.TotalRevenue - a.TotalRevenue
    );
    const categories = Array.from(byCategory.values());

    return {
      ByRoom: rooms,
      ByCategory: categories,
      TotalRoomsSoldCount: rooms.reduce((s, r) => s + r.TimesSold, 0),
      TotalRevenue: rooms.reduce((s, r) => s + r.TotalRevenue, 0),
    };
  }

  private async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'search_shifts': {
        const result = await firstValueFrom(
          this.shiftReportService.getAll({
            fromDate: args.fromDate,
            toDate: args.toDate,
            receptionistName: args.receptionistName,
            shiftType: args.shiftType,
            pageNumber: 1,
            pageSize: 200,
          })
        );
        return result.Items;
      }
      case 'get_shift_detail': {
        const report = await firstValueFrom(
          this.shiftReportService.getById(args.id)
        );
        return this.describeShiftDetail(report);
      }
      case 'get_summary': {
        return firstValueFrom(
          this.shiftReportService.getSummary(args.fromDate, args.toDate)
        );
      }
      case 'get_room_statistics': {
        return this.getRoomStatistics(args);
      }
      case 'search_expenses': {
        return this.searchExpenses(args);
      }
      case 'create_shift': {
        const dto = this.buildCreateShiftDto(args);
        if (!this.confirmCreateShift(dto)) {
          return {
            success: false,
            message: 'Người dùng đã từ chối xác nhận, KHÔNG tạo ca trực.',
          };
        }
        const created = await firstValueFrom(
          this.shiftReportService.create(dto)
        );
        this.shiftCreated$.next();
        return {
          success: true,
          Id: created.Id,
          HandoverAmount: created.HandoverAmount,
        };
      }
      default:
        return { error: `Không có công cụ tên "${name}"` };
    }
  }

  /**
   * Hỏi/nhờ AI thao tác với dữ liệu ca trực. AI tự quyết định gọi công cụ nào
   * (tìm ca, lấy chi tiết, tổng hợp, hoặc tạo ca mới) và giữ ngữ cảnh hội thoại
   * để có thể hỏi lại thông tin còn thiếu trước khi thực hiện.
   */
  askQuestion(question: string): Observable<string> {
    if (!this.authService.isAdminPermission()) {
      return from(
        Promise.resolve(
          'Bạn cần đăng nhập với quyền Admin để dùng trợ lý AI.'
        )
      );
    }

    if (this.conversation.length === 0) {
      const today = format(new Date(), 'yyyy-MM-dd');
      this.conversation.push({
        role: 'system',
        content: `Bạn là trợ lý AI hỗ trợ lễ tân khách sạn quản lý báo cáo ca trực.
Hôm nay là ${today}. Khi cần dữ liệu, hãy gọi công cụ phù hợp thay vì đoán.
Chỉ trả lời/hành động dựa trên dữ liệu công cụ trả về, không bịa thông tin.
Nếu người dùng muốn tạo ca trực mới nhưng chưa cung cấp đủ thông tin (ngày ca, loại ca, giờ bắt đầu/kết thúc, lễ tân giao ca), hãy hỏi lại rõ ràng từng phần còn thiếu trước, sau đó tóm tắt lại toàn bộ và hỏi xác nhận trước khi gọi create_shift.
QUAN TRỌNG - phân biệt 2 khái niệm khác nhau:
- "Doanh thu" (doanh thu bán phòng) = LUÔN dùng tool get_room_statistics (field TotalRevenue). Đây là số tiền phòng bán ra thực tế.
- "Tiền mặt/chuyển khoản/dòng tiền/tiền bàn giao" = dùng tool get_summary. Số này KHÁC doanh thu vì gồm cả các khoản không liên quan đến bán phòng.
Không được dùng get_summary để trả lời câu hỏi về doanh thu.
Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt.`,
      });
    }

    this.conversation.push({ role: 'user', content: question });
    return from(this.runConversation());
  }

  private async runConversation(): Promise<string> {
    const maxSteps = 5;
    for (let step = 0; step < maxSteps; step++) {
      const message = await this.callGroq(this.conversation);
      this.conversation.push(message);

      const toolCalls = message.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        return message.content || '(không có phản hồi)';
      }

      for (const call of toolCalls) {
        let args: any = {};
        try {
          args = JSON.parse(call.function.arguments || '{}');
        } catch {
          args = {};
        }
        // Phòng trường hợp model nhét tham số lẫn vào tên hàm (VD: "get_summary,{...}")
        const toolName = (call.function.name || '').split(/[,({]/)[0].trim();
        const toolResult = await this.executeTool(toolName, args);
        this.conversation.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(toolResult),
        });
      }
    }

    return 'Xin lỗi, câu hỏi này cần tra cứu quá nhiều bước, vui lòng hỏi cụ thể hơn.';
  }

  private async callGroq(messages: any[], retriesLeft = 2): Promise<any> {
    // Gọi qua serverless function proxy (/api/groq-chat) thay vì gọi thẳng Groq -
    // API key thật chỉ nằm trong Environment Variables trên Vercel, không lộ ra bundle JS.
    const res = await fetch('/api/groq-chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: environment.groqModel,
        max_tokens: 1024,
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
        parallel_tool_calls: false,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      // Model đôi khi sinh sai định dạng tool call (VD: nhét tham số vào tên hàm).
      // Thử lại vài lần trước khi báo lỗi cho người dùng.
      if (retriesLeft > 0 && errBody.includes('tool_use_failed')) {
        return this.callGroq(messages, retriesLeft - 1);
      }
      throw new Error(`Groq API lỗi (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message;
  }
}
