import mongoose from "mongoose";

const TasksSchema = new mongoose.Schema(
  {
    mark: {
      type: Number,
      default: 0,
      required: false,
    },
    outputData: {
      type: Array,
      default: [],
      required: false,
    },
    codeText: {
      type: Text,
      required: false,
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
    commentAdmin: {
      type: String,
      required: false,
    },
    commentUser: {
      type: String,
      required: false,
    },
    done: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("UserTasks", TasksSchema);
