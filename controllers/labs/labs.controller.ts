import type { Request, Response } from "express";
import Lab from "../../models/labs/labs.model.ts";
import type { ILabCreateRes, ILabDeleteRes, ILabRes } from "../../lib/types/labs.ts";

// get all labs
export const getAllLabs = async (req: Request, res: Response<ILabRes>) => {
    try {
        // Pagination
        const page = Math.max(
            1,
            Number.parseInt(req.query.page as string) || 1
        );

        const limit = Math.min(
            50,
            Math.max(
                1,
                Number.parseInt(req.query.limit as string) || 10
            )
        );

        const skip = (page - 1) * limit;

        // =========================
        // Search
        // =========================

        const search =
            typeof req.query.search === "string"
                ? req.query.search.trim()
                : "";

        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                {
                    name: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    address: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    phone: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }


        // =========================
        // Get Labs + Total
        // =========================

        const [labs, total] = await Promise.all([
            Lab.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),

            Lab.countDocuments(query),
        ]);

        // =========================
        // Pagination
        // =========================

        const totalPages = Math.ceil(total / limit);

        // =========================
        // Response
        // =========================

        return res.status(200).json({
            success: true,
            message: "Labs fetched successfully",
            data: {
                labs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            },
        });
    } catch (error) {
        console.error("Get all labs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch labs",
        });
    }
};


// create lab 
export const addLab = async (req: Request, res: Response<ILabCreateRes>) => {
    try {
        const {
            name,
            description,
            address,
            phone,
            email,
            images,
            services,
            openingTime,
            closingTime,
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Lab name is required",
            });
        }

        const lab = await Lab.create({
            name,
            description,
            address,
            phone,
            email,
            images,
            services,
            openingTime,
            closingTime,
        });

        return res.status(201).json({
            success: true,
            message: "Lab added successfully",
            data: {
                lab,
            },
        });
    } catch (error) {
        console.error("Add lab error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add lab",
        });
    }
};


// delete lab

export const deleteLab = async (
    req: Request<{ id: string }>,
    res: Response<ILabDeleteRes>
) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Lab ID is required",
            });
        }

        const lab = await Lab.findById(id);

        if (!lab) {
            return res.status(404).json({
                success: false,
                message: "Lab not found",
            });
        }

        await Lab.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Lab deleted successfully",
            data: {
                labId: id,
            },
        });
    } catch (error) {
        console.error("Delete lab error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete lab",
        });
    }
};