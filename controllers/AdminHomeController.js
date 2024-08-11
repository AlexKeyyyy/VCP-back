import User from "../models/User.js";
import UserTasks from "../models/UserTasks.js";
import Tasks from "../models/Tasks.js";

export const getMainStats = async (req, res) => {
  try {
    const countUsers = (await User.find({ role: "user" })).length;
    const unmarkedTasks = (await UserTasks.find({ status: "checking"})).length;

    const countTasks = (await Tasks.find()).length;
    const result = {
      countUsers: countUsers,
      countUnmarkedTasks: unmarkedTasks,
      countTasks: countTasks,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Не удалось загрзуить основную статистику." });
  }
};
