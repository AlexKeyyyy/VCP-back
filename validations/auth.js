import { body } from "express-validator";

export const registerValidator = [
  body("email", "Неверно указан email").isEmail(),
  body("password", "Пароль слишком короткий (минимум 5 символов)").isLength({
    min: 5,
  }),
  body("fullName", "Имя слишком короткое (минимум 3 символа)").isLength({
    min: 3,
  }),
  body("avatarUrl", "Это не ссылка").optional().isURL(),
];

export const loginValidator = [
  body("email", "Неверно указан email").isEmail(),
  body("password", "Пароль слишком короткий (минимум 5 символов)").isLength({
    min: 5,
  }),
];

export const userTasksCreateValidator = [
  body("outputData", "Введите выходные данные").isLength({ min: 1 }),
  body("codeText", "Введите код").isLength({ min: 10 }).isString(),
];

export const tasksCreateValidator = [
  body("taskText", "Введите задание").isLength({ min: 5 }).isString(),
  body("reference", "Введите эталонный код").isLength({ min: 10 }).isString(),
  body("inputData", "Введите тестировочные входные данные").isLength({
    min: 1,
  }),
  body("outputData", "Введите тестировочные выходные данные").isLength({
    min: 1,
  }),
];
