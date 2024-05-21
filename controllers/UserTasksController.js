import UserTasks from "../models/UserTasks.js";
import Tasks from "../models/Tasks.js";

export const create = async (req, res) => {
  try {
    const doc = new UserTasks({
      taskText: req.body.taskText,
      mark: req.body.mark,
      outputData: req.body.outputData,
      codeText: req.body.codeText,
      user_id: req.body.user_id,
      task_id: req.body.task_id,
    });

    const task = await doc.save();
    res.json(task);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Не удалось сохранить/создать задание",
    });
  }
};

export const getAllWithMark = async (req, res) => {
  try {
    const userId = req.params.id;
    const userTasks = await UserTasks.find({
      user_id: userId,
      mark: { $gt: 0 },
    }).exec();
    res.json(userTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить список задач с оценкой.",
    });
  }
};

export const update = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    
    const taskNumber = req.params.taskNumber;

    const { outputData, codeText } = req.body;
    const taskId = await Tasks.findOne({ taskNumber: taskNumber }).exec();
    const task = await UserTasks.findOne({
      user_id: userId,
      task_id: taskId,
    }).exec();

    if (outputData) {
      task.outputData = outputData;
    }

    if (codeText) {
      task.codeText = codeText;
    }

    await task.save();

    res.json({ message: "Задача успешно обновлена" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось обновить задачу.",
    });
  }
};

export const send = async (req, res) => {
  try {
    const userId = req.params.id;
    const taskNumber = req.params.taskNumber;

    const { outputData, codeText } = req.body;
    const taskId = await Tasks.findOne({ taskNumber: taskNumber }).exec();
    const task = await UserTasks.findOne({
      user_id: userId,
      task_id: taskId,
    }).exec();

    if (outputData) {
      task.outputData = outputData;
    }

    if (codeText) {
      task.codeText = codeText;
    }
    console.log(task.done)
    task.done = 1;
    console.log(task.done)

    await task.save();

    res.json({ message: "Задача успешно отправлена на проверку" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось отправить задачу на проверку.",
    });
  }
};

export const getOne = async (req, res) => {
  try {
    const userId = req.params.id;
    const taskId = req.params.taskId;

    const task = await UserTasks.findOne({
      user_id: userId,
      task_id: taskId,
    }).exec();

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить задачу.",
    });
  }
};

export const getAll = async (req, res) => {
  try {
    const userId = req.params.id;

    // Получаем все задачи из базы данных UserTasks с указанным user_id
    const userTasks = await UserTasks.find({
      user_id: userId,
      done: "0",
    }).exec();

    // Получаем task_ids из userTasks
    const taskIds = userTasks.map((userTask) => userTask.task_id);

    // Используем Promise.all для параллельного выполнения всех запросов
    const tasks = await Promise.all(
      taskIds.map(async (taskId) => {
        const task = await Tasks.findById(taskId)
          .select("taskNumber taskText")
          .exec();
        return task
          ? {
              _id: taskId,
              taskNumber: task.taskNumber,
              taskText: task.taskText,
            }
          : null;
      })
    );

    // Убираем null значения на случай, если task не был найден
    const validTasks = tasks.filter((task) => task !== null);

    res.json(validTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить список задач.",
    });
  }
};
