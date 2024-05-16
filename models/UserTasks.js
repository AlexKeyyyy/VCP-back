import mongoose from "mongoose";

const TasksSchema = new mongoose.Schema(
  {
    mark: {
      type: Number,
      default: 0,
    },
    outputData: {
      type: Array,
      default: [],
      required: true,
    },
    codeText: {
      type: String,
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserTasks",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("UserTasks", TasksSchema);
