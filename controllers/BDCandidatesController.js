import Tasks from "../models/Tasks.js";
import User from "../models/User.js";
import UserTasks from "../models/UserTasks.js";

export const getCandidates = async (req, res) => {
  try {
    const users = await User.find();

    const candidates = await Promise.all(
      users.map(async (user) => {
        const tasks = await UserTasks.find({ user_id: user._id });

        const totalMarks = tasks.reduce(
          (acc, task) => acc + (task.mark >= 0 ? task.mark : 0),
          0
        );
        const completedTasks = tasks.filter((task) => task.mark >= 0).length;

        const averageMark =
          completedTasks > 0 ? (totalMarks / completedTasks).toFixed(2) : "N/A";

        let avatarPath = "N/A";
        if (user.avatarUrl) {
          avatarPath = `http://localhost:4445${user.avatarUrl}`;
        }

        return {
          name: user.name,
          surname: user.surname,
          patro: user.patro,
          taskCount: tasks.length,
          averageMark: averageMark,
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

export const assignTasks = async (req, res) => {
  try {
    const { name, surname, patro } = req.body;

    const { choosedTaskNumbers } = req.body;

    const promises = choosedTaskNumbers.map(async (element) => {
      const task = await Tasks.findOne({ taskNumber: element });

      if (!task) {
        throw new Error(`Задание с номером ${element} не найдено.`);
      }

      const user = await User.findOne({
        name: name,
        surname: surname,
        patro: patro,
      });

      if (!user) {
        throw new Error(`Пользователь ${name} ${surname} ${patro} не найден.`);
      }

      const userTask = new UserTasks({
        user_id: user._id,
        task_id: task._id,
      });

      return userTask.save();
    });

    const newTasks = await Promise.all(promises);

    return res.status(200).json(newTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось назначить задание кандидату.",
    });
  }
};
