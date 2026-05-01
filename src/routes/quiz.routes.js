import express from "express";
import QuizAttempt from "../models/QuizAttempt.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const quizBank = {
  DSA: [
    {
      question: "Which data structure follows FIFO?",
      options: ["Stack", "Queue", "Tree", "Graph"],
      answer: "Queue",
      topic: "Queue"
    },
    {
      question: "Binary Search works on which type of array?",
      options: ["Unsorted", "Sorted", "Random", "Empty only"],
      answer: "Sorted",
      topic: "Searching"
    },
    {
      question: "Which traversal uses recursion naturally?",
      options: ["Tree Traversal", "Linear Search", "Hashing", "Sorting only"],
      answer: "Tree Traversal",
      topic: "Tree"
    }
  ],
  OS: [
    {
      question: "Round Robin scheduling mainly uses what?",
      options: ["Time quantum", "Deadlock", "Indexing", "Normalization"],
      answer: "Time quantum",
      topic: "Scheduling"
    }
  ],
  DBMS: [
    {
      question: "Which SQL clause is used to filter rows?",
      options: ["WHERE", "ORDER BY", "GROUP BY", "JOIN"],
      answer: "WHERE",
      topic: "SQL"
    }
  ]
};

router.get("/", (req, res) => {
  const subject = req.query.subject || "DSA";
  res.json({ subject, questions: quizBank[subject] || quizBank.DSA });
});

router.post("/submit", protect, async (req, res) => {
  try {
    const { subject = "DSA", answers = [] } = req.body;
    const questions = quizBank[subject] || quizBank.DSA;

    let score = 0;
    const wrongTopics = [];

    questions.forEach((q, i) => {
      if (answers[i] === q.answer) score++;
      else wrongTopics.push(q.topic);
    });

    await QuizAttempt.create({
      userId: req.user._id,
      subject,
      score,
      total: questions.length,
      wrongTopics,
      answers
    });

    res.json({
      score,
      total: questions.length,
      wrongTopics,
      message: score === questions.length ? "Excellent!" : "Revise weak topics and try again."
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
