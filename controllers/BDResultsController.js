import UserTasks from "../models/UserTasks.js"; // путь к модели UserTasks
import User from "../models/User.js"; // путь к модели User
import Tasks from "../models/Tasks.js"; // путь к модели User

export const getSolutions = async (req, res) => {
  try {
    // Получаем список всех пользователей
    const users = await User.find();

    // Формируем данные по пользователям
    const candidates = await Promise.all(
      users.map(async (user) => {
        // Получаем все задания для конкретного пользователя
        const tasks = await UserTasks.find({ user_id: user._id });

        // Если есть задания, получаем их детали
        const tasksInfo = await Promise.all(
          tasks.map(async (task) => {
            // Находим задание в коллекции Tasks
            const taskDetails = await Tasks.findById(task.task_id);
            return {
              taskNumber: taskDetails ? taskDetails.taskNumber : "Удалено", // Используем "Unknown", если данные не найдены
              firstUpdate: task.createdAt, // время создания задания
              mark: task.mark, // оценка задания
              status: task.status,
            };
          })
        );

        // Формируем путь к аватару
        let avatarPath = "N/A";
        if (user.avatarUrl) {
          avatarPath = `http://localhost:4445${user.avatarUrl}`;
        }

        // Возвращаем данные пользователя и его задач
        return {
          name: user.name,
          surname: user.surname,
          patro: user.patro,
          tasks: tasksInfo, // список задач пользователя
          avatarUrl: avatarPath,
        };
      })
    );

    // Возвращаем список кандидатов
    return res.status(200).json(candidates);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить список кандидатов.",
    });
  }
};

export const markUser = async (req, res) => {
  try {
    const { taskNumber } = req.params;
    const { name, surname, patro, mark } = req.body;

    // Предполагается, что find возвращает массив,
    // поэтому нужно использовать [0] для получения первого объекта.
    const task = await Tasks.findOne({ taskNumber: taskNumber });

    // Получаем список всех пользователей
    const user = await User.findOne({
      name: name,
      surname: surname,
      patro: patro,
    });

    // Проверяем, существует ли пользователь и задача
    if (!user || !task) {
      return res.status(404).json({ message: "User or Task not found" });
    }

    const updatedTask = await UserTasks.findOneAndUpdate(
      { user_id: user._id, task_id: task._id },
      { $set: { mark, checkedAt: Date.now() } }, // Исправлено: Date.now() должно быть вызвано как функция.
      { new: true }
    );

    // Проверка, был ли обновлен документ
    if (!updatedTask) {
      return res.status(404).json({ message: "UserTask not found" });
    }

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const commentAdmin = async (req, res) => {
  try {
    const { taskNumber } = req.params;
    const { commentText, name, surname, patro } = req.body;

    const task = await Tasks.findOne({ taskNumber: taskNumber });

    // Получаем список всех пользователей
    const user = await User.findOne({
      name: name,
      surname: surname,
      patro: patro,
    });

    // Проверяем, существует ли пользователь и задача
    if (!user || !task) {
      return res.status(404).json({ message: "User or Task not found" });
    }

    const commentedTask = await UserTasks.findOne({
      user_id: user._id,
      task_id: task._id,
    }).exec();
    if (!task) {
      return res.status(404).json({
        message: "Задача пользователя не найдена.",
      });
    }

    const comment = {
      message: commentText,
      timestamp: new Date(),
    };

    commentedTask.commentAdmin.push(comment);

    await commentedTask.save();

    res.status(200).json({
      message: "Комментарий успешно добавлен",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось отправить сообщение.",
    });
  }
};

export const getSolutionDetails = async (req, res) => {
  try {
    const { taskNumber } = req.params;
    const { name, surname, patro } = req.body;

    // Find the user by name, surname, and patro
    const user = await User.findOne({
      name: name,
      surname: surname,
      patro: patro,
    });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the task by taskNumber
    const task = await Tasks.findOne({ taskNumber: taskNumber });

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { taskText } = task;

    // Find the user task solution
    const userTask = await UserTasks.findOne({
      user_id: user._id,
      task_id: task._id,
    });

    // Check if userTask exists
    if (!userTask) {
      return res.status(404).json({ message: "User task solution not found" });
    }

    // Extract the required data from userTask
    const { createdAt, updatedAt, codeText, commentAdmin, commentUser } =
      userTask;

    // Accessing nested fields in the `results` object inside `userTask`
    const total = userTask.results.total;
    const effortTotal = userTask.results.effortTotal;
    const issuesCount = userTask.results.issues.length; // Counting the number of issues

    // You can also access specific issues or other nested data if needed
    const specificIssue =
      userTask.results.issues[0]?.description || "No issues";

    // Format the response data
    const responseData = {
      name,
      surname,
      patro,
      createdAt,
      updatedAt,
      taskText,
      codeText,
      total,
      effortTotal,
      issuesCount,
      specificIssue, // Just for demonstration, remove if not needed
      commentAdmin,
      commentUser,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
