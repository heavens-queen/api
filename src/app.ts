import express, {
    Application,
    Request,
    Response,
    NextFunction,
    ErrorRequestHandler,
  } from "express";
  import { config } from "dotenv";
  import createHttpError from "http-errors";
  import connectToDatabase from "./db/index.js";

  import logger from 'morgan';
import router from "./routes/index.js";

  config();
  
  const app: Application = express();
  const port: number = Number(process.env.Port) || 8080;
  
  app.use(logger("dev"));
  // app.use(logger(':method :url :status :res[content-length] - :response-time ms :user-agent'));
  //middlewares
  app.use(express.json());
  
  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.send("car hub api");
  });
  app.use(router);
  app.use("*", (req: Request, res: Response, next: NextFunction) => {
    // Simulate a 404 error
    next(
      new createHttpError.NotFound(
        `The requested resource ${req.originalUrl} does not exist`
      )
    );
  });
  
  
  const handleErrors: ErrorRequestHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.error(err.stack);
    res
      .status(err.status || 500)
      .json({ error: err.message || "something went wrong" });
  };
  app.use(handleErrors);
  
  const start = async (url: string, port: number) => {
    try {
      await connectToDatabase(url);
      app.listen(port, () => {
        console.log(`server is running on port ${port}`);
      });
    } catch (error) {
      console.error("error", error);
      process.exit(1);
    }
  };
  start(process.env.MONGO_URL || "", port);