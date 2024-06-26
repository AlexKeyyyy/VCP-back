import UserTasks from "../models/UserTasks.js";
import Tasks from "../models/Tasks.js";
import User from "../models/User.js";
import moment from "moment-timezone";
import PDFDocument from "pdfkit";

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
    console.log(taskId);
    if (outputData) {
      task.outputData = outputData;
    }

    if (codeText) {
      task.codeText = codeText;
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

export const getDone = async (req, res) => {
  try {
    const userId = req.params.id;
    const taskNumber = req.params.taskNumber;

    const taskId = await Tasks.findOne({ taskNumber: taskNumber }).exec();

    const task = await UserTasks.findOne({
      user_id: userId,
      task_id: taskId,
    }).exec();

    res.json(task.done);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось вернуть done.",
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

export const getCode = async (req, res) => {
  try {
    const userId = req.params.id;
    const taskNumber = req.params.taskNumber;

    const taskId = await Tasks.findOne({ taskNumber: taskNumber }).exec();

    const task = await UserTasks.findOne({
      user_id: userId,
      task_id: taskId,
    }).exec();

    console.log(task);

    res.json({ codeText: task.codeText });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить код.",
    });
  }
};

export const getAllDone = async (req, res) => {
  try {
    const userId = req.params.userId;

    const doneTasks = await UserTasks.find({ user_id: userId, done: "1" });

    // Выполняем поиск всех номеров задач (TaskNumber), связанных с выполными задачами
    const tasksNumbers = await Tasks.find(
      { _id: { $in: doneTasks.map((task) => task.task_id) } },
      { taskNumber: 1 }
    );

    // Теперь в переменной tasksNumbers у нас массив объектов, каждый из которых содержит только номер задачи (TaskNumber)
    // Вы можете преобразова этот массив в плоский массив номеров задач, используя метод map
    const allTaskNumbers = tasksNumbers.map((task) => task.taskNumber);
    res.status(200).json(allTaskNumbers);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить список задач.",
    });
  }
};

export const getResult = async (req, res) => {
  try {
    const userId = req.params.userId;
    const taskNumber = req.params.taskNumber;

    const taskId = await Tasks.findOne({ taskNumber: taskNumber }).exec();

    const task = await UserTasks.findOne({
      user_id: userId,
      task_id: taskId,
    }).exec();

    const user = await User.findById(userId).exec();

    res.json({
      taskText: taskId.taskText,
      codeText: task.codeText,
      commentAdmin: task.commentAdmin,
      commentUser: task.commentUser,
      fullName: user.fullName,
      doneAt: task.doneAt,
      mark: task.mark,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить результат.",
    });
  }
};

