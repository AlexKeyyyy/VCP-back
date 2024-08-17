import UserTasks from "../models/UserTasks.js"; // путь к модели UserTasks
import User from "../models/User.js"; // путь к модели User
import Tasks from "../models/Tasks.js"; // путь к модели User
import PDFDocument from "pdfkit";

export const getSolutions = async (req, res) => {
  try {
    // Получаем список всех пользователей
    const users = await User.find();

    // Формируем данные по пользователям
    const candidates = await Promise.all(
      users.map(async (user) => {
        // Получаем все задания для конкретного пользователя
        const tasks = await UserTasks.find({ user_id: user._id });

        // Если есть задания, получаем их детали
        const tasksInfo = await Promise.all(
          tasks.map(async (task) => {
            // Находим задание в коллекции Tasks
            const taskDetails = await Tasks.findById(task.task_id);
            return {
              taskNumber: taskDetails ? taskDetails.taskNumber : "Удалено", // Используем "Unknown", если данные не найдены
              firstUpdate: task.createdAt, // время создания задания
              mark: task.mark, // оценка задания
              status: task.status,
              sonarStatus: task.sonarStatus,
            };
          })
        );

        // Формируем путь к аватару
        let avatarPath = "N/A";
        if (user.avatarUrl) {
          avatarPath = `http://localhost:4445${user.avatarUrl}`;
        }

        // Возвращаем данные пользователя и его задач
        return {
          name: user.name,
          surname: user.surname,
          patro: user.patro,
          tasks: tasksInfo, // список задач пользователя
          avatarUrl: avatarPath,
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

export const markUser = async (req, res) => {
  try {
    const { taskNumber } = req.params;
    const { name, surname, patro, mark } = req.body;

    // Предполагается, что find возвращает массив,
    // поэтому нужно использовать [0] для получения первого объекта.
    const task = await Tasks.findOne({ taskNumber: taskNumber });

    // Получаем список всех пользователей
    const user = await User.findOne({
      name: name,
      surname: surname,
      patro: patro,
    });

    // Проверяем, существует ли пользователь и задача
    if (!user || !task) {
      return res.status(404).json({ message: "User or Task not found" });
    }

    const updatedTask = await UserTasks.findOneAndUpdate(
      { user_id: user._id, task_id: task._id },
      { $set: { mark, checkedAt: Date.now(), status: "graded" } }, // Исправлено: Date.now() должно быть вызвано как функция.
      { new: true }
    );

    // Проверка, был ли обновлен документ
    if (!updatedTask) {
      return res.status(404).json({ message: "UserTask not found" });
    }

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const commentAdmin = async (req, res) => {
  try {
    const { taskNumber } = req.params;
    const { commentText, name, surname, patro } = req.body;

    const task = await Tasks.findOne({ taskNumber: taskNumber });

    // Получаем список всех пользователей
    const user = await User.findOne({
      name: name,
      surname: surname,
      patro: patro,
    });

    // Проверяем, существует ли пользователь и задача
    if (!user || !task) {
      return res.status(404).json({ message: "User or Task not found" });
    }

    const commentedTask = await UserTasks.findOne({
      user_id: user._id,
      task_id: task._id,
    }).exec();
    if (!task) {
      return res.status(404).json({
        message: "Задача пользователя не найдена.",
      });
    }

    const comment = {
      message: commentText,
      timestamp: new Date(),
    };

    commentedTask.commentAdmin.push(comment);

    await commentedTask.save();

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

export const getSolutionDetails = async (req, res) => {
  try {
    const { taskNumber } = req.params;
    const { name, surname, patro } = req.query;

    // Find the user by name, surname, and patro
    const user = await User.findOne({
      name: name,
      surname: surname,
      patro: patro,
    });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
    } = userTask;
    // Initialize error and defect counts
    let taskErrors = 0;
    let taskVulnaribilities = 0;
    let taskDefects = 0;

    // Count the tags in the issues array
    userTask.results.issues.forEach((issue) => {
      if (issue.tags) {
        issue.tags.forEach((tag) => {
          if (tag == "error") {
            taskErrors += 1;
          }
          if (tag == "badpractice") {
            taskDefects += 1;
          }
        });
      }
    });

    const errorWeight = 0.5;
    const defectWeight = 0.2;
    const vulnerabilityWeight = 0.3;

    const totalIssues = taskErrors + taskDefects + taskVulnaribilities;
    let weightedScore = 0;

    if (totalIssues > 0) {
      weightedScore = (
        (taskErrors * errorWeight +
          taskDefects * defectWeight +
          taskVulnaribilities * vulnerabilityWeight) /
        totalIssues
      ).toFixed(2);
    }

    let taskPropriety = 0;
    if (weightedScore > 0)
      taskPropriety = (100 - weightedScore * 100).toFixed(2);
    // Format the response data
    const responseData = {
      name,
      surname,
      patro,
      createdAt,
      updatedAt,
      taskText,
      codeText,
      taskErrors,
      taskVulnaribilities,
      taskDefects,
      taskPropriety,
      commentAdmin,
      commentUser,
      mark,
      doneAt,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const makeTaskReport = async (req, res) => {
  try {
    const { taskNumber } = req.params;
    const { name, surname, patro } = req.body;

    // Find the user by name, surname, and patro
    const user = await User.findOne({
      name: name,
      surname: surname,
      patro: patro,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Находим задачу по taskNumber
    const task = await Tasks.findOne({ taskNumber: taskNumber });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Находим задачу пользователя
    const userTask = await UserTasks.findOne({
      user_id: user._id,
      task_id: task._id,
    });

    if (!userTask) {
      return res.status(404).json({ message: "User task not found" });
    }

    const { codeText } = userTask;

    // Извлекаем данные из results
    const { total, effortTotal, issues } = userTask.results;

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
          "Content-Disposition": `attachment;filename=task_report_${taskNumber}.pdf`,
        })
        .end(pdfData);
    });

    // Заполняем PDF документ данными задачи
    doc
      .fontSize(14)
      .text(`Отчет по задаче №${taskNumber}`, { underline: true });
    doc
      .fontSize(12)
      .text(
        `Кандидат: ${user.name} ${user.surname} ${user.patro} (${user.email})`
      );
    doc.fontSize(12).text(`Всего ошибок: ${total}`);
    doc.fontSize(12).text(`Общая оценка усилий: ${effortTotal}`);
    doc.moveDown();

    // Описание issues
    doc.fontSize(12).text(`Ошибки:`);
    if (issues.length === 0) {
      doc.fontSize(12).text(`Ошибки отсутствуют.`);
    } else {
      issues.forEach((issue, index) => {
        if (
          issue.message !=
          "Нужно заменить символ неразрывного пробела на обычный пробел"
        ) {
          doc.fontSize(12).text(`Ошибка ${index + 1}:`);
          doc.fontSize(12).text(`- Описание: ${issue.message}`);
          doc.fontSize(12).text(`- Строка: ${issue.line}`);
          doc.fontSize(12).text(`- Тип: ${issue.type}`);
          doc.fontSize(12).text(`- Статус: ${issue.status}`);
          doc.fontSize(12).text(`- Важность: ${issue.severity}`);
          doc.moveDown();
        }
      });
    }

    // Добавляем текст кода в PDF
    doc.addPage(); // Добавляем новую страницу для кода
    doc.fontSize(14).text("Исходный код:", { underline: true });
    if (codeText) {
      const codeLines = codeText.split("\n"); // Разбиваем код на строки
      codeLines.forEach((line, index) => {
        // Добавляем номер строки перед каждой строкой кода
        const lineNumber = (index + 1).toString().padStart(4, " "); // Форматируем номер строки
        doc.fontSize(10).text(`${lineNumber}: ${line}`, {
          align: "left",
          paragraphGap: 2,
          lineGap: 2,
          indent: 10,
          continued: false,
        });
      });
    } else {
      doc.fontSize(12).text("Код отсутствует.");
    }

    // Завершаем PDF документ
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate report.",
    });
  }
};
