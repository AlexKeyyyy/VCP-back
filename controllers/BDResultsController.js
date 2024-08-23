import UserTasks from "../models/UserTasks.js"; // путь к модели UserTasks
import User from "../models/User.js"; // путь к модели User
import Tasks from "../models/Tasks.js"; // путь к модели User
import PDFDocument from "pdfkit";
import fs from 'fs';
import path from 'path';
import DOMPurify from 'dompurify';

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

    let taskErrorsINFO = 0;
    let taskErrorsMINOR = 0;
    let taskErrorsCRITICAL = 0;
    let taskVulnaribilitiesINFO = 0;
    let taskVulnaribilitiesMINOR = 0;
    let taskVulnaribilitiesCRITICAL = 0;
    let taskDefectsINFO = 0;
    let taskDefectsMINOR = 0;
    let taskDefectsCRITICAL = 0;

    // Count the tags in the issues array
    userTask.results.issues.forEach((issue) => {
      if (
        issue.tags &&
        issue.message !=
          "Нужно заменить символ неразрывного пробела на обычный пробел"
      ) {
      if (issue.tags) {
        issue.tags.forEach((tag) => {
          if (tag == "error") {
            taskErrors++;
            if (issue.severity === "MINOR") {
              taskErrorsMINOR++;
            } else if (issue.severity === "CRITICAL") {
              taskErrorsCRITICAL++;
            } else {
              taskErrorsINFO++;
            }
          }
          if (tag == "badpractice") {
            taskDefects++;
            if (issue.severity === "MINOR") {
              taskDefectsMINOR++;
            } else if (issue.severity === "CRITICAL") {
              taskDefectsCRITICAL++;
            } else {
              taskDefectsINFO++;
            }
          }
        });
      }
    }
    });
    


    const errorWeightINFO = 0.1;
    const errorWeightMINOR = 0.2;
    const errorWeightCRITICAL = 100;
    const defectWeightINFO = 0.1;
    const defectWeightMINOR = 0.2;
    const defectWeightCRITICAL = 100;
    const vulnerabilityWeightINFO = 0.3;
    const vulnerabilityWeightMINOR = 0.5;
    const vulnerabilityWeightCRITICAL = 100;

    const totalIssues = taskErrors + taskDefects + taskVulnaribilities;
    

    let weightedScore = 0;

    if (totalIssues > 0) {
      weightedScore = (
        (taskErrorsINFO * errorWeightINFO + taskErrorsMINOR * errorWeightMINOR + taskErrorsCRITICAL * errorWeightCRITICAL +
          taskDefectsINFO * defectWeightINFO + taskDefectsMINOR * defectWeightMINOR + taskDefectsCRITICAL * defectWeightCRITICAL +
          taskVulnaribilitiesINFO * vulnerabilityWeightINFO + taskVulnaribilitiesMINOR * vulnerabilityWeightMINOR + taskVulnaribilitiesCRITICAL * vulnerabilityWeightCRITICAL) /
        totalIssues
      ).toFixed(2);
    }
    

    let taskPropriety = 0;
    if (weightedScore > 0 && weightedScore < 10) {
      taskPropriety = (100 - weightedScore * 100).toFixed(0);
    }
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

    const user = await User.findOne({
      name: name,
      surname: surname,
      patro: patro,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const task = await Tasks.findOne({ taskNumber: taskNumber });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const userTask = await UserTasks.findOne({
      user_id: user._id,
      task_id: task._id,
    });

    if (!userTask) {
      return res.status(404).json({ message: "User task not found" });
    }

    const { codeText } = userTask;
    const { total, effortTotal, issues } = userTask.results;

    const doc = new PDFDocument({ autoFirstPage: false });
    const titleImagePath = path.resolve('./uploads/PDF/ReportTitle.png');
    const backgroundImagePath = path.resolve('./uploads/PDF/ReportBack.png');
    const codeImagePath = path.resolve('./uploads/PDF/ReportCode.png');

    doc.registerFont("Montserrat-ExtraLight", "Montserrat-ExtraLight.ttf");
    doc.registerFont("Montserrat-Light", "Montserrat-Light.ttf");
    doc.registerFont("Montserrat-Regular", "Montserrat-Regular.ttf");
    doc.registerFont("Montserrat-Medium", "Montserrat-Medium.ttf");
    doc.registerFont("Montserrat-SemiBold", "Montserrat-SemiBold.ttf");
    doc.registerFont("Montserrat-Bold", "Montserrat-Bold.ttf");

    const addPageWithBackground = (imagePath) => {
      doc.addPage();
      doc.image(imagePath, 0, 0, {
        width: doc.page.width,
        height: doc.page.height,
        opacity: 0.1,
        align: 'center',
        valign: 'center'
      });
    };

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

    addPageWithBackground(titleImagePath);

    doc
      .font("Montserrat-Bold")
      .fontSize(20)
      .fillColor('black')
      .text(`Отчет по задаче №${taskNumber}`, {
        align: 'center',
        underline: false,
      });

    doc.moveDown(0.5);

    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('#c4c4c4')
      .stroke();

    doc.moveDown(1);

    doc.roundedRect(doc.page.margins.left, doc.y, doc.page.width - doc.page.margins.left * 2, 90, 10)
       .stroke();
       
    const tableTop = doc.y + 10;
    var col1Left = doc.page.margins.left + 10;
    const col2Left = doc.page.width / 2;

    let taskErrors = 0;
    let taskVulnaribilities = 0;
    let taskDefects = 0;
    userTask.results.issues.forEach((issue) => {
      if (
        issue.tags &&
        issue.message !=
          "Нужно заменить символ неразрывного пробела на обычный пробел"
      ) {
      if (issue.tags) {
        issue.tags.forEach((tag) => {
          if (tag == "error") {
            taskErrors++;
          }
          if (tag == "badpractice") {
            taskDefects++;
          }
        });
      }
    }
    });
    const totalIssues = taskErrors + taskDefects + taskVulnaribilities;

    doc.font("Montserrat-SemiBold").fontSize(12).fillColor('black')
       .text('Кандидат', col1Left, tableTop);

    doc.font("Montserrat-Light").fontSize(12).fillColor('black')
       .text(`${user.surname} ${user.name} ${user.patro}`, col2Left, tableTop);

     doc.font("Montserrat-SemiBold").fontSize(12).fillColor('black')
       .text('Email', col1Left, tableTop + 30);

    doc.font("Montserrat-Light").fontSize(12).fillColor('#2D8AEE')
       .text(`${user.email}`, col2Left, tableTop + 30);
       
    doc.font("Montserrat-SemiBold").fontSize(12).fillColor('black')
       .text('Всего ошибок', col1Left, tableTop + 60);

    doc.font("Montserrat-Light").fontSize(12).fillColor('black')
       .text(`${totalIssues}`, col2Left, tableTop + 60);
    
    doc.font("Montserrat-SemiBold").fontSize(12).fillColor('black')
       .text('', col1Left, tableTop + 60);

    // doc.font("Montserrat-SemiBold").fontSize(12).fillColor('black')
    //    .text('Общая оценка усилий', col1Left, tableTop + 60);

    // doc.font("Montserrat-Light").fontSize(12).fillColor('black')
    //    .text(`${effortTotal}`, col2Left, tableTop + 60);
    doc.moveDown(27.2);

    const subject = `[ОЭ ${new Date().toLocaleDateString()}][${user._id}][${taskNumber}][SonarQube] Запрос поддержки от Admin`;
    const body = `Добрый день!\n\nОписание проблемы: (опишите, что случилось)\nПриоритет: от 1 до 4 (1 - срочный, 4 - некритичный)\nЖелаемая дата окончания сопровождения: (проставьте желаемую дату разрешения вопроса)\n\n___\nС уважением,\nпользователь платформы проверки тестовых заданий\n${user.surname} ${user.name} ${user.patro}`;
    const mailtoLink = `mailto:vcp-tech-sup@mail.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    doc.font("Montserrat-SemiBold").fontSize(14).fillColor('#c4c4c4')
       .text('ПОДДЕРЖКА', {
         align: 'center',
         link: mailtoLink,
        //  underline: true
       })
    doc.moveDown(5);

    addPageWithBackground(backgroundImagePath);

    doc
      .font("Montserrat-Bold")
      .fontSize(20)
      .fillColor('black')
      .text(`Ошибки`, { align: 'center' });
    
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('black')
      .stroke();

    doc.moveDown();

    if (issues.length === 0) {
      doc.fontSize(10).fillColor('black').text(`Ошибки отсутствуют.`);
    } else {
      var highlightMap = new Map();
      issues.forEach(issue => {
        if (issue.message !== "Нужно заменить символ неразрывного пробела на обычный пробел") {
          highlightMap.set(issue.line, issue.severity);
        }
      });

      
      var indexSeq = 1;
      issues.forEach((issue) => {
        if (issue.message !== "Нужно заменить символ неразрывного пробела на обычный пробел") {
          let severityColor;
          switch (issue.severity) {
            case "INFO":
              severityColor = '#49c450'; 
              break;
            case "MINOR":
              severityColor = '#debe5b'; 
              break;
            case "CRITICAL":
              severityColor = '#e23333'; 
              break;
            default:
              severityColor = '#c4c4c4';
              break;
          }

          doc
            .font("Montserrat-SemiBold")
            .fontSize(12)
            .fillColor(severityColor)
            .text(`Ошибка ${indexSeq} [${issue.severity}]`, { align: 'left' });

          doc
            .font("Montserrat-Medium")
            .fontSize(10)
            .fillColor('black')
            .text(`Описание:`, { continued: true });

          doc
            .font("Montserrat-Light")
            .text(` ${issue.message}`, { continued: false });

          doc
            .font("Montserrat-Medium")
            .fontSize(10)
            .fillColor('black')
            .text(`Строка:`, { continued: true });

          doc
            .font("Montserrat-Light")
            .text(` ${issue.line}`, { continued: false });

          doc.moveDown();

          if (doc.y > doc.page.height - 50) {
            addPageWithBackground(backgroundImagePath);
          }
          indexSeq++;
        }
        
      });
    }

    addPageWithBackground(codeImagePath);

    doc
      .font("Montserrat-Bold")
      .fontSize(20)
      .fillColor('black')
      .text("Исходный код", { align: 'center', underline: false });

    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('black')
      .stroke();

    doc.moveDown(2);

    if (codeText) {
      const codeLines = codeText.split("\n");

      codeLines.forEach((line, index) => {
        const lineNumber = (index + 1).toString().padStart(4, " ");
        const lineKey = index + 1;
        const lineColor = highlightMap.has(lineKey) ? highlightMap.get(lineKey) : 'black';
        
        const lineNumberColor = {
          'INFO': '#49c450',
          'MINOR': '#debe5b',
          'CRITICAL': '#e23333'
        }[lineColor] || 'black'; 

        doc
          .font("Montserrat-Medium")
          .fontSize(10)
          .fillColor(lineNumberColor) 
          .text(`${lineNumber}     `, { continued: true });


        doc.font("Montserrat-Light").fontSize(10).fillColor(lineColor).text(`${line}`, {
          align: "left",
          paragraphGap: 2,
          lineGap: 2,
          indent: 10,
          continued: false
        });

        if (doc.y > doc.page.height - 50) {
          addPageWithBackground(backgroundImagePath);
        }
      });
    } else {
      doc.font("Montserrat-Regular").fontSize(10).text("Код отсутствует.");
    }

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate report.",
    });
  }
};

