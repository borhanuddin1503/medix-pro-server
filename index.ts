import express, { type Express, type Request, type Response } from 'express';
import { envConfig } from './lib/env-config.ts';
import cors from 'cors'
import dbConnect from './lib/dbConnect.ts';
import { toNodeHandler } from 'better-auth/node';
import { createAuth } from './lib/auth.ts';
import authRoutes from './routes/auth.routes.ts'
import doctorApplyRoutes from './routes/doctor.route.ts'
envConfig();

const app: Express = express();
const port: number = 8000;

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))
app.use(express.json());

await dbConnect();
const auth = createAuth();
app.all('/api/auth/{*any}', toNodeHandler(auth));


// auth routes
app.use('/auth', authRoutes);

// dotors routes
app.use("/api/doctors/apply", doctorApplyRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});