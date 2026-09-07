import type { Request, Response } from "express";
import { Departments } from "../../models/departments/departments.model.ts";
import type { ICreateDepartmentRes, IDepartmentRes } from "../../lib/types/departments.ts";

// get deopartments
export const getAllDepartments = async (
    req: Request,
    res: Response<IDepartmentRes>
) => {
    try {
        console.log("Get all departments request received:", req.query);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(Number(req.query.limit) || 10, 1),
            100
        );

        const skip = (page - 1) * limit;

        const [departments, total] = await Promise.all([
            Departments.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Departments.countDocuments({}),
        ]);

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            message: "Departments fetched successfully",
            data: {
                departments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            },
        });
    } catch (error) {
        console.error("Get all departments error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch departments",
        });
    }
};



// create departments 
export const createDepartment = async (
    req: Request,
    res: Response<ICreateDepartmentRes>
) => {
    try {
        const { name, description, icon } = req.body;

        const department = await Departments.create({
            name,
            description,
            icon,
            isActive: true,
        });

        return res.status(201).json({
            success: true,
            message: "Department created successfully",
            data: {
                department,
            },
        });
    } catch (error) {
        console.error("Create department error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create department",
        });
    }
};