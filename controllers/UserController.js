import bcrypt from "bcrypt";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const doc = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      passwordHash: hash,
      avatarUrl: req.body.avatarUrl
    });

    const admin = await Admin.findOne({ email: req.body.email });

    if (admin) {
      doc.role = "admin";
    } else {
      doc.role = "user";
    }

    const user = await doc.save();

    const token = jwt.sign(
      {
        _id: user._id,
      },
      "secret",
      {
        expiresIn: "30d",
      }
    );
    const { passwordHash, ...userData } = user._doc;

    res.json({
      ...userData,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось зарегистрироваться",
    });
  }
};

export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        message: "Пользователь не найден",
      });
    }

    const isValidPass = await bcrypt.compare(
      req.body.password,
      user._doc.passwordHash
    );

    if (!isValidPass) {
      return res.status(400).json({
        message: "Неверный пароль",
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      "secret",
      {
        expiresIn: "30d",
      }
    );

    const { passwordHash, ...userData } = user._doc;

    res.json({
      ...userData,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось авторизоваться",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "Пользователь не найден",
      });
    }
    const { passwordHash, ...userData } = user._doc;

    res.json(userData);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Нет доступа",
    });
  }
};

export const getUserIdByFullName = async (req, res) => {
  const { fullName } = req.body;

  try {
    const user = await User.findOne({ fullName });
    if (user) {
      res.json({ user_id: user._id });
    } else {
      res.status(404).json({ message: "Пользователь не найден" });
    }
  } catch (error) {
    console.error("Ошибка при получении user_id:", error);
    res.status(500).json({ message: "Ошибка при получении user_id" });
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log("User ID:", userId); // Добавляем лог для проверки userId

    let updateData = req.body;
    console.log("Update Data:", updateData); // Добавляем лог для проверки updateData

    if (updateData.password) {
      // Хеширование нового пароля
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(updateData.password, salt);

      // Заменяем пароль в объекте updateData на его хеш
      updateData = { ...updateData, passwordHash };
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    console.log("Updated User:", updatedUser); // Добавляем лог для проверки обновленного пользователя

    if (!updatedUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Отправляем обновленные данные пользователя в ответе
    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Не удалось обновить данные пользователя" });
  }
};

export const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("fullName email avatarUrl");
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
