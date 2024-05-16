import express from "express";
import mongoose from "mongoose";
import {
  registerValidator,
  userTasksCreateValidator,
  loginValidator,
  tasksCreateValidator,
} from "./validations/auth.js";
import checkAuth from "./utils/checkAuth.js";
import handleValidationErrors from "./utils/handleValidationErrors.js";
import * as UserController from "./controllers/UserController.js";
import * as UserTasksController from "./controllers/UserTasksController.js";
import * as TasksController from "./controllers/TasksController.js";
import multer from "multer";
import cors from "cors";

mongoose
  .connect(
    "mongodb+srv://alexykoba:u0PQW4fxB2mHUtb9@cluster0.rpznl0k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("DB ok"))
  .catch((err) => console.log("BD error", err));

const app = express();

// const storage = multer.diskStorage({
//   destination: (_, __, cb) => {
//     cb(null, "uploads");
//   },
//   filename: (_, file, cb) => {
//     cb(null, file.originalname);
//   },
// });

//const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

app.post(
  "/auth/login",
  loginValidator,
  handleValidationErrors,
  UserController.login
);
app.post(
  "/auth/register",
  registerValidator,
  handleValidationErrors,
  UserController.register
);
app.get("/auth/me", checkAuth, UserController.getMe);

app.post(
  "/tasks",
  checkAuth,
  tasksCreateValidator,
  handleValidationErrors,
  TasksController.create
);

app.post(
  "/user-tasks",
  checkAuth,
  userTasksCreateValidator,
  handleValidationErrors,
  UserTasksController.create
);

app.listen(4444, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log("Server is working");
});
