import { IBaseResponse } from './common';

export interface IAnimeSearchItem {
  AniListId: number;
  Title: string;
  NativeTitle: string;
  CoverImageUrl: string;
  BannerImageUrl: string;
  Format: string;
  Status: string;
  ReleaseYear: number | null;
  EpisodeCount: number | null;
  AverageScore: number | null;
}

export interface IAnimeEpisode {
  EpisodeNumber: number;
  Title: string;
  ThumbnailUrl: string;
  DurationSeconds: number | null;
  HasSource: boolean;
}

export interface IAnimeDetail extends IAnimeSearchItem {
  Description: string;
  Genres: string[];
  Episodes: IAnimeEpisode[];
}

export interface IAnimePlayback {
  AniListId: number;
  EpisodeNumber: number;
  Title: string;
  Provider: string;
  Url: string;
  IsEmbed: boolean;
  MimeType: string;
}

export interface IAnimeAdminCatalog extends IAnimeSearchItem {
  AnimeId: string;
  StoredEpisodeCount: number;
  PlayableEpisodeCount: number;
  FlagActive: boolean;
  UpdatedDTime: Date;
}

export interface IAnimeSource {
  SourceId: string;
  Provider: 'youtube' | 'mp4' | 'hls';
  SourceValue: string;
  Quality: string;
  Language: string;
  Priority: number;
  FlagActive: boolean;
}

export interface IAnimeAdminEpisode {
  EpisodeId: string;
  EpisodeNumber: number;
  Title: string;
  ThumbnailUrl: string;
  DurationSeconds: number | null;
  FlagActive: boolean;
  Sources: IAnimeSource[];
}

export interface IAnimeSourceSave {
  SourceId: string;
  AniListId: number;
  EpisodeNumber: number;
  EpisodeTitle: string;
  Provider: 'youtube' | 'mp4' | 'hls';
  SourceValue: string;
  Quality: string;
  Language: string;
  Priority: number;
  FlagActive: boolean;
}

export interface IAnimeSearchResponse
  extends IBaseResponse<IAnimeSearchItem> {}

export interface IAnimeDetailResponse extends IBaseResponse<IAnimeDetail> {}

export interface IAnimePlaybackResponse
  extends IBaseResponse<IAnimePlayback> {}

export interface IAnimeAdminCatalogResponse
  extends IBaseResponse<IAnimeAdminCatalog> {}

export interface IAnimeAdminEpisodeResponse
  extends IBaseResponse<IAnimeAdminEpisode> {}

export interface IAnimeSourceResponse extends IBaseResponse<IAnimeSource> {}

export interface IAnimeDeleteResponse extends IBaseResponse<boolean> {}
