const { Schema, model } = require("mongoose");

const DaySchema = new Schema(
  {
    day: { required: true, type: Number },
    month: { required: true, type: Number },
    year: { required: true, type: Number },
    apartmentId: { required: true, type: String },
    apartmentName: { required: true, type: String },
    isRented: { required: false, type: Boolean, default: true },
    endDate: { required: false, type: Boolean, default: false },
    endDateObj: { required: false, type: Object },
    startDate: { required: false, type: Boolean, default: false },
    startDateObj: { required: false, type: Object },
    guest: { required: false, type: Object },

    finishStatus: { required: false, type: String, default: "Not finished" },
  },
  { timestamps: true }
);

const DayModel = model("Day", DaySchema);

module.exports = DayModel;
