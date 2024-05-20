import mongoose from "mongoose";

const TasksSchema = new mongoose.Schema(
  {
    taskNumber: {
      type: Number,
      required: true,
    },
    taskText: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      required: false,
    },
    inputData: {
      type: Array,
      default: [],
      required: false,
    },
    outputData: {
      type: Array,
      default: [],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Tasks", TasksSchema);
