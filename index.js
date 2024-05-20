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
app.put("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    let updateData = req.body;

    if (updateData.password) {
      // Хеширование нового пароля
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(updateData.password, salt);

      // Заменяем пароль в объекте updateData на его хеш
      updateData = { ...updateData, passwordHash };
    }
    console.log(userId);
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Отправьте обновленные данные пользователя в ответе
    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Не удалось обновить данные пользователя" });
  }
});

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

// Получаение всех заданий из UserTasks по user_id
app.get("/all-user-tasks/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Получаем все задачи из базы данных UserTasks с указанным user_id
    const tasks = await UserTasks.find({ user_id: userId }).exec();

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить список задач.",
    });
  }
});

// Получение задания из UserTasks по task_id и user_id
app.get("/user-task/:id/:taskId", async (req, res) => {
  try {
    const userId = req.params.id;
    const taskId = req.params.taskId;

    const task = await UserTasks.findOne({
      user_id: userId,
      task_id: taskId,
    }).exec();

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить задачу.",
    });
  }
});

// Сохранение задания и отправка на проверку по user_id и task_id
app.patch("/user-task/:id/:taskId", async (req, res) => {
  try {
    const userId = req.params.id;
    const taskId = req.params.taskId;

    const { outputData, codeText } = req.body;

    const task = await UserTasks.findOne({
      user_id: userId,
      task_id: taskId,
    }).exec();

    if (outputData) {
      task.outputData = outputData;
    }

    task.codeText = codeText;

    await task.save();

    res.json({ message: "Задача успешно обновлена" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось обновить задачу.",
    });
  }
});

// Оценка пользователя исходя из задания и его id
app.get("/tasks", async (req, res) => {
  try {
    const taskId = req.query.id;
    const userId = req.query.userId;
    //const id = req.params.id.split("=")[1];
    const task = await Tasks.findById(taskId).exec();
    const userTask = await UserTasks.findOne({
      task_id: taskId,
      user_id: userId,
    }).exec();
    console.log(task);
    console.log(userTask);
    const answer = task.outputData;
    const userAnswer = userTask.outputData;
    let correctCount = 0;
    let ans, userAns;

    for (let i = 0; i < answer.length; i++) {
      ans = answer[i];
      userAns = userAnswer[i];

      if (ans.toString() === userAns.toString()) {
        correctCount++;
      }
    }
    const percentage = Math.round((correctCount / answer.length) * 100);

    res.json({ message: `Вы ответили правильно на ${percentage}% вопросов` });

    await UserTasks.updateOne(
      { task_id: taskId, user_id: userId },
      { $set: { mark: percentage } }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось проверить.",
    });
  }
});

// Создание нового userTask
app.post(
  "/user-tasks2",
  checkAuth,
  userTasksCreateValidator,
  handleValidationErrors,
  UserTasksController.create
);

// Получение заданий из UserTasks по которым есть mark
app.get("/user-tasks-with-result/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const userTasks = await UserTasks.find({
      user_id: userId,
      mark: { $gt: 0 },
    }).exec();
    res.json(userTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить список задач с оценкой.",
    });
  }
});

app.listen(process.env.PORT, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log("Server is working on port ", process.env.PORT);
});
