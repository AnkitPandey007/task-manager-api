const auth = require("../middleware/auth");
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const router = new express.Router();
const User = require("../models/user.model");

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(403).send(e);
  }
});

router.get("/users/me", auth, async (req, res) => {
  try {
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    req.user.remove();
    res.send(req.user);
  } catch (error) {
    res.status(500).send();
  }
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "age"];
  const isValidOpration = updates.every((field) =>
    allowedUpdates.includes(field)
  );

  if (!isValidOpration) {
    res.status(400).send({ error: "Invalid Operation" });
  }
  try {
    updates.forEach((field) => {
      req.user[field] = req.body[field];
    });
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send();
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.post("/user/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    const status = await req.user.save();
    console.log(status);
    res.send("logout Successfully");
  } catch (e) {
    res.send(400).send(e);
  }
});

router.post("/user/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    const status = await req.user.save();
    console.log(status);
    res.send("logout from all accounts Successfully");
  } catch (e) {
    res.status(400).send(e);
  }
});

const storage = multer.memoryStorage({
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10000000,
  },
  fileFilter(req, file, callBack) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|PNG)$/)) {
      return callBack(new Error("Please upload an Image"));
    }
    callBack(null, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const resizedBuffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .toBuffer();
      req.user.avatar = resizedBuffer;
      req.user.avatar = req.file.buffer;
      await req.user.save();
      res.send({ message: "Profile udated successfully" });
    } catch (e) {
      res.status(400).send(e);
    }
  },
  (error, req, res, next) => {
    res.status(500).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error("Image not found");
    }
    res.set("Content-Type", "image/jpeg");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send(e);
  }
});

module.exports = router;
