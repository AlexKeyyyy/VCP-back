import Tasks from "../models/Tasks.js";
import User from "../models/User.js";
import UserTasks from "../models/UserTasks.js";

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

export const sendCode = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { taskNumber } = req.params;

    const { code } = req.body;
    const taskId = await Tasks.findOne({ taskNumber: taskNumber }).exec();

    const task = await UserTasks.findOne({
      user_id: user_id,
      task_id: taskId,
    }).exec();
    console.log(taskId);

    if (code) {
      task.codeText = code;
    }
    console.log(task.done);
    task.done = 1;
    console.log(task.done);
    task.doneAt = new Date();
    //moment().tz("Europe/Moscow").format("YYYY-MM-DDTHH:mm:ss") + "Z";

    await task.save();

    res.json(task.done);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось отправить задачу на проверку.",
    });
  }
};

export const sendComment = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { taskNumber } = req.params;
    const { commentText } = req.body;

    const user = await User.findById(user_id).exec();
    if (!user) {
      return res.status(404).json({
        message: "Пользователь не найден.",
      });
    }

    const taskId = await Tasks.findOne({ taskNumber: taskNumber }).exec();
    if (!taskId) {
      return res.status(404).json({
        message: "Задача не найдена.",
      });
    }

    const task = await UserTasks.findOne({
      user_id: user_id,
      task_id: taskId,
    }).exec();
    if (!task) {
      return res.status(404).json({
        message: "Задача пользователя не найдена.",
      });
    }

    const comment = {
      message: commentText,
      timestamp: new Date(),
      //moment().tz("Europe/Moscow").format("YYYY-MM-DDTHH:mm:ss") + "Z",
    };
    //console.log(admin.email === user.email);
    // if (admin) {
    //   task.commentAdmin.push(comment);
    // } else {
    //   task.commentUser.push(comment);
    // }

    task.commentUser.push(comment);

    await task.save();

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
