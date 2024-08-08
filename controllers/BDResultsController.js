import UserTasks from "../models/UserTasks.js"; // путь к модели UserTasks
import User from "../models/User.js"; // путь к модели User

export const getSolutions = async (req, res) => {
  try {
    // Получаем список всех пользователей
    const users = await User.find();

    // Формируем данные по пользователям
    const candidates = await Promise.all(
      users.map(async (user) => {
        // Получаем все задания для конкретного пользователя
        const tasks = await UserTasks.find({ user_id: user._id });

        // Формируем массив задач с нужной информацией
        const tasksInfo = tasks.map((task, index) => ({
          taskNumber: task.taskNumber, // номер задания по порядку
          firstUpdate: task.createdAt, // время создания задания
          mark: task.mark, // оценка задания
        }));

        // Возвращаем данные пользователя и его задач
        return {
          name: user.name,
          surname: user.surname,
          patro: user.patro,
          tasks: tasksInfo, // список задач пользователя
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
