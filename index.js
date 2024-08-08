import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
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
import * as UserTaskController from "./controllers/UserTaskController.js";
import * as BDCandidatesController from "./controllers/BDCandidatesController.js";
import * as BDTasksController from "./controllers/BDTasksController.js";
import * as AdminHomeController from "./controllers/AdminHomeController.js";
import * as BDResultsController from "./controllers/BDResultsController.js";
import multer from "multer";
import cors from "cors";
import Tasks from "./models/Tasks.js";
import UserTasks from "./models/UserTasks.js";
import User from "./models/User.js";
import * as dotenv from "dotenv";
dotenv.config();

mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("DB ok"))
  .catch((err) => console.log("BD error", err));

const app = express();

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, "uploads");
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

app.post("/upload", upload.single("image"), (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});

// MAIN

// Логин
app.post(
  "/auth/login",
  loginValidator,
  handleValidationErrors,
  UserController.login
);

// Регистрация
app.post(
  "/auth/register",
  registerValidator,
  handleValidationErrors,
  UserController.register
);

// USER

//UserHome
// Для составления письма в поддержку
app.get("/user-get-fullname/:user_id", UserController.writeEmail);

//UserProfile
//Переход на страницу пользователя
app.get("/user-get-profile/:user_id", UserController.getProfile);

//Обновление фотографии пользователя
app.patch(
  "/user-patch-profile-avatar/:user_id",
  upload.single("avatar"),
  UserController.updateAvatar
);

//Обновление данных пользователя
app.patch(
  "/user-patch-profile-data/:user_id",
  UserController.updateProfileData
);

//UserTask
//Переход на страницу решения задания
app.get(
  "/user-get-task-info/:user_id/:taskNumber",
  UserTaskController.getTaskInfo
);

//Нажатие кнопки Отправить решение
app.patch(
  "/user-patch-task-load/:user_id/:taskNumber",
  UserTaskController.sendCode
);

//Нажатие кнопки отправки комментария
app.post(
  "/user-post-new-comment/:user_id/:taskNumber",
  UserTaskController.sendComment
);

//ADMIN
//AdminHome
app.get("/admin-get-main-stats", AdminHomeController.getMainStats);

//BDCandidates
app.get("/admin-get-candidates", BDCandidatesController.getCandidates);

app.post(
  "/admin-post-candidates-assign/:user_id",
  BDCandidatesController.assignTasks
);

//BDTasks
//Получение всех задач в БД Tasks
app.get("/admin-get-bd-tasks", BDTasksController.getAllTasks);

//Редактирование задач в БД Tasks
app.patch("/admin-patch-task-edit/:taskNumber", BDTasksController.editTask);

//Удаление задачи из БД Tasks
app.delete("/admin-delete-task/:taskNumber", BDTasksController.deleteTask);

//Добавление задачи в БД Tasks
app.post("/admin-post-task-add/:taskNumber", BDTasksController.addTask);

//BDResults
app.get("/admin-get-solutions", BDResultsController.getSolutions);

// // Редактирование профиля пользователя
// app.put("/user/:id", UserController.editProfile);

// // Получения данных пользователя для отображения в /account
// app.get("/user/:userId", UserController.getUser);

// // Хз что это
// app.get("/auth/me", checkAuth, UserController.getMe);

// // Получение роли пользователя
// app.get("/role", async (req, res) => {
//   try {
//     const user = await User.findOne({ email: req.body.email });
//     if (!user) {
//       return res.status(404).json({ message: "Пользователь не найден" });
//     }

//     res.json(user.role);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Не удалось получить роль пользователя" });
//   }
// });

// // Создание нового задания
// app.post(
//   "/tasks-create",
//   checkAuth,
//   tasksCreateValidator,
//   handleValidationErrors,
//   TasksController.create
// );

// // Редактирование задания в Tasks
// app.put("/tasks/:id", async (req, res) => {
//   const taskId = req.params.id;
//   const updatedTask = req.body; // Тело запроса содержит новые значения полей задания

//   await Tasks.findByIdAndUpdate(taskId, updatedTask)
//     .then(() => {
//       res.status(200).json({ message: "Задание успешно обновлено" });
//     })
//     .catch((error) => {
//       res.status(500).json({ message: "Ошибка при обновлении задания", error });
//     });
// });

// // Удаление задания из БД Tasks
// app.delete("/tasks/:id", async (req, res) => {
//   const taskId = req.params.id;
//   await Tasks.findByIdAndDelete(taskId)
//     .then(() => {
//       res.status(200).json({ message: "Задание успешно удалено" });
//     })
//     .catch((error) => {
//       res.status(500).json({ message: "Ошибка при удалении задания", error });
//     });
// });

