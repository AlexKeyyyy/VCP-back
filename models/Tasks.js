import mongoose from "mongoose";

const TasksSchema = new mongoose.Schema(
  {
    taskNumber: {
      type: Number,
      required: true
    },
    taskText: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      required: true,
    },
    inputData: {
      type: Array,
      default: [],
      required: true,
    },
    outputData: {
      type: Array,
      default: [],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Tasks", TasksSchema);
