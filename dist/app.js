import express from "express";
import { config } from "dotenv";
import createHttpError from "http-errors";
import swaggerUi from 'swagger-ui-express';
import logger from 'morgan';
import router from "./routes/index.js";
import { specs } from "./Documentation/swagger.js";
config();
const app = express();
const port = Number(process.env.Port) || 8080;
app.use(logger("dev"));
// app.use(logger(':method :url :status :res[content-length] - :response-time ms :user-agent'));
//middlewares
app.use(express.json());
app.disable('x-powered-by');
app.get("/", (req, res, next) => {
    res.send("car hub api");
});
app.use(router);
//swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use("*", (req, res, next) => {
    // Simulate a 404 error
    next(new createHttpError.NotFound(`The requested resource ${req.originalUrl} does not exist`));
});
const handleErrors = (err, req, res, next) => {
    console.error(err.stack);
    res
        .status(err.status || 500)
        .json({ error: err.message || "something went wrong" });
};
app.use(handleErrors);
const start = async (url, port) => {
    try {
        // await connectToDatabase(url);
        app.listen(port, () => {
            console.log(`server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error("error", error);
        process.exit(1);
    }
};
start(process.env.MONGO_URL || "", port);
//# sourceMappingURL=app.js.map