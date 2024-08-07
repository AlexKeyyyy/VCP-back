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

        return {
          name: user.name,
          surname: user.surname,
          patro: user.patro,
          taskCount: tasks.length,
          averageMark: averageMark,
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
