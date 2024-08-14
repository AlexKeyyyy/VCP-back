import Tasks from "../models/Tasks.js";
import User from "../models/User.js";
import UserTasks from "../models/UserTasks.js";

export const getResult = async (req, res) => {
  try {
    const { taskNumber, user_id } = req.params;

    // Find the user by name, surname, and patro
    const user = await User.findById(user_id);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, surname, patro } = user;

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
    const {
      createdAt,
      updatedAt,
      codeText,
      commentAdmin,
      commentUser,
      mark,
      doneAt,
      checkedAt,
    } = userTask;

    // Accessing nested fields in the `results` object inside `userTask`
    const total = userTask.results.total;
    const effortTotal = userTask.results.effortTotal;
    const issuesCount = userTask.results.issues.length; // Counting the number of issues

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
      commentAdmin,
      commentUser,
      mark,
      doneAt,
      checkedAt,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
