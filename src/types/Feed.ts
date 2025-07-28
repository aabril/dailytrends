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
    createdAt?: Date;
    updatedAt?: Date;
}
