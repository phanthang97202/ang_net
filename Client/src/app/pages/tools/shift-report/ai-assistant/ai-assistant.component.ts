import { Component, ElementRef, ViewChild } from '@angular/core';
import { AiAssistantService } from '../services/ai-assistant.service';

@Component({
  selector: 'app-ai-assistant',
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss'],
})
export class AiAssistantComponent {
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  question = '';
  isLoading = false;

  constructor(public aiAssistantService: AiAssistantService) {}

  get messages() {
    return this.aiAssistantService.messages;
  }

  send(): void {
    const trimmed = this.question.trim();
    if (!trimmed || this.isLoading) return;

    this.messages.push({ role: 'user', content: trimmed });
    this.question = '';
    this.isLoading = true;
    this.scrollToBottomSoon();

    this.aiAssistantService.askQuestion(trimmed).subscribe({
      next: answer => {
        this.messages.push({ role: 'assistant', content: answer });
        this.isLoading = false;
        this.scrollToBottomSoon();
      },
      error: err => {
        this.messages.push({
          role: 'assistant',
          content: 'Xin lỗi, có lỗi xảy ra khi hỏi trợ lý AI: ' + err.message,
        });
        this.isLoading = false;
        this.scrollToBottomSoon();
      },
    });
  }

  newConversation(): void {
    this.aiAssistantService.resetConversation();
  }

  private scrollToBottomSoon(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        const el = this.chatContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
