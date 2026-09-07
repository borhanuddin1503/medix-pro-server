import type { Request, Response } from "express";
import { Departments } from "../../models/departments/departments.model.ts";
import type { ICreateDepartmentRes, IDeleteDepartmentRes, IDepartmentRes, IDepartmentUpdateRes } from "../../lib/types/departments.ts";

// get deopartments
export const getAllDepartments = async (
    req: Request,
    res: Response<IDepartmentRes>
) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(Number(req.query.limit) || 10, 1),
            100
        );
        const searchValue = req.query.search as string || "";

        const skip = (page - 1) * limit;

        const [departments, total] = await Promise.all([
            Departments.find({
                $or: [
                    { name: { $regex: searchValue, $options: "i" } },
                    { description: { $regex: searchValue, $options: "i" } },
                ],
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Departments.countDocuments({
                $or: [
                    { name: { $regex: searchValue, $options: "i" } },
                    { description: { $regex: searchValue, $options: "i" } },
                ],
            }),
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



// update departments
export const updateDepartment = async (
    req: Request,
    res: Response<IDepartmentUpdateRes>
) => {
    try {
        const { _id } = req.params;
        const { name, description, icon } = req.body;

        const department = await Departments.findById(
            _id
        );

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found",
            });
        }

        // Update only provided fields
        if (name !== undefined) {
            department.name = name.trim();
        }

        if (description !== undefined) {
            department.description = description.trim();
        }

        if (icon !== undefined) {
            department.icon = icon;
        }

        await department.save();

        return res.status(200).json({
            success: true,
            message: "Department updated successfully",
            data: {
                department,
            },
        });
    } catch (error) {
        console.error("Update department error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update department",
        });
    }
};



// delete departments
export const deleteDepartment = async (
    req: Request<{ _id: string }>,
    res: Response<IDeleteDepartmentRes>
) => {
    try {
        const { _id } = req.params;

        console.log("Deleting department with ID:", _id);

        const department =
            await Departments.findById(_id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found",
            });
        }

        await Departments.findByIdAndDelete(
            _id
        );

        return res.status(200).json({
            success: true,
            message: "Department deleted successfully",
            data: {
                departmentId: _id,
            },
        });
    } catch (error) {
        console.error(
            "Delete department error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete department",
        });
    }
};

