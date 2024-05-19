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
import Tasks from "./models/Tasks.js";
import UserTasks from "./models/UserTasks.js";
import User from "./models/User.js";

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

// app.post(
//   "/tasks",
//   checkAuth,
//   tasksCreateValidator,
//   handleValidationErrors,
//   TasksController.create
// );
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

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, { fullName: 1, _id: 0 }); 
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось получить список пользователей",
    });
  }
});

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

app.post("/user-tasks", checkAuth, async (req, res) => {
  try {
    const { mark, outputData, codeText, user_id, task_id } = req.body;

    console.log('Полученные данные:', req.body);
    
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

app.get("/tasksAll", async (req, res) => {
  try {
    // Получаем все задачи из базы данных
    const tasks = await Tasks.find().exec();
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить список задач.",
    });
  }
});

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

    // if (answer.toString() === userAnswer.toString()) {
    //   mark = 100;
    //   res.json({
    //     message: "Вы ответили правильно!",
    //   });
    // } else {
    //   res.json({
    //     message: "Вы ответили неправильно!",
    //   });
    // }

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

app.post(
  "/user-tasks2",
  checkAuth,
  userTasksCreateValidator,
  handleValidationErrors,
  UserTasksController.create
);




app.listen(4445, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log("Server is working");
});
