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

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// USER

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

// Редактирование профиля пользователя
app.put("/user/:id", UserController.editProfile);

// Получения данных пользователя для отображения в /account
app.get("/user/:userId", UserController.getUser);

// Хз что это
app.get("/auth/me", checkAuth, UserController.getMe);

// Получение роли пользователя
app.get("/role", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.json(user.role);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Не удалось получить роль пользователя" });
  }
});

// Создание нового задания
app.post(
  "/tasks-create",
  checkAuth,
  tasksCreateValidator,
  handleValidationErrors,
  TasksController.create
);

// Редактирование задания в Tasks
app.put("/tasks/:id", async (req, res) => {
  const taskId = req.params.id;
  const updatedTask = req.body; // Тело запроса содержит новые значения полей задания

  await Tasks.findByIdAndUpdate(taskId, updatedTask)
    .then(() => {
      res.status(200).json({ message: "Задание успешно обновлено" });
    })
    .catch((error) => {
      res.status(500).json({ message: "Ошибка при обновлении задания", error });
    });
});

// Удаление задания из БД Tasks
app.delete("/tasks/:id", async (req, res) => {
  const taskId = req.params.id;
  await Tasks.findByIdAndDelete(taskId)
    .then(() => {
      res.status(200).json({ message: "Задание успешно удалено" });
    })
    .catch((error) => {
      res.status(500).json({ message: "Ошибка при удалении задания", error });
    });
});

// Получение задания по номеру
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Tasks.find({}, { taskNumber: 1, taskText: 1 });
    res.json(tasks);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось получить список задач",
    });
  }
});

// Получение пользователя по fullName????
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: "user" }, { fullName: 1, _id: 0 });
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось получить список пользователей",
    });
  }
});

// Получение пользователя по fullName
app.post("/user-id-by-fullname", async (req, res) => {
  const { fullName } = req.body;

  try {
    const user = await User.findOne({ fullName });
    if (user) {
      res.json({ user_id: user._id });
    } else {
      res.status(404).json({ message: "Пользователь не найден" });
    }
  } catch (error) {
    console.error("Ошибка при получении user_id:", error);
    res.status(500).json({ message: "Ошибка при получении user_id" });
  }
});

// Это что такое....
app.post("/user-tasks", checkAuth, async (req, res) => {
  try {
    const { mark, outputData, codeText, user_id, task_id } = req.body;

    console.log("Полученные данные:", req.body);

    // Создание новой записи в таблице UserTasks
    const newUserTask = new UserTasks({
      mark,
      outputData,
      codeText,
      user_id,
      task_id,
    });

    // Сохранение записи в базе данных
    await newUserTask.save();

    res.status(201).json({ message: "Запись успешно создана" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при создании записи" });
  }
});
// app.post("/user-tasks", checkAuth,
// async (req, res) => {
//   try {
//     const { mark, outputData, codeText, user_id, task_id } = req.body;

//     // Создание новой записи в таблице UserTasks
//     const newUserTask = new UserTasks({
//       mark,
//       outputData,
//       codeText,
//       user_id,
//       task_id,
//     });

//     // Сохранение записи в базе данных
//     await newUserTask.save();

//     res.status(201).json({ message: "Запись успешно создана" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Ошибка при создании записи" });
//   }
// }
// );

// Получение всех заданий из Tasks
app.get("/tasksAll", async (req, res) => {
  try {
    const userId = req.params.id;
    const tasks = await Tasks.find().exec();
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить список задач.",
    });
  }
});

app.get("/task/:taskNumber", async (req, res) => {
  try {
    const taskNumber = req.params.taskNumber;
    const task = await Tasks.findOne({ taskNumber: taskNumber }).exec();

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch task" });
  }
});

// Получаение всех заданий из UserTasks по user_id (невыполненные)
app.get("/all-user-tasks/:id", UserTasksController.getAll);

// Получение задания из UserTasks по task_id и user_id
app.get("/user-task/:id/:taskId", UserTasksController.getOne);

// Сохранение задания по user_id и taskNumber (сохранить)
app.patch("/user-task-save/:id/:taskNumber", UserTasksController.update);

// Отправка задания на проверку по user_id и taskNumber (отправить решение)
app.patch("/user-task-send/:id/:taskNumber", UserTasksController.send);

// Получение done по user_id и taskNumber (для кнопОЧКИ)
app.get("/user-task-getDone/:id/:taskNumber", UserTasksController.getDone);

// Получение кода при загрузке страницы
app.get("/user-taskk/:id/:taskNumber", UserTasksController.getCode);

// РЕЗУЛЬТАТЫ (User)
// Получение всех заданий из UserTasks по user_id (выполненные)
app.get("/get-done-tasks/:userId", UserTasksController.getAllDone);

// Получение выполненного задания из UserTasks по user_id  и taskNumber
app.get("/get-result-data/:userId/:taskNumber", UserTasksController.getResult);

// Оценка пользователя исходя из задания и его id
// app.get("/tasks", async (req, res) => {
//   try {
//     const taskId = req.query.id;
//     const userId = req.query.userId;
//     //const id = req.params.id.split("=")[1];
//     const task = await Tasks.findById(taskId).exec();
//     const userTask = await UserTasks.findOne({
//       task_id: taskId,
//       user_id: userId,
//     }).exec();
//     console.log(task);
//     console.log(userTask);
//     const answer = task.outputData;
//     const userAnswer = userTask.outputData;
//     let correctCount = 0;
//     let ans, userAns;

//     for (let i = 0; i < answer.length; i++) {
//       ans = answer[i];
//       userAns = userAnswer[i];

//       if (ans.toString() === userAns.toString()) {
//         correctCount++;
//       }
//     }
//     const percentage = Math.round((correctCount / answer.length) * 100);

//     res.json({ message: `Вы ответили правильно на ${percentage}% вопросов` });

//     await UserTasks.updateOne(
//       { task_id: taskId, user_id: userId },
//       { $set: { mark: percentage } }
//     );
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Не удалось проверить.",
//     });
//   }
// });

// Создание нового userTask
app.post(
  "/user-tasks2",
  checkAuth,
  userTasksCreateValidator,
  handleValidationErrors,
  UserTasksController.create
);

// Получение заданий из UserTasks по которым есть mark
app.get("/user-tasks-with-mark/:id", UserTasksController.getAllWithMark);

app.listen(process.env.PORT, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log("Server is working on port ", process.env.PORT);
});
