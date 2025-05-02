import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  ChatService,
  AuthService,
  ShowErrorService,
  CloudinaryService,
} from '../../services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { IChat, TypeMessage } from '../../interfaces';
import { NzModalModule } from 'ng-zorro-antd/modal';
@Component({
  selector: 'chat-box',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzIconModule,
    NzCommentModule,
    NzAvatarModule,
    NzButtonModule,
    NzUploadModule,
    NzModalModule,
  ],
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent implements OnInit, AfterViewChecked {
  chatService = inject(ChatService);
  detailUser = inject(AuthService);
  cloudinary = inject(CloudinaryService);
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  constructor(private cdref: ChangeDetectorRef) {}
  showErrorService = inject(ShowErrorService);

  pageIndex: number = 0;
  pageSize: number = 5;
  itemCount: number = 0;
  public loadingMessages: boolean = false;

  public messages: IChat[] = [];
  public newMessage: string = '';
  public typeMessage: TypeMessage = 'string';
  public userId: string = this.detailUser.getAccountInfo().email!;

  ngOnInit(): void {
    this.chatService.getMessage(this.pageIndex, this.pageSize).subscribe({
      next: res => {
        this.messages = [...this.messages, ...res.objResult.DataList];
        this.itemCount = res.objResult.ItemCount;
        return res.objResult.DataList;
      },
      error: err => {
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
        throw new Error(err);
      },
    });

    this.chatService.startConnection();
    this.chatService.onMessageReceived((userId, message, type) => {
      this.messages.push({
        UserId: userId,
        Message: message,
        MessageId: '',
        Type: type,
        CreatedDTime: new Date(),
      });
    });
  }

  sendMessage() {
    if (!this.newMessage) {
      return;
    }
    this.chatService.sendMessage(
      this.userId,
      this.newMessage,
      this.newMessage.toString().includes('jpg') ? 'jpg' : 'string'
    );
    this.newMessage = '';
    this.typeMessage = 'string';
  }

  handleUploadFile = (file: any) => {
    // debugger;
    // Upload to Cloudinary

    this.cloudinary.uploadImage(file).subscribe({
      next: (res: any) => {
        this.newMessage = res.url;
      },
      error: err => {},
    });
    return false; // Prevent default behavior
  };

  // fix delay dom
  ngAfterViewChecked() {
    this.cdref.detectChanges();
  }

  onScroll() {
    const element = this.chatContainer.nativeElement;
    if (
      element.scrollTop === 0 &&
      !this.loadingMessages &&
      this.pageIndex < this.itemCount / this.pageSize
    ) {
      this.loadMessages();
    }
  }

  loadMessages() {
    this.loadingMessages = true;
    const oldScrollHeight = this.chatContainer.nativeElement.scrollHeight;

    this.chatService.getMessage(this.pageIndex + 1, this.pageSize).subscribe({
      next: res => {
        this.messages = [...res.objResult.DataList, ...this.messages];
        this.pageIndex += 1;
        this.loadingMessages = false;

        setTimeout(() => {
          const newScrollHeight = this.chatContainer.nativeElement.scrollHeight;
          this.chatContainer.nativeElement.scrollTop =
            newScrollHeight - oldScrollHeight;
        }, 0); // Delay to allow DOM to update
      },
      error: err => {
        console.error('Error loading messages:', err);
        this.loadingMessages = false;
      },
    });
  }

  ///

  fileList: any[] = [];
  previewImage: string | undefined = '';
  previewVisible = false;

  handlePreview = async (file: any): Promise<void> => {
    if (!file.url && !file.preview) {
      // file.preview = await getBase64(file.originFileObj!);
    }
    this.previewImage = file.url || file.preview;
    this.previewVisible = true;
  };
}
