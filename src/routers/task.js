const validator = require("validator");
const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();
const Task = require("../models/task.model");

router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const taskId = req.params.id;
  try {
    const task = await Task.findById({ _id: taskId, owner: req.user._id });
    if (!task) {
      res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
    if (!task) {
      res.status(404).send();
    }
    res.status(200).send({ message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).send();
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowUpdate = ["description", "completed"];
  const isValidUpdate = updates.every((field) => allowUpdate.includes(field));
  if (!isValidUpdate) {
    res.status(401).send({ error: "Invalid Update" });
  }
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      res.status(404).send();
    }
    //await req.user.populate("tasks").execPopulate();
    updates.forEach((field) => {
      task[field] = req.body[field];
    });
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