// // Получение задания по номеру
// app.get("/tasks", async (req, res) => {
//   try {
//     const tasks = await Tasks.find({}, { taskNumber: 1, taskText: 1 });
//     res.json(tasks);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       message: "Не удалось получить список задач",
//     });
//   }
// });

// // Получение пользователя по fullName????
// app.get("/users", async (req, res) => {
//   try {
//     const users = await User.find({ role: "user" }, { fullName: 1, _id: 0 });
//     res.json(users);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       message: "Не удалось получить список пользователей",
//     });
//   }
// });

// // Получение пользователя по fullName
// app.post("/user-id-by-fullname", async (req, res) => {
//   const { fullName } = req.body;

//   try {
//     const user = await User.findOne({ fullName });
//     if (user) {
//       res.json({ user_id: user._id });
//     } else {
//       res.status(404).json({ message: "Пользователь не найден" });
//     }
//   } catch (error) {
//     console.error("Ошибка при получении user_id:", error);
//     res.status(500).json({ message: "Ошибка при получении user_id" });
//   }
// });

// // Назначение пользователю задания в UserTasks
// app.post("/user-tasks", checkAuth, async (req, res) => {
//   try {
//     const { mark, outputData, codeText, user_id, task_id } = req.body;

//     console.log("Полученные данные:", req.body);

//     const isExist = await UserTasks.findOne({ user_id, task_id });
//     if (!isExist) {
//       // Создание новой записи в таблице UserTasks
//       const newUserTask = new UserTasks({
//         mark,
//         outputData,
//         codeText,
//         user_id,
//         task_id,
//       });

//       // Сохранение записи в базе данных
//       await newUserTask.save();
//       res.status(201).json({ message: "Пользователю назначено задание." });
//     } else {
//       res.json({ message: "Пользователю уже назначено данное задание." });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Ошибка при назначении задания." });
//   }
// });

// // Получение всех заданий из Tasks
// app.get("/tasksAll", async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const tasks = await Tasks.find().exec();
//     res.json(tasks);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Не удалось получить список задач.",
//     });
//   }
// });

// app.get("/task/:taskNumber", async (req, res) => {
//   try {
//     const taskNumber = req.params.taskNumber;
//     const task = await Tasks.findOne({ taskNumber: taskNumber }).exec();

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     res.json(task);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to fetch task" });
//   }
// });

// // Получаение всех заданий из UserTasks по user_id (невыполненные)
// app.get("/all-user-tasks/:id", UserTasksController.getAll);

// // Получение задания из UserTasks по task_id и user_id
// app.get("/user-task/:id/:taskId", UserTasksController.getOne);

// // Сохранение задания по user_id и taskNumber (сохранить)
// app.patch("/user-task-save/:id/:taskNumber", UserTasksController.update);

// // Отправка задания на проверку по user_id и taskNumber (отправить решение)
// app.patch("/user-task-send/:id/:taskNumber", UserTasksController.send);

// // Получение done по user_id и taskNumber (для кнопОЧКИ)
// app.get("/user-task-getDone/:id/:taskNumber", UserTasksController.getDone);

// // Получение кода при загрузке страницы
// app.get("/user-taskk/:id/:taskNumber", UserTasksController.getCode);

// // РЕЗУЛЬТАТЫ (User)
// // Получение всех заданий из UserTasks по user_id (выполненные)
// app.get("/get-done-tasks/:userId", UserTasksController.getAllDone);

// // Получение выполненного задания из UserTasks по user_id  и taskNumber
// app.get("/get-result-data/:userId/:taskNumber", UserTasksController.getResult);

// // Отправка комментрия пользователем по user_id и taskNumber
// app.patch(
//   "/user-task-comment/:userId/:taskNumber",
//   UserTasksController.commentUser
// );

// // РЕЗУЛЬТАТЫ (Admin)
// // Получение всех выполненных заданий для админа
// app.get("/get-result-admin", UserTasksController.getAllResult);

// // Получение задания для оценивания админом по user_id и taskNumber
// app.get(
//   "/get-result-data-admin/:userId/:taskNumber",
//   UserTasksController.getResult
// );

// // Оценивание задания админом по user_id и taskNumber
// app.patch("/set-mark/:userId/:taskNumber", UserTasksController.setMark);

// // Комментирование задания админом по user_id и taskNumber
// app.patch(
//   "/comment-admin/:userId/:taskNumber",
//   UserTasksController.commentAdmin
// );

// // Отправка отчета
// app.get("/make-report", UserTasksController.makeReport);

// // Создание нового userTask
// app.post(
//   "/user-tasks2",
//   checkAuth,
//   userTasksCreateValidator,
//   handleValidationErrors,
//   UserTasksController.create
// );

// // Получение заданий из UserTasks по которым есть mark
// app.get("/user-tasks-with-mark/:id", UserTasksController.getAllWithMark);

app.listen(process.env.PORT || 4445, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log("Server is working on port ", process.env.PORT);
});
