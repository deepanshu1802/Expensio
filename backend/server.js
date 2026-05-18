const Expense = require("./models/expenseModel");
const User = require("./models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middleware/authMiddleware");
const mongoose = require("mongoose");
require("dotenv").config();
const express = require("express");
const cors = require("cors");



const app = express();

app.use(cors());
app.use(express.json());

/* Home Route */
app.get("/", (req, res) => {
  res.send("Expense Tracker API Running 🚀");
});

/* Signup API */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully ✅",
    });
  } catch (error) {
    res.status(500).json({
      message: "Signup error",
      error,
    });
  }
});

/* Login API */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
      },
      "secretkey",
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful ✅",
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Login error",
      error,
    });
  }
});

/* Create Expense API */
app.post("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const expense = new Expense({
  ...req.body,
  userId: req.user.id,
});

    await expense.save();

    res.status(201).json({
      message: "Expense Saved ✅",
      expense,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving expense",
      error,
    });
  }
});

/* Get All Expenses API */
app.get("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({
  userId: req.user.id,
});

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching expenses",
      error,
    });
  }
});

/* Delete Expense API */
app.delete("/api/expenses/:id", authMiddleware, async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Expense Deleted ✅",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting expense",
      error,
    });
  }
});

/* Update Expense API */
app.put("/api/expenses/:id", authMiddleware, async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      message: "Expense Updated ✅",
      updatedExpense,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating expense",
      error,
    });
  }
});

const PORT = 5000;

//  MongoDB Connection //
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log(err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});