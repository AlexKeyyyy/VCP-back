import User from "../models/User.js";
import UserTasks from "../models/UserTasks.js";
import Tasks from "../models/Tasks.js";

export const getAllTasks = async (req, res) => {
  try {
    const allTasks = await Tasks.find({ status: { $ne: "deleted" } }).exec();

    return res.status(200).json(allTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить все задания.",
    });
  }
};

export const editTask = async (req, res) => {
  try {
    const { taskNumber } = req.params;
    const { taskText } = req.body;

    const updatedTask = await Tasks.findOneAndUpdate(
      { taskNumber: taskNumber },
      { $set: { taskText, status: "modified" } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: "Задание не найдено.",
      });
    }

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось отредактировать задание в БД.",
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { taskNumber } = req.params;

    const deletedTask = await Tasks.findOneAndUpdate(
      { taskNumber: taskNumber },
      { $set: { status: "deleted" } },
      { new: true }
    );

    return res.status(200).json(deletedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось удалить задание.",
    });
  }
};

export const addTask = async (req, res) => {
  try {
    const { taskNumber } = req.params;
    const { taskText } = req.body;

    const doc = new Tasks({
      taskNumber: taskNumber,
      taskText: taskText,
    });

    const task = await doc.save();
    return res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось добавить задание.",
    });
  }
};

export const getNotAssignedTasks = async (req, res) => {
  try {
    const { name, surname, patro } = req.query;

    const user = await User.findOne({ name, surname, patro });
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден." });
    }

    const userTasks = await UserTasks.find({ user_id: user._id }).select(
      "task_id"
    );
    const assignedTaskIds = userTasks.map((userTask) => userTask.task_id);

    const notAssignedTasks = await Tasks.find({
      _id: { $nin: assignedTaskIds },
    });

    return res.status(200).json(notAssignedTasks);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Не удалось получить список незачисленных задач." });
  }
};
