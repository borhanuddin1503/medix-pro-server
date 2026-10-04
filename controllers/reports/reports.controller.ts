import type { Request, Response } from "express";
import Report from "../../models/reports/report.model.ts";

export const createReport = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            name,
            image,
            doctorId,
            patientId,
            labId,
            appointmentId,
            reportType,
            description,
            result,
            remarks,
            status,
            testDate,
            reportDate,
        } = req.body;

        if (
            !name ||
            !image ||
            !doctorId ||
            !patientId ||
            !labId ||
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
            patientId,
            labId,
            appointmentId,
            reportType,
            description,
            result,
            remarks,
            status: status || "PENDING",
            testDate,
            reportDate,
            technologistId: req.user?._id,
        });

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