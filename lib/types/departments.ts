import type mongoose from "mongoose";

export interface IDepartment {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IdepartmentPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}


export interface IDepartmentRes {
    success: boolean;
    message: string;
    data?: {
        departments: IDepartment[];
        pagination: IdepartmentPagination;
    }
}
export interface IDepartmentUpdateRes {
    success: boolean;
    message: string;
    data?: {
        department: IDepartment;
    }
}

export interface ICreateDepartmentRes {
    success: boolean;
    message: string;
    data?: {
        department: IDepartment;
    }
}


export interface IDeleteDepartmentRes {
    success: boolean;
    message: string;
    data?: {
        departmentId: string;
    };
}