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
      type: [
        {
          message: { type: String, required: true },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      required: false,
    },
    commentUser: {
      type: [
        {
          message: { type: String, required: true },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      required: false,
    },
    done: {
      type: Number,
      default: 0,
    },
    doneAt: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      default: "assigned",
    },
    checkedAt: {
      type: Date,
    },
    sonarStatus: {
      type: String,
      default: "hah",
    },

    results: {
      type: Object,
    },
    mark_email: {
      type: String,
      default: "not",
    },
    sonar_email: {
      type: String,
      default: "not",
    },
    new_task_email: {
      type: String,
      default: "not",
    },
    all_task_email: {
      type: String,
      default: "not",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("UserTasks", TasksSchema);
