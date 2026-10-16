export interface BlogNotification {
  NotificationId: string;
  ActorName: string;
  ActorAvatar: string | null;
  NewsId: string;
  CategoryNewsId: string;
  CommentId: string;
  Kind: 'CommentOnPost' | 'Reply';
  Title: string;
  TitleEn: string | null;
  Excerpt: string;
  CreatedAt: string;
  ReadAt: string | null;
}

export interface BlogNotificationPage {
  DataList: BlogNotification[];
  NextCursor: string | null;
  HasMore: boolean;
  SnapshotAt: string;
  UnreadCount: number;
}