export const commentUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const taskNumber = req.params.taskNumber;
    const { message } = req.body;

    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({
        message: "Пользователь не найден.",
      });
    }

    //const admin = await Admin.findOne({ email: user.email }).exec();

    const taskId = await Tasks.findOne({ taskNumber: taskNumber }).exec();
    if (!taskId) {
      return res.status(404).json({
        message: "Задача не найдена.",
      });
    }

    const task = await UserTasks.findOne({
      user_id: userId,
      task_id: taskId,
    }).exec();
    if (!task) {
      return res.status(404).json({
        message: "Задача пользователя не найдена.",
      });
    }

    const comment = {
      message,
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

export const getAllResult = async (req, res) => {
  try {
    const results = await UserTasks.find({ done: "1" });

    const taskIds = results.map((task) => task.task_id);
    const userIds = results.map((task) => task.user_id);

    const taskNumbers = await Tasks.find({ _id: { $in: taskIds } });
    const users = await User.find({ _id: { $in: userIds } });

    const taskNumbersMap = taskNumbers.reduce((acc, task) => {
      acc[task._id] = task.taskNumber;
      return acc;
    }, {});

    const usersMap = users.reduce((acc, user) => {
      acc[user._id] = user.fullName;
      return acc;
    }, {});

    const response = results.map((result) => ({
      doneAt: result.doneAt,
      fullName: usersMap[result.user_id],
      user_id: result.user_id,
      taskNumber: taskNumbersMap[result.task_id],
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось получить все результаты.",
    });
  }
};

export const setMark = async (req, res) => {
  try {
    const userId = req.params.userId;

    const taskNumber = req.params.taskNumber;

    const { mark } = req.body;
    const taskId = await Tasks.findOne({ taskNumber: taskNumber }).exec();
    const task = await UserTasks.findOne({
      user_id: userId,
      task_id: taskId,
    }).exec();

    if (mark) {
      task.mark = mark;
    }

    await task.save();

    res.status(200).json({ message: "Задача успешно оценена." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось оценить задание.",
    });
  }
};

export const commentAdmin = async (req, res) => {
  try {
    const userId = req.params.userId;

    const taskNumber = req.params.taskNumber;

    const { message } = req.body;
    const taskId = await Tasks.findOne({ taskNumber: taskNumber }).exec();
    const task = await UserTasks.findOne({
      user_id: userId,
      task_id: taskId,
    }).exec();

    const comment = {
      message,
      timestamp: new Date(),
      //moment().tz("Europe/Moscow").format("YYYY-MM-DDTHH:mm:ss") + "Z",
    };

    task.commentAdmin.push(comment);

    await task.save();

    res.status(200).json({ message: "Комментарий успешно отправлен." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не удалось отправить сообщение.",
    });
  }
};

export const makeReport = async (req, res) => {
  try {
    // Получаем все задачи пользователей
    const userTasks = await UserTasks.find();

    // Извлекаем уникальные user_id из задач
    const userIds = [...new Set(userTasks.map((task) => task.user_id))];

    // Получаем пользователей по userIds
    const users = await User.find({ _id: { $in: userIds } });

    // Группируем задачи по пользователю
    const userTaskMap = userTasks.reduce((acc, task) => {
      if (!acc[task.user_id]) {
        acc[task.user_id] = [];
      }
      acc[task.user_id].push(task);
      return acc;
    }, {});

    // Создаем новый PDF документ
    const doc = new PDFDocument();
    const fontPath = "OpenSans_Condensed-Medium.ttf"; // Укажите путь к вашему файлу шрифта
    doc.registerFont("OpenSans", fontPath);
    doc.font("OpenSans");
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      let pdfData = Buffer.concat(buffers);
      res
        .writeHead(200, {
          "Content-Length": Buffer.byteLength(pdfData),
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment;filename=report.pdf",
        })
        .end(pdfData);
    });

    // Генерируем отчет для каждого пользователя
    // users.forEach((user) => {
    //   const tasks = userTaskMap[user._id] || [];
    //   const totalTasks = tasks.length;
    //   const completedTasks = tasks.filter((task) => task.done === 1).length;
    //   const completionRate =
    //     totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

    //   // Добавляем данные пользователя в PDF
    //   doc.fontSize(14).text(`Кандидат: ${user.fullName} (${user.email})`, {
    //     underline: true,
    //   });
    //   doc.fontSize(12).text(`Total Tasks: ${totalTasks}`);
    //   doc.fontSize(12).text(`Completed Tasks: ${completedTasks}`);
    //   doc.fontSize(12).text(`Completion Rate: ${completionRate.toFixed(2)}%`);
    //   doc.moveDown();
    // });

    users.forEach((user) => {
      const tasks = userTaskMap[user._id] || [];
      const totalTasks = tasks.length;
      const totalMarks = tasks.reduce(
        (sum, task) => sum + (task.mark > 0 ? task.mark : 0),
        0
      );
      const maxPossibleMarks = totalTasks * 10;
      const completionRate =
        maxPossibleMarks === 0 ? 0 : (totalMarks / maxPossibleMarks) * 100;

      // Добавляем данные пользователя в PDF
      doc.fontSize(14).text(`Кандидат: ${user.fullName} (${user.email})`, {
        underline: true,
      });
      doc.fontSize(12).text(`Всего заданий: ${totalTasks}`);
      doc.fontSize(12).text(`Суммарная оценка: ${totalMarks}`);
      doc
        .fontSize(12)
        .text(`Процент выполнения: ${completionRate.toFixed(2)}%`);
      doc.moveDown();
    });

    // Заканчиваем PDF документ
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate report.",
    });
  }
};
