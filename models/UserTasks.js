import mongoose from "mongoose";

const TasksSchema = new mongoose.Schema(
  {
    mark: {
      type: Number,
      default: -1,
      required: false,
      min: -1,
      max: 10,
    },
    outputData: {
      type: Array,
      default: [],
      required: false,
    },
    codeText: {
      type: String,
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
