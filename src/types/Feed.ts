export enum NewsSource {
    EL_PAIS = 'El País',
    EL_MUNDO = 'El Mundo',
    MANUAL = 'Manual'
  }
  
  export interface IFeed {
    _id?: string;
    title: string;
    description: string;
    url: string;
    source: NewsSource;
    publishedAt: Date;
    imageUrl?: string;
    category?: string;
    isManual: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface ICreateFeedDto {
    title: string;
    description: string;
    url: string;
    source: NewsSource;
    publishedAt?: Date;
    imageUrl?: string;
    category?: string;
    isManual?: boolean;
  }
  
  export interface IUpdateFeedDto {
    title?: string;
    description?: string;
    url?: string;
    source?: NewsSource;
    publishedAt?: Date;
    imageUrl?: string;
    category?: string;
    isManual?: boolean;
  }
  
  export interface IFeedQuery {
    source?: NewsSource;
    page?: number;
    limit?: number;
  }
  
  export interface IPaginatedResponse<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }
  
  export interface IScrapedNews {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    category?: string;
  }