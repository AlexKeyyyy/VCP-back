import Tasks from "../models/Tasks.js";

// export const getLastTags = async (req, res) => {
//   try {
//     const posts = await Tasks.find().limit(5).exec();
//     const tags = posts
//       .map((obj) => obj.tags)
//       .flat()
//       .slice(0, 5);
//     res.json(tags);
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       message: "Не удалось получить тэги",
//     });
//   }
// };
export const create = async (req, res) => {
  try {
    const doc = new Tasks({
      taskText: req.body.taskText,
      reference: req.body.reference,
      inputData: req.body.inputData,
      outputData: req.body.outputData,
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

// export const getAll = async (req, res) => {
//   try {
//     const posts = await Tasks.find().populate("user").exec();
//     res.json(posts);
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       message: "Не удалось получить статьи",
//     });
//   }
// };

// export const getOne = async (req, res) => {
//   try {
//     const postId = req.params.id;
//     Tasks.findOneAndUpdate(
//       {
//         _id: postId,
//       },
//       {
//         $inc: { viewsCount: 1 },
//       },
//       {
//         returnDocument: "after",
//       }
//     ).then((doc, err) => {
//       if (err) {
//         console.log(err);
//         return res.status(500).json({
//           message: "Не удалось вернуть статью",
//         });
//       }
//       if (!doc) {
//         return res.status(404).json({
//           message: "Статья не найдена",
//         });
//       }
//       res.json(doc);
//     });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       message: "Не удалось получить статью",
//     });
//   }
// };

// export const remove = async (req, res) => {
//   try {
//     const postId = req.params.id;
//     Tasks.findOneAndDelete({
//       _id: postId,
//     }).then((doc, err) => {
//       if (err) {
//         console.log(err);
//         return res.status(500).json({
//           message: "Не удалось удалить статью",
//         });
//       }
//       if (!doc) {
//         return res.status(404).json({
//           message: "Статья не найдена",
//         });
//       }
//       res.json({ success: true });
//     });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       message: "Не удалось удалить статью",
//     });
//   }
// };

// export const update = async (req, res) => {
//   try {
//     const postId = req.params.id;

//     await Tasks.updateOne(
//       {
//         _id: postId,
//       },
//       {
//         title: req.body.title,
//         text: req.body.text,
//         imageUrl: req.body.imageUrl,
//         user: req.userId,
//         tags: req.body.tags,
//       }
//     );

//     res.json({ success: true });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       message: "Не удалось обновить статью",
//     });
//   }
// };
