export interface IMovieLibraryItem {
  Slug: string;
  Title: string;
  OriginalTitle: string;
  PosterUrl: string;
  BannerUrl: string;
  Year: number;
  EpisodeStatus: string;
  Quality: string;
  Language: string;
}

export interface IMovieLibraryCatalog {
  Items: IMovieLibraryItem[];
  Page: number;
  TotalPages: number;
  TotalItems: number;
}

export interface IMovieLibraryEpisode {
  Slug: string;
  Name: string;
  HasSource: boolean;
}

export interface IMovieLibraryServer {
  Id: number;
  Name: string;
  Episodes: IMovieLibraryEpisode[];
}

export interface IMovieLibraryDetail extends IMovieLibraryItem {
  Description: string;
  Genres: string[];
  Servers: IMovieLibraryServer[];
}

export interface IMovieLibraryPlayback {
  Title: string;
  Url: string;
  EmbedUrl: string;
}
