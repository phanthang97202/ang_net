export interface PersonalNoteSummary {
  NoteId: string;
  Title: string;
  Preview: string;
  Version: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface PersonalNote extends PersonalNoteSummary {
  ContentJson: string;
  PublicToken?: string | null;
  PublishedAt?: string | null;
  EditToken?: string | null;
}

export interface PublicPersonalNote {
  Title: string;
  ContentJson: string;
}

export interface SharedPersonalNote extends PublicPersonalNote {
  Version: number;
}

export interface PersonalNotePublish extends PersonalNoteSave {
  AllowEditing?: boolean;
}

export interface PersonalNotePage {
  DataList: PersonalNoteSummary[];
  HasMore: boolean;
  NextCursor: string | null;
}

export interface PersonalNoteSave {
  Title: string;
  ContentJson: string;
  Version: number;
}
