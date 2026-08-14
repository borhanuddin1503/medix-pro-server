import express, { type Express, type Request, type Response } from 'express';
import { envConfig } from './lib/env-config.ts';
import cors from 'cors'
import dbConnect from './lib/dbConnect.ts';
import authRoutes from './routes/auth.routes.ts'
import doctorApplyRoutes from './routes/doctor.route.ts'
import appoinments from './routes/appoinments.route.ts'
import payments from './routes/payment.route.ts'
import dashboard from './routes/admin.routes.ts'
envConfig();

const app: Express = express();
const port: number = 8000;

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))
app.use(express.json());

await dbConnect();


// auth routes
app.use('/auth', authRoutes);

// dotors routes
app.use("/api/doctors", doctorApplyRoutes);

// appoinments routes
app.use("/api/appointments", appoinments);

// payment routes
app.use("/api/payments", payments)


// dashboard routes
app.use("/api" , dashboard)


app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});