import bcrypt from "bcrypt";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import UserTasks from "../models/UserTasks.js";
import Tasks from "../models/Tasks.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const doc = new User({
      name: req.body.name,
      surname: req.body.surname,
      patro: req.body.patro,
      email: req.body.email,
      passwordHash: hash,
      avatarUrl: req.body.avatarUrl,
    });

    const admin = await Admin.findOne({ email: req.body.email });

    if (admin) {
      doc.role = "admin";
    } else {
      doc.role = "user";
    }

    const user = await doc.save();

    const token = jwt.sign(
      {
        _id: user._id,
      },
      "secret",
      {
        expiresIn: "30d",
      }
    );
    const { passwordHash, ...userData } = user._doc;

    res.json({
      ...userData,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось зарегистрироваться",
    });
  }
};

export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        message: "Пользователь не найден",
      });
    }

    const isValidPass = await bcrypt.compare(
      req.body.password,
      user._doc.passwordHash
    );

    if (!isValidPass) {
      return res.status(400).json({
        message: "Неверный пароль",
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      "secret",
      {
        expiresIn: "30d",
      }
    );

    const { passwordHash, ...userData } = user._doc;

    res.json({
      ...userData,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось авторизоваться",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "Пользователь не найден",
      });
    }
    const { passwordHash, ...userData } = user._doc;

    res.json(userData);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Нет доступа",
    });
  }
};

export const getUserIdByFullName = async (req, res) => {
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
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log("User ID:", userId); // Добавляем лог для проверки userId

    let updateData = req.body;
    console.log("Update Data:", updateData); // Добавляем лог для проверки updateData

    if (updateData.password) {
      // Хеширование нового пароля
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(updateData.password, salt);

      // Заменяем пароль в объекте updateData на его хеш
      updateData = { ...updateData, passwordHash };
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    console.log("Updated User:", updatedUser); // Добавляем лог для проверки обновленного пользователя

    if (!updatedUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Отправляем обновленные данные пользователя в ответе
    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Не удалось обновить данные пользователя" });
  }
};

export const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("fullName email avatarUrl");
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const writeEmail = async (req, res) => {
  try {
    const { user_id } = req.params;
    const user = await User.findById(user_id).select(
      "name surname patro email"
    );
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    res.json(user);
  } catch (error) {
    console.error("Ошибка при получении данных пользователя:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await User.findById(user_id);

    const { name, surname, patro, email, avatarUrl } = user;

    // Шаг 1: Найти все задания пользователя
    const userTasks = await UserTasks.find({ user_id: user_id });
    const userTasksGraded = await UserTasks.find({ user_id: user_id, status: "graded"});
    let avatarPath = "N/A";
    if (avatarUrl) {
      avatarPath = `http://localhost:4445${avatarUrl}`;
    }
    // Шаг 2: Посчитать среднюю оценку
    const totalMarks = userTasksGraded.reduce((acc, task) => acc + task.mark, 0);
    const averageMarkTemp = totalMarks / userTasksGraded.length;

    // Шаг 3: Посчитать общее количество заданий
    const totalTasks = userTasks.length;

    // Шаг 4: Посчитать количество заданий со статусом 'checking'
    const checkingTasksCount = userTasks.filter(
      (task) => task.status === "checking"
    ).length;

    // Шаг 5: Создать массив с задачами
    const tasks = await Promise.all(
      userTasks.map(async (task) => {
        const taskData = await Tasks.findById(task.task_id);

        let taskErrors = 0;
        let taskVulnaribilities = 0;
        let taskDefects = 0;

        task.results.issues.forEach((issue) => {
          if (issue.tags) {
            issue.tags.forEach((tag) => {
              if (tag == "error") {
                taskErrors += 1;
              }
              if (tag == "badpractice") {
                taskDefects += 1;
              }
            });
          }
        });
        let taskPropriety = 0;
        const total = taskErrors + taskVulnaribilities + taskDefects;
        if (total > 0) {
          taskPropriety = (100 - (taskErrors / total) * 100).toFixed(2);
        }

        return {
          taskNumber: taskData?.taskNumber || "N/A", // Если taskData не найден, вернем 'N/A'
          mark: task.mark,
          status: task.status,
          updatedAt: task.updatedAt,
          taskErrors,
          taskVulnaribilities,
          taskDefects,
          total,
          taskPropriety,
          sonarStatus: task.sonarStatus,
        };
      })
    );
    let taskErrors = 0;
    let taskVulnaribilities = 0;
    let taskDefects = 0;

    // Count the tags in the issues array
    // UserTasks.find({user_id: user_id}).forEach((userTask) => {
    //   userTask.results.issues.forEach((issue) => {
    //     if (issue.tags) {
    //       issue.tags.forEach((tag) => {
    //         if (tag == "error") {
    //           taskErrors += 1;
    //         }
    //         if (tag == "badpractice") {
    //           taskDefects += 1;
    //         }
    //       });
    //     }
    //   })
    // });
    const averageMark = `${(isNaN(averageMarkTemp)) ? (0) : (averageMarkTemp.toFixed(2))}`;
    console.log(averageMark);
    const total = taskErrors + taskVulnaribilities + taskDefects;
    const taskPropriety = (100 - (taskErrors / total) * 100).toFixed(0);

    // Возвращаем результат
    return res.json({
      averageMark,
      totalTasks,
      checkingTasksCount,
      tasks,
      name,
      surname,
      patro,
      email,
      avatarUrl: avatarPath,
      taskErrors,
      taskVulnaribilities,
      taskDefects,
      taskPropriety
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Файл не загружен" });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { avatarUrl },
      { new: true } // Возвращает обновленный документ
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера", error });
  }
};

export const updateProfileData = async (req, res) => {
  try {
    const { user_id } = req.params;
    console.log("User ID:", user_id); // Добавляем лог для проверки userId

    let updateData = req.body;
    console.log("Update Data:", updateData); // Добавляем лог для проверки updateData

    if (updateData.password) {
      // Хеширование нового пароля
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(updateData.password, salt);

      // Заменяем пароль в объекте updateData на его хеш
      updateData = { ...updateData, passwordHash };
    }

    const updatedUser = await User.findByIdAndUpdate(user_id, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Отправляем обновленные данные пользователя в ответе
    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Не удалось обновить данные пользователя" });
  }
};
