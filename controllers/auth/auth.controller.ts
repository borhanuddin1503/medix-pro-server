import type { Request, Response } from "express";
import { createAuth } from "../../lib/auth.ts";

export async function whoMe(req: Request, res: Response) {
    try {
        const auth = createAuth();

        const headers = new Headers();

        Object.entries(req.headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((v) => headers.append(key, v));
            } else if (value !== undefined) {
                headers.set(key, value);
            }
        });

        console.log(req.headers)

        const session = await auth.api.getSession({
            headers: headers,
        });

        console.log(session)

        if (!session) {
            return res.status(401).json({
                isSuccess: false,
                message: "Unauthorized",
            });
        }

        return res.json({
            isSuccess: true,
            user: session.user
        });
    } catch (error) {
        return res.status(500).send({
            message: 'Internel Server Error'
        })
    }
}