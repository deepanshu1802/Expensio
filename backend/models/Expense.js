const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    desc: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Expense", expenseSchema);