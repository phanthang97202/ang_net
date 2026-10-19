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
