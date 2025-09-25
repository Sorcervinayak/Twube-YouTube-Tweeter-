// import express from "express"
// import cookieParser from "cookie-parser"
// import cors from "cors"
// import userRouter from "./routes/user.routes.js"

// const app = express()

// app.use(cors())//basically what happens browser denies the requests that are coming from the frontend to the backend 
// //due to the different origins ,then CORS comes into action that it gives the properties that allows from which
// //origins the request should be allowed , this will work for the backend.

// //Also there is PROXY in the frontend ,to not let the browwser directly talk with the backend,what proxy does is
// //it pretends that frontend calling its own server and that server forwards the request to the backend.

// app.use(express.json({limit:"16kb"}))//this will accepts the form data
// app.use(express.urlencoded({extended:true,limit:"16kb"}))//this will accepts the data from url

// app.use(express.static("public"))//this is used to store the static files inside the folder public for storing on
// //the server
// app.use(express.cookieParser())

// //Route initialize
// app.use("/api/v1/users",userRouter)


import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js"
import commentRouter from "./routes/comment.routes.js"

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser()); // Fixed: use cookieParser() directly

// Routes
app.use("/api/v1/users", userRouter);
app.use("api/v1/comments",commentRouter)

export default app;

