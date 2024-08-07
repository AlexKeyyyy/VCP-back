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
