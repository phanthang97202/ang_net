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

export interface IAnimeSearchResponse
  extends IBaseResponse<IAnimeSearchItem> {}

export interface IAnimeDetailResponse extends IBaseResponse<IAnimeDetail> {}

export interface IAnimePlaybackResponse
  extends IBaseResponse<IAnimePlayback> {}
