import type { Types } from "mongoose";

export interface ILab {
    _id: Types.ObjectId;
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;

    images: string[];
    services: string[];

    openingTime?: string;
    closingTime?: string;

    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}


export interface ILabPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}


export interface ILabRes {
    success: boolean;
    message: string;
    data?: {
        labs: ILab[];
        pagination: ILabPagination;
    }
}


export interface ILabCreateRes {
    success: boolean;
    message: string;
    data?: {
        lab: ILab;
    }
}

export interface ILabDeleteRes {
    success: boolean,
    message: string,
    data?: {
        labId: string,
    },
}