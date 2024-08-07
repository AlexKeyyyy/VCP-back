import Tasks from "../models/Tasks.js";
import User from "../models/User.js";
export const getTaskInfo = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { taskNumber } = req.params;

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).json({ message: "Пользователь не найден" });
    }
    const task = await Tasks.findOne({ taskNumber: taskNumber }).exec();
    if (!task) {
      return res.status(400).json({ message: "Задание не найдено" });
    }

    const response = {
      name: user.name,
      surname: user.surname,
      patronymic: user.patro, // Предполагается, что это поле называется patronymic
      updatedAt: task.updatedAt,
      taskText: task.taskText,
      taskNumber: task.taskNumber,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.log(err);
    res.status(500).json({ message: "Не удалось получить задание" });
  }
};
