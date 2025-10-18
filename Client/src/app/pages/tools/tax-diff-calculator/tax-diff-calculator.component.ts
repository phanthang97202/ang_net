import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-tax-diff-calculator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzFormModule,

    NzInputModule,
    NzButtonModule,
    NzGridModule,
  ],
  templateUrl: './tax-diff-calculator.component.html',
  styleUrls: ['./tax-diff-calculator.component.scss'],
})
export class TaxDiffCalculatorComponent {
  realGross: number | null = null;
  invoiceGross: number | null = null;
  vatRate = 8;
  corpRate = 15;
  result = '';

  calculate(): void {
    if (!this.realGross || !this.invoiceGross) {
      this.result = '👉 Vui lòng nhập đủ các giá trị';
      return;
    }

    const vatRate = this.vatRate / 100;
    const corpRate = this.corpRate / 100;

    const realNet = this.realGross / (1 + vatRate);
    const realVat = this.realGross - realNet;

    const invoiceNet = this.invoiceGross / (1 + vatRate);
    const invoiceVat = this.invoiceGross - invoiceNet;

    const diffNet = invoiceNet - realNet;
    const diffVat = invoiceVat - realVat;
    const diffCorpTax = diffNet * corpRate;
    const totalLoss = diffVat + diffCorpTax;

    this.result = `
👉 Trường hợp thực tế (Gross ${this.realGross.toLocaleString()}đ):
   - Net: ${realNet.toFixed(0)}đ
   - VAT: ${realVat.toFixed(0)}đ

👉 Trường hợp xuất HĐ ${this.invoiceGross.toLocaleString()}đ:
   - Net: ${invoiceNet.toFixed(0)}đ
   - VAT: ${invoiceVat.toFixed(0)}đ

📊 Chênh lệch:
   - Doanh thu net tăng: ${diffNet.toFixed(0)}đ
   - VAT tăng: ${diffVat.toFixed(0)}đ
   - Thuế TNDN tăng: ${diffCorpTax.toFixed(0)}đ
   - 👉 Tổng thiệt hại (KS chịu nếu KH chỉ trả ${this.realGross.toLocaleString()}đ): ${totalLoss.toFixed(0)}đ
`;
  }
}
