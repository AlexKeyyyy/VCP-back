import Tasks from "../models/Tasks.js";

export const getAllTasks = async (req, res) => {
  try {
    const allTasks = await Tasks.find().exec();

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
      { $set: { taskText } },
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

    const deletedTask = await Tasks.findOneAndDelete({
      taskNumber: taskNumber,
    });

    return res.status(200).json(deletedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось удалить задание.",
    });
  }
};
