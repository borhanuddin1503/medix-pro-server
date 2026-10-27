import type { Request, Response } from "express";
import Report from "../../models/reports/report.model.ts";
import type { ICreateReportResponse, IGetReportsResponse } from "../../lib/types/reports.ts";

export const createReport = async (
    req: Request,
    res: Response<ICreateReportResponse>
) => {
    try {
        const {
            name,
            image,
            doctorId,
            appointmentId,
            reportType,
            description,
            result,
            remarks,
            status,
            testDate,
            reportDate,
        } = req.body;


        console.log("Request body:", req.body);

        if (
            !name ||
            !image ||
            !doctorId ||
            !appointmentId ||
            !reportType ||
            !testDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
            });
        }

        const report = await Report.create({
            name,
            image,
            doctorId,
            appointmentId,
            reportType,
            description,
            result,
            remarks,
            status: status || "PENDING",
            testDate,
            reportDate,
        });

        console.log("Report created:", report);

        return res.status(201).json({
            success: true,
            message: "Report created successfully",
            data: report,
        });
    } catch (error) {
        console.error("Create report error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create report",
        });
    }
};




export const getReports = async (req: Request, res: Response<IGetReportsResponse>) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(
            100,
            Math.max(1, Number(req.query.limit) || 10)
        );
        const search = req.query.search ? String(req.query.search) : "";

        const skip = (page - 1) * limit;

        const [reports, total] = await Promise.all([
            Report.find({ name: { $regex: search, $options: "i" } })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Report.countDocuments(),
        ]);

        return res.status(200).json({
            success: true,
            message: "Reports fetched successfully",
            data: {
                reports,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error("Failed to fetch reports:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch reports",
        });
    }
};
