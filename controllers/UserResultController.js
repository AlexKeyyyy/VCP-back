import Tasks from "../models/Tasks.js";
import User from "../models/User.js";
import UserTasks from "../models/UserTasks.js";
import PDFDocument from "pdfkit";

export const getResult = async (req, res) => {
  try {
    const { user_id, taskNumber } = req.params;

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
    let taskErrors = 0;
    let taskVulnaribilities = 0;
    let taskDefects = 0;

    // Count the tags in the issues array
    userTask.results.issues.forEach((issue) => {
      if (
        issue.tags &&
        issue.message !=
          "Нужно заменить символ неразрывного пробела на обычный пробел"
      ) {
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
      checkedAt,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const makeUserReport = async (req, res) => {
  try {
    const { taskNumber, user_id } = req.params;

    // Find the user by name, surname, and patro
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, surname, patro } = user;

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
