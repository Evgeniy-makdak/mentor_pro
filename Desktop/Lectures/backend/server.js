require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'mentor_pro_secret';
const DB_PATH = process.env.DB_PATH || '/backend/database.db';

// Middleware
app.use(cors({
  origin: ['https://evgeniy-makdak.github.io', 'http://localhost:3000', 'http://localhost:3001', 'http://192.168.161.87:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static('/backend/uploads'));

// Database initialization
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('mentor', 'student')),
    full_name TEXT NOT NULL,
    email TEXT,
    group_id INTEGER,
    notes TEXT,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS disciplines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS group_disciplines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    discipline_id INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
    UNIQUE(group_id, discipline_id)
  );

  CREATE TABLE IF NOT EXISTS lectures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discipline_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lecture_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lecture_id INTEGER NOT NULL UNIQUE,
    time_limit_minutes INTEGER NOT NULL,
    session_lifetime_minutes INTEGER NOT NULL,
    start_datetime TEXT NOT NULL,
    attempts_allowed INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_retake INTEGER NOT NULL DEFAULT 0,
    original_test_id INTEGER,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    weight REAL NOT NULL DEFAULT 1.0,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    answer_text TEXT NOT NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_test_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    score REAL DEFAULT 0,
    total_possible REAL DEFAULT 0,
    grade INTEGER,
    is_completed INTEGER NOT NULL DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answer_id INTEGER,
    is_correct INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (attempt_id) REFERENCES user_test_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER,
    subject TEXT,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    parent_id INTEGER,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES feedback(id) ON DELETE SET NULL
  );
`);

// Create default admin if not exists
const adminExists = db.prepare('SELECT id FROM users WHERE login = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin', 10);
  db.prepare('INSERT INTO users (login, password_hash, role, full_name, email) VALUES (?, ?, ?, ?, ?)').run('admin', hash, 'mentor', 'Администратор', 'admin@mentorpro.ru');
  console.log('Default admin account created: admin / admin');
}

// ============ Multer configuration ============
// Функция для декодирования имени файла из ISO-8859-1 в UTF-8
// Multer по умолчанию интерпретирует заголовки как ISO-8859-1, что ломает кириллицу
function decodeFileName(filename) {
  if (!filename) return filename;
  try {
    // Преобразуем строку как если бы она была в ISO-8859-1, но на самом деле это UTF-8 байты
    const buffer = Buffer.from(filename, 'latin1');
    const decoded = buffer.toString('utf8');
    // Проверяем, что декодирование прошло успешно (нет replacement characters)
    if (decoded && !decoded.includes('\uFFFD')) {
      return decoded;
    }
    return filename;
  } catch (e) {
    return filename;
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = '/backend/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// Middleware для декодирования имён файлов после multer
function decodeFileNames(req, res, next) {
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(file => {
      file.originalname = decodeFileName(file.originalname);
    });
  }
  if (req.file) {
    req.file.originalname = decodeFileName(req.file.originalname);
  }
  next();
}

// ============ Auth Middleware ============
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Неверный или просроченный токен' });
  }
}

function requireMentor(req, res, next) {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  next();
}

// ============ Auth Routes ============
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
  }
  const user = db.prepare('SELECT * FROM users WHERE login = ?').get(login);
  if (!user) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }
  const token = jwt.sign(
    { id: user.id, login: user.login, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({
    token,
    user: {
      id: user.id,
      login: user.login,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      group_id: user.group_id
    }
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, login, role, full_name, email, group_id FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ============ Disciplines Routes ============
app.get('/api/disciplines', authenticate, (req, res) => {
  if (req.user.role === 'mentor') {
    const disciplines = db.prepare('SELECT * FROM disciplines ORDER BY id DESC').all();
    // Attach groups to each discipline
    const result = disciplines.map(d => {
      const groups = db.prepare(`
        SELECT g.* FROM groups g
        JOIN group_disciplines gd ON g.id = gd.group_id
        WHERE gd.discipline_id = ?
      `).all(d.id);
      return { ...d, groups };
    });
    return res.json(result);
  } else {
    // Student: only disciplines linked to their group
    const user = db.prepare('SELECT group_id FROM users WHERE id = ?').get(req.user.id);
    if (!user || !user.group_id) return res.json([]);
    const disciplines = db.prepare(`
      SELECT d.* FROM disciplines d
      JOIN group_disciplines gd ON d.id = gd.discipline_id
      WHERE gd.group_id = ?
      ORDER BY d.id DESC
    `).all(user.group_id);
    return res.json(disciplines);
  }
});

app.post('/api/disciplines', authenticate, requireMentor, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Название дисциплины обязательно' });
  }
  const result = db.prepare('INSERT INTO disciplines (name) VALUES (?)').run(name.trim());
  const discipline = db.prepare('SELECT * FROM disciplines WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(discipline);
});

app.put('/api/disciplines/:id', authenticate, requireMentor, (req, res) => {
  const { name } = req.body;
  db.prepare('UPDATE disciplines SET name = ? WHERE id = ?').run(name, req.params.id);
  const discipline = db.prepare('SELECT * FROM disciplines WHERE id = ?').get(req.params.id);
  res.json(discipline);
});

app.delete('/api/disciplines/:id', authenticate, requireMentor, (req, res) => {
  db.prepare('DELETE FROM disciplines WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Link discipline to group
app.post('/api/disciplines/:id/groups/:groupId', authenticate, requireMentor, (req, res) => {
  try {
    db.prepare('INSERT OR IGNORE INTO group_disciplines (group_id, discipline_id) VALUES (?, ?)').run(req.params.groupId, req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Ошибка привязки' });
  }
});

app.delete('/api/disciplines/:id/groups/:groupId', authenticate, requireMentor, (req, res) => {
  db.prepare('DELETE FROM group_disciplines WHERE group_id = ? AND discipline_id = ?').run(req.params.groupId, req.params.id);
  res.json({ success: true });
});

app.get('/api/disciplines/:id/groups', authenticate, requireMentor, (req, res) => {
  const groups = db.prepare(`
    SELECT g.* FROM groups g
    JOIN group_disciplines gd ON g.id = gd.group_id
    WHERE gd.discipline_id = ?
  `).all(req.params.id);
  res.json(groups);
});

// ============ Groups Routes ============
app.get('/api/groups', authenticate, (req, res) => {
  const groups = db.prepare('SELECT * FROM groups ORDER BY id DESC').all();
  res.json(groups);
});

app.post('/api/groups', authenticate, requireMentor, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Название группы обязательно' });
  }
  const result = db.prepare('INSERT INTO groups (name) VALUES (?)').run(name.trim());
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(group);
});

app.put('/api/groups/:id', authenticate, requireMentor, (req, res) => {
  const { name } = req.body;
  db.prepare('UPDATE groups SET name = ? WHERE id = ?').run(name, req.params.id);
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  res.json(group);
});

app.delete('/api/groups/:id', authenticate, requireMentor, (req, res) => {
  db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ Students Routes ============
app.get('/api/students', authenticate, requireMentor, (req, res) => {
  const { group_id } = req.query;
  let query = `SELECT u.id, u.login, u.full_name, u.email, u.group_id, u.notes, g.name as group_name 
               FROM users u LEFT JOIN groups g ON u.group_id = g.id WHERE u.role = 'student'`;
  const params = [];
  if (group_id) {
    query += ' AND u.group_id = ?';
    params.push(group_id);
  }
  query += ' ORDER BY u.full_name';
  const students = db.prepare(query).all(...params);
  res.json(students);
});

app.post('/api/students', authenticate, requireMentor, (req, res) => {
  const { login, password, full_name, email, group_id, notes } = req.body;
  if (!login || !login.trim() || !password || !password.trim() || !full_name || !full_name.trim()) {
    return res.status(400).json({ error: 'Логин, пароль и ФИО обязательны' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE login = ?').get(login.trim());
  if (existing) {
    return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (login, password_hash, role, full_name, email, group_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    login.trim(), hash, 'student', full_name.trim(), email || null, group_id || null, notes || null
  );
  const student = db.prepare(`SELECT u.id, u.login, u.full_name, u.email, u.group_id, u.notes, g.name as group_name 
                               FROM users u LEFT JOIN groups g ON u.group_id = g.id WHERE u.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(student);
});

app.put('/api/students/:id', authenticate, requireMentor, (req, res) => {
  const { login, full_name, email, group_id, notes, password } = req.body;
  const student = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'student');
  if (!student) return res.status(404).json({ error: 'Студент не найден' });
  
  if (login && login !== student.login) {
    const existing = db.prepare('SELECT id FROM users WHERE login = ? AND id != ?').get(login, req.params.id);
    if (existing) return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
  }
  
  if (password && password.trim()) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.params.id);
  }
  
  db.prepare('UPDATE users SET login = ?, full_name = ?, email = ?, group_id = ?, notes = ? WHERE id = ?').run(
    login || student.login, full_name || student.full_name, email || student.email, group_id !== undefined ? group_id : student.group_id, notes !== undefined ? notes : student.notes, req.params.id
  );
  
  const updated = db.prepare(`SELECT u.id, u.login, u.full_name, u.email, u.group_id, u.notes, g.name as group_name 
                              FROM users u LEFT JOIN groups g ON u.group_id = g.id WHERE u.id = ?`).get(req.params.id);
  res.json(updated);
});

app.delete('/api/students/:id', authenticate, requireMentor, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(req.params.id, 'student');
  res.json({ success: true });
});

// ============ Lectures Routes ============
app.get('/api/disciplines/:disciplineId/lectures', authenticate, (req, res) => {
  const lectures = db.prepare('SELECT * FROM lectures WHERE discipline_id = ? ORDER BY order_index, created_at').all(req.params.disciplineId);
  // Attach materials for each lecture
  const result = lectures.map(lecture => {
    const materials = db.prepare('SELECT * FROM materials WHERE lecture_id = ?').all(lecture.id);
    const test = db.prepare('SELECT * FROM tests WHERE lecture_id = ?').get(lecture.id);
    return { ...lecture, materials, test: test || null };
  });
  res.json(result);
});

app.post('/api/lectures', authenticate, requireMentor, (req, res) => {
  const { discipline_id, title, description, order_index } = req.body;
  if (!discipline_id || !title) {
    return res.status(400).json({ error: 'Дисциплина и заголовок обязательны' });
  }
  const maxOrder = db.prepare('SELECT MAX(order_index) as maxOrder FROM lectures WHERE discipline_id = ?').get(discipline_id);
  const nextOrder = (maxOrder?.maxOrder || 0) + 1;
  const result = db.prepare('INSERT INTO lectures (discipline_id, title, description, order_index) VALUES (?, ?, ?, ?)').run(
    discipline_id, title, description || null, order_index || nextOrder
  );
  const lecture = db.prepare('SELECT * FROM lectures WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...lecture, materials: [], test: null });
});

app.put('/api/lectures/:id', authenticate, requireMentor, (req, res) => {
  const { title, description, order_index } = req.body;
  db.prepare('UPDATE lectures SET title = ?, description = ?, order_index = ? WHERE id = ?').run(title, description, order_index, req.params.id);
  const lecture = db.prepare('SELECT * FROM lectures WHERE id = ?').get(req.params.id);
  const materials = db.prepare('SELECT * FROM materials WHERE lecture_id = ?').all(lecture.id);
  const test = db.prepare('SELECT * FROM tests WHERE lecture_id = ?').get(lecture.id);
  res.json({ ...lecture, materials, test: test || null });
});

app.delete('/api/lectures/:id', authenticate, requireMentor, (req, res) => {
  // Delete associated files
  const materials = db.prepare('SELECT * FROM materials WHERE lecture_id = ?').all(req.params.id);
  materials.forEach(m => {
    const filePath = path.join('/backend', m.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
  db.prepare('DELETE FROM lectures WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.put('/api/lectures/reorder', authenticate, requireMentor, (req, res) => {
  const { items } = req.body; // [{id, order_index}]
  const update = db.prepare('UPDATE lectures SET order_index = ? WHERE id = ?');
  const transaction = db.transaction(() => {
    items.forEach(item => update.run(item.order_index, item.id));
  });
  transaction();
  res.json({ success: true });
});

// ============ Materials (File download) ============
app.get('/api/materials/:id/download', (req, res) => {
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!material) return res.status(404).json({ error: 'Файл не найден' });
  
  const filePath = path.join('/backend', material.file_path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Файл не найден на сервере' });
  }
  
  // Определяем MIME тип
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed'
  };
  
  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${material.file_name}"`);
  res.sendFile(filePath);
});

// ============ Materials (File upload) ============
app.post('/api/lectures/:lectureId/materials', authenticate, requireMentor, upload.array('files', 20), decodeFileNames, (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Файлы не загружены' });
  }
  const materials = [];
  const insert = db.prepare('INSERT INTO materials (lecture_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?)');
  for (const file of files) {
    const filePath = 'uploads/' + file.filename;
    // Имя файла декодировано в middleware decodeFileNames
    const result = insert.run(req.params.lectureId, file.originalname, filePath, file.mimetype);
    materials.push({
      id: result.lastInsertRowid,
      lecture_id: parseInt(req.params.lectureId),
      file_name: file.originalname,
      file_path: filePath,
      file_type: file.mimetype
    });
  }
  res.status(201).json(materials);
});

app.delete('/api/materials/:id', authenticate, requireMentor, (req, res) => {
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (material) {
    const filePath = path.join('/backend', material.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  }
  res.json({ success: true });
});

// ============ Tests Routes ============
app.get('/api/tests', authenticate, requireMentor, (req, res) => {
  const tests = db.prepare('SELECT * FROM tests ORDER BY start_datetime DESC').all();
  res.json(tests);
});

app.get('/api/tests/:id', authenticate, (req, res) => {
  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(req.params.id);
  if (!test) return res.status(404).json({ error: 'Тест не найден' });
  const questions = db.prepare('SELECT * FROM questions WHERE test_id = ?').all(test.id);
  const questionsWithAnswers = questions.map(q => {
    const answers = db.prepare('SELECT * FROM answers WHERE question_id = ?').all(q.id);
    // For students, don't reveal correct answers
    if (req.user.role === 'student') {
      return { ...q, answers: answers.map(a => ({ id: a.id, answer_text: a.answer_text })) };
    }
    return { ...q, answers };
  });
  res.json({ ...test, questions: questionsWithAnswers });
});

app.post('/api/tests', authenticate, requireMentor, (req, res) => {
  const { lecture_id, time_limit_minutes, session_lifetime_minutes, start_datetime, attempts_allowed, is_retake, original_test_id } = req.body;
  if (!lecture_id || !start_datetime) {
    return res.status(400).json({ error: 'Лекция и дата старта обязательны' });
  }
  // Check if test already exists for this lecture (not a retake)
  if (!is_retake) {
    const existing = db.prepare('SELECT id FROM tests WHERE lecture_id = ?').get(lecture_id);
    if (existing) {
      return res.status(400).json({ error: 'Тест для этой лекции уже существует. Используйте функцию пересдачи.' });
    }
  }
  const result = db.prepare(
    'INSERT INTO tests (lecture_id, time_limit_minutes, session_lifetime_minutes, start_datetime, attempts_allowed, is_retake, original_test_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(lecture_id, time_limit_minutes || 30, session_lifetime_minutes || 10, start_datetime, attempts_allowed || 1, is_retake ? 1 : 0, original_test_id || null);
  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...test, questions: [] });
});

app.put('/api/tests/:id', authenticate, requireMentor, (req, res) => {
  const { time_limit_minutes, session_lifetime_minutes, start_datetime, attempts_allowed, is_active } = req.body;
  db.prepare(
    'UPDATE tests SET time_limit_minutes = ?, session_lifetime_minutes = ?, start_datetime = ?, attempts_allowed = ?, is_active = ? WHERE id = ?'
  ).run(time_limit_minutes, session_lifetime_minutes, start_datetime, attempts_allowed, is_active !== undefined ? is_active : 1, req.params.id);
  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(req.params.id);
  const questions = db.prepare('SELECT * FROM questions WHERE test_id = ?').all(test.id);
  const questionsWithAnswers = questions.map(q => {
    const answers = db.prepare('SELECT * FROM answers WHERE question_id = ?').all(q.id);
    return { ...q, answers };
  });
  res.json({ ...test, questions: questionsWithAnswers });
});

app.delete('/api/tests/:id', authenticate, requireMentor, (req, res) => {
  db.prepare('DELETE FROM tests WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ Questions Routes ============
app.post('/api/tests/:testId/questions', authenticate, requireMentor, (req, res) => {
  const { question_text, weight } = req.body;
  if (!question_text) return res.status(400).json({ error: 'Текст вопроса обязателен' });
  const result = db.prepare('INSERT INTO questions (test_id, question_text, weight) VALUES (?, ?, ?)').run(req.params.testId, question_text, weight || 1.0);
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...question, answers: [] });
});

app.put('/api/questions/:id', authenticate, requireMentor, (req, res) => {
  const { question_text, weight } = req.body;
  db.prepare('UPDATE questions SET question_text = ?, weight = ? WHERE id = ?').run(question_text, weight, req.params.id);
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  const answers = db.prepare('SELECT * FROM answers WHERE question_id = ?').all(question.id);
  res.json({ ...question, answers });
});

app.delete('/api/questions/:id', authenticate, requireMentor, (req, res) => {
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ Answers Routes ============
app.post('/api/questions/:questionId/answers', authenticate, requireMentor, (req, res) => {
  const { answer_text, is_correct } = req.body;
  if (!answer_text) return res.status(400).json({ error: 'Текст ответа обязателен' });
  const result = db.prepare('INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)').run(req.params.questionId, answer_text, is_correct ? 1 : 0);
  const answer = db.prepare('SELECT * FROM answers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(answer);
});

app.put('/api/answers/:id', authenticate, requireMentor, (req, res) => {
  const { answer_text, is_correct } = req.body;
  db.prepare('UPDATE answers SET answer_text = ?, is_correct = ? WHERE id = ?').run(answer_text, is_correct ? 1 : 0, req.params.id);
  const answer = db.prepare('SELECT * FROM answers WHERE id = ?').get(req.params.id);
  res.json(answer);
});

app.delete('/api/answers/:id', authenticate, requireMentor, (req, res) => {
  db.prepare('DELETE FROM answers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ Student: Get my tests for a lecture ============
app.get('/api/student/lectures/:lectureId/test-info', authenticate, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Доступ запрещён' });
  
  const test = db.prepare('SELECT * FROM tests WHERE lecture_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1').get(req.params.lectureId);
  if (!test) return res.json({ test: null, attempts: [], active: false });
  
  const now = new Date();
  const startTime = new Date(test.start_datetime);
  const endTime = new Date(startTime.getTime() + test.session_lifetime_minutes * 60000);
  const isActive = now >= startTime && now <= endTime;
  
  const attempts = db.prepare('SELECT * FROM user_test_attempts WHERE user_id = ? AND test_id = ? ORDER BY attempt_number DESC').all(req.user.id, test.id);
  const attemptsUsed = attempts.length;
  const canAttempt = attemptsUsed < test.attempts_allowed;
  
  // Get last attempt details
  let lastAttempt = null;
  if (attempts.length > 0) {
    lastAttempt = attempts[0];
    const userAnswers = db.prepare(`
      SELECT ua.*, q.question_text, q.weight, a.answer_text as selected_answer_text,
      (SELECT answer_text FROM answers WHERE id = ua.selected_answer_id) as student_answer
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      LEFT JOIN answers a ON ua.selected_answer_id = a.id
      WHERE ua.attempt_id = ?
    `).all(lastAttempt.id);
    lastAttempt = { ...lastAttempt, answers: userAnswers };
  }
  
  // Calculate grade
  let grade = null;
  if (lastAttempt && lastAttempt.is_completed) {
    const totalPossible = lastAttempt.total_possible || 1;
    const percentage = (lastAttempt.score / totalPossible) * 100;
    if (percentage >= 80) grade = 5;
    else if (percentage >= 60) grade = 4;
    else if (percentage >= 40) grade = 3;
    else if (percentage >= 20) grade = 2;
    else grade = 1;
  }
  
  res.json({
    test,
    isActive: isActive && canAttempt,
    canAttempt,
    attemptsUsed,
    attemptsAllowed: test.attempts_allowed,
    lastAttempt: lastAttempt ? { ...lastAttempt, grade } : null
  });
});

// ============ Student: Start test ============
app.post('/api/student/tests/:testId/start', authenticate, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Доступ запрещён' });

  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(req.params.testId);
  if (!test) return res.status(404).json({ error: 'Тест не найден' });

  const now = new Date();
  const startTime = new Date(test.start_datetime);
  const endTime = new Date(startTime.getTime() + test.session_lifetime_minutes * 60000);
  
  if (now < startTime || now > endTime) {
    return res.status(400).json({ error: 'Тест недоступен в данный момент' });
  }

  const attemptsUsed = db.prepare('SELECT COUNT(*) as cnt FROM user_test_attempts WHERE user_id = ? AND test_id = ?').get(req.user.id, test.id).cnt;
  if (attemptsUsed >= test.attempts_allowed) {
    return res.status(400).json({ error: 'Исчерпаны все попытки' });
  }

  // Check for existing incomplete attempt
  const existing = db.prepare('SELECT * FROM user_test_attempts WHERE user_id = ? AND test_id = ? AND is_completed = 0 ORDER BY id DESC LIMIT 1').get(req.user.id, test.id);
  if (existing) {
    const questions = db.prepare('SELECT * FROM questions WHERE test_id = ?').all(test.id);
    const questionsData = questions.map(q => {
      const answers = db.prepare('SELECT id, answer_text FROM answers WHERE question_id = ?').all(q.id);
      const userAnswer = db.prepare('SELECT selected_answer_id FROM user_answers WHERE attempt_id = ? AND question_id = ?').get(existing.id, q.id);
      return { ...q, answers, selected_answer_id: userAnswer?.selected_answer_id || null };
    });
    return res.json({ attempt: existing, questions: questionsData });
  }

  // Create new attempt
  const attemptNumber = attemptsUsed + 1;
  const questions = db.prepare('SELECT * FROM questions WHERE test_id = ?').all(test.id);
  let totalPossible = 0;
  questions.forEach(q => { totalPossible += q.weight; });

  const result = db.prepare('INSERT INTO user_test_attempts (user_id, test_id, attempt_number, total_possible, started_at) VALUES (?, ?, ?, ?, ?)').run(
    req.user.id, test.id, attemptNumber, totalPossible, new Date().toISOString()
  );
  const attempt = db.prepare('SELECT * FROM user_test_attempts WHERE id = ?').get(result.lastInsertRowid);

  const questionsData = questions.map(q => {
    const answers = db.prepare('SELECT id, answer_text FROM answers WHERE question_id = ?').all(q.id);
    return { ...q, answers, selected_answer_id: null };
  });

  res.json({ attempt, questions: questionsData });
});

// ============ Student: Save answer ============
app.post('/api/student/attempts/:attemptId/answers', authenticate, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Доступ запрещён' });
  
  const { question_id, selected_answer_id } = req.body;
  const attempt = db.prepare('SELECT * FROM user_test_attempts WHERE id = ? AND user_id = ?').get(req.params.attemptId, req.user.id);
  if (!attempt) return res.status(404).json({ error: 'Попытка не найдена' });
  if (attempt.is_completed) return res.status(400).json({ error: 'Тест уже завершён' });
  
  // Check if answer exists and is correct
  const answer = db.prepare('SELECT * FROM answers WHERE id = ?').get(selected_answer_id);
  const isCorrect = answer ? answer.is_correct : 0;
  
  // Upsert user_answer
  const existing = db.prepare('SELECT id FROM user_answers WHERE attempt_id = ? AND question_id = ?').get(attempt.id, question_id);
  if (existing) {
    db.prepare('UPDATE user_answers SET selected_answer_id = ?, is_correct = ? WHERE id = ?').run(selected_answer_id, isCorrect, existing.id);
  } else {
    db.prepare('INSERT INTO user_answers (attempt_id, question_id, selected_answer_id, is_correct) VALUES (?, ?, ?, ?)').run(attempt.id, question_id, selected_answer_id, isCorrect);
  }
  
  res.json({ success: true });
});

// ============ Student: Submit/completed test ============
app.post('/api/student/attempts/:attemptId/submit', authenticate, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Доступ запрещён' });
  
  const attempt = db.prepare('SELECT * FROM user_test_attempts WHERE id = ? AND user_id = ?').get(req.params.attemptId, req.user.id);
  if (!attempt) return res.status(404).json({ error: 'Попытка не найдена' });
  if (attempt.is_completed) return res.status(400).json({ error: 'Тест уже завершён' });
  
  // Calculate score
  const userAnswers = db.prepare(`
    SELECT ua.*, q.weight FROM user_answers ua
    JOIN questions q ON ua.question_id = q.id
    WHERE ua.attempt_id = ?
  `).all(attempt.id);
  
  let score = 0;
  userAnswers.forEach(ua => {
    if (ua.is_correct) score += ua.weight;
  });
  
  const totalPossible = attempt.total_possible || 1;
  const percentage = (score / totalPossible) * 100;
  let grade = 1;
  if (percentage >= 80) grade = 5;
  else if (percentage >= 60) grade = 4;
  else if (percentage >= 40) grade = 3;
  else if (percentage >= 20) grade = 2;
  
  db.prepare('UPDATE user_test_attempts SET score = ?, is_completed = 1, grade = ?, finished_at = ? WHERE id = ?').run(
    score, grade, new Date().toISOString(), attempt.id
  );
  
  // Get detailed results
  const questions = db.prepare('SELECT * FROM questions WHERE test_id = ?').all(attempt.test_id);
  const results = questions.map(q => {
    const answers = db.prepare('SELECT * FROM answers WHERE question_id = ?').all(q.id);
    const userAnswer = db.prepare('SELECT * FROM user_answers WHERE attempt_id = ? AND question_id = ?').get(attempt.id, q.id);
    return {
      ...q,
      answers: answers.map(a => ({ ...a })),
      selected_answer_id: userAnswer?.selected_answer_id || null,
      is_correct: userAnswer?.is_correct || false
    };
  });
  
  res.json({
    score,
    totalPossible,
    percentage: Math.round(percentage * 100) / 100,
    grade,
    results
  });
});

// ============ Retakes ============
app.post('/api/tests/:testId/retake', authenticate, requireMentor, (req, res) => {
  const { start_datetime, session_lifetime_minutes, attempts_allowed, student_ids } = req.body;
  // student_ids: null = all students, or array of student IDs
  
  const originalTest = db.prepare('SELECT * FROM tests WHERE id = ?').get(req.params.testId);
  if (!originalTest) return res.status(404).json({ error: 'Тест не найден' });
  
  // Create new test as retake
  const result = db.prepare(
    'INSERT INTO tests (lecture_id, time_limit_minutes, session_lifetime_minutes, start_datetime, attempts_allowed, is_retake, original_test_id) VALUES (?, ?, ?, ?, ?, 1, ?)'
  ).run(
    originalTest.lecture_id,
    originalTest.time_limit_minutes,
    session_lifetime_minutes || originalTest.session_lifetime_minutes,
    start_datetime,
    attempts_allowed || originalTest.attempts_allowed,
    originalTest.id
  );
  const newTest = db.prepare('SELECT * FROM tests WHERE id = ?').get(result.lastInsertRowid);
  
  // Copy questions from original test
  const questions = db.prepare('SELECT * FROM questions WHERE test_id = ?').all(originalTest.id);
  for (const q of questions) {
    const qResult = db.prepare('INSERT INTO questions (test_id, question_text, weight) VALUES (?, ?, ?)').run(newTest.id, q.question_text, q.weight);
    const answers = db.prepare('SELECT * FROM answers WHERE question_id = ?').all(q.id);
    for (const a of answers) {
      db.prepare('INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)').run(qResult.lastInsertRowid, a.answer_text, a.is_correct);
    }
  }
  
  // Get students for notification
  let targetStudentIds = [];
  if (student_ids && student_ids.length > 0) {
    targetStudentIds = student_ids;
  } else {
    // All students in the groups linked to this discipline
    const lecture = db.prepare('SELECT * FROM lectures WHERE id = ?').get(originalTest.lecture_id);
    if (lecture) {
      const students = db.prepare(`
        SELECT DISTINCT u.id FROM users u
        JOIN group_disciplines gd ON u.group_id = gd.group_id
        WHERE gd.discipline_id = ? AND u.role = 'student'
      `).all(lecture.discipline_id);
      targetStudentIds = students.map(s => s.id);
    }
  }
  
  res.status(201).json({ test: newTest, targetStudentIds });
});

// ============ Reports ============
app.get('/api/reports/group/:groupId', authenticate, requireMentor, (req, res) => {
  const students = db.prepare('SELECT * FROM users WHERE group_id = ? AND role = \'student\'').all(req.params.groupId);
  const disciplines = db.prepare(`
    SELECT d.* FROM disciplines d
    JOIN group_disciplines gd ON d.id = gd.discipline_id
    WHERE gd.group_id = ?
  `).all(req.params.groupId);
  
  const report = students.map(student => {
    const studentDisciplines = disciplines.map(discipline => {
      const lectures = db.prepare('SELECT * FROM lectures WHERE discipline_id = ?').all(discipline.id);
      let totalGrade = 0;
      let testCount = 0;
      
      lectures.forEach(lecture => {
        const tests = db.prepare('SELECT * FROM tests WHERE lecture_id = ? ORDER BY id DESC').all(lecture.id);
        tests.forEach(test => {
          const attempt = db.prepare('SELECT * FROM user_test_attempts WHERE user_id = ? AND test_id = ? AND is_completed = 1 ORDER BY id DESC LIMIT 1').get(student.id, test.id);
          if (attempt && attempt.grade) {
            totalGrade += attempt.grade;
            testCount++;
          }
        });
      });
      
      return {
        discipline_id: discipline.id,
        discipline_name: discipline.name,
        avgGrade: testCount > 0 ? Math.round((totalGrade / testCount) * 100) / 100 : null,
        testsCompleted: testCount
      };
    });
    
    return { student, disciplines: studentDisciplines };
  });
  
  res.json(report);
});

app.get('/api/reports/discipline/:disciplineId', authenticate, requireMentor, (req, res) => {
  const discipline = db.prepare('SELECT * FROM disciplines WHERE id = ?').get(req.params.disciplineId);
  const lectures = db.prepare('SELECT * FROM lectures WHERE discipline_id = ? ORDER BY order_index').all(req.params.disciplineId);
  const groups = db.prepare(`
    SELECT g.* FROM groups g
    JOIN group_disciplines gd ON g.id = gd.group_id
    WHERE gd.discipline_id = ?
  `).all(req.params.disciplineId);
  
  let allStudents = [];
  groups.forEach(group => {
    const students = db.prepare('SELECT * FROM users WHERE group_id = ? AND role = \'student\'').all(group.id);
    students.forEach(s => allStudents.push({ ...s, group_name: group.name }));
  });
  
  const matrix = allStudents.map(student => {
    const lectureResults = lectures.map(lecture => {
      const tests = db.prepare('SELECT * FROM tests WHERE lecture_id = ? ORDER BY id DESC').all(lecture.id);
      let bestAttempt = null;
      tests.forEach(test => {
        const attempt = db.prepare('SELECT * FROM user_test_attempts WHERE user_id = ? AND test_id = ? AND is_completed = 1 ORDER BY score DESC LIMIT 1').get(student.id, test.id);
        if (attempt) {
          const percentage = attempt.total_possible > 0 ? (attempt.score / attempt.total_possible) * 100 : 0;
          if (!bestAttempt || percentage > (bestAttempt.total_possible > 0 ? (bestAttempt.score / bestAttempt.total_possible) * 100 : 0)) {
            bestAttempt = { ...attempt, percentage: Math.round(percentage * 100) / 100 };
          }
        }
      });
      return {
        lecture_id: lecture.id,
        lecture_title: lecture.title,
        attempt: bestAttempt
      };
    });
    return { student, lectures: lectureResults };
  });
  
  res.json({ discipline, matrix });
});

// Export CSV
app.get('/api/reports/discipline/:disciplineId/export', authenticate, requireMentor, (req, res) => {
  const discipline = db.prepare('SELECT * FROM disciplines WHERE id = ?').get(req.params.disciplineId);
  const lectures = db.prepare('SELECT * FROM lectures WHERE discipline_id = ? ORDER BY order_index').all(req.params.disciplineId);
  const groups = db.prepare(`
    SELECT g.* FROM groups g
    JOIN group_disciplines gd ON g.id = gd.group_id
    WHERE gd.discipline_id = ?
  `).all(req.params.disciplineId);
  
  let allStudents = [];
  groups.forEach(group => {
    const students = db.prepare('SELECT * FROM users WHERE group_id = ? AND role = \'student\'').all(group.id);
    students.forEach(s => allStudents.push({ ...s, group_name: group.name }));
  });
  
  // Build CSV
  let csv = 'Студент,Группа';
  lectures.forEach(l => {
    csv += `,"${l.title.replace(/"/g, '""')} (оценка)","${l.title.replace(/"/g, '""')} (баллы)"`;
  });
  csv += '\n';
  
  allStudents.forEach(student => {
    csv += `"${student.full_name}",${student.group_name || ''}`;
    lectures.forEach(lecture => {
      const tests = db.prepare('SELECT * FROM tests WHERE lecture_id = ? ORDER BY id DESC').all(lecture.id);
      let bestAttempt = null;
      tests.forEach(test => {
        const attempt = db.prepare('SELECT * FROM user_test_attempts WHERE user_id = ? AND test_id = ? AND is_completed = 1 ORDER BY score DESC LIMIT 1').get(student.id, test.id);
        if (attempt) {
          const percentage = attempt.total_possible > 0 ? (attempt.score / attempt.total_possible) * 100 : 0;
          if (!bestAttempt || percentage > (bestAttempt.total_possible > 0 ? (bestAttempt.score / bestAttempt.total_possible) * 100 : 0)) {
            bestAttempt = { ...attempt, percentage: Math.round(percentage * 100) / 100 };
          }
        }
      });
      csv += `,${bestAttempt ? bestAttempt.grade : '-'},${bestAttempt ? bestAttempt.score + '/' + bestAttempt.total_possible : '-'}`;
    });
    csv += '\n';
  });
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=report_${discipline.name}.csv`);
  res.send('\uFEFF' + csv); // BOM for Excel
});

// ============ Not passed test students ============
app.get('/api/reports/not-passed/:testId', authenticate, requireMentor, (req, res) => {
  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(req.params.testId);
  if (!test) return res.status(404).json({ error: 'Тест не найден' });
  
  const lecture = db.prepare('SELECT * FROM lectures WHERE id = ?').get(test.lecture_id);
  const groups = db.prepare(`
    SELECT g.* FROM groups g
    JOIN group_disciplines gd ON g.id = gd.group_id
    WHERE gd.discipline_id = ?
  `).all(lecture.discipline_id);
  
  let allStudents = [];
  groups.forEach(group => {
    const students = db.prepare('SELECT * FROM users WHERE group_id = ? AND role = \'student\'').all(group.id);
    students.forEach(s => allStudents.push({ ...s, group_name: group.name }));
  });
  
  const notPassed = allStudents.filter(student => {
    const attempt = db.prepare('SELECT * FROM user_test_attempts WHERE user_id = ? AND test_id = ? AND is_completed = 1 ORDER BY id DESC LIMIT 1').get(student.id, test.id);
    return !attempt || (attempt.grade && attempt.grade < 3);
  });
  
  const bestStudents = allStudents.filter(student => {
    const attempt = db.prepare('SELECT * FROM user_test_attempts WHERE user_id = ? AND test_id = ? AND is_completed = 1 ORDER BY score DESC LIMIT 1').get(student.id, test.id);
    return attempt && attempt.grade && attempt.grade >= 4;
  }).sort((a, b) => {
    const attemptA = db.prepare('SELECT * FROM user_test_attempts WHERE user_id = ? AND test_id = ? AND is_completed = 1 ORDER BY score DESC LIMIT 1').get(a.id, test.id);
    const attemptB = db.prepare('SELECT * FROM user_test_attempts WHERE user_id = ? AND test_id = ? AND is_completed = 1 ORDER BY score DESC LIMIT 1').get(b.id, test.id);
    return (attemptB?.score || 0) - (attemptA?.score || 0);
  });
  
  res.json({ notPassed, bestStudents });
});

// ============ Feedback ============
app.post('/api/feedback', authenticate, (req, res) => {
  const { subject, message } = req.body;
  if (!message) return res.status(400).json({ error: 'Сообщение обязательно' });
  
  let toUserId = null;
  if (req.user.role === 'student') {
    // Get mentor
    const mentor = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('mentor');
    toUserId = mentor ? mentor.id : null;
  }
  
  const result = db.prepare('INSERT INTO feedback (from_user_id, to_user_id, subject, message) VALUES (?, ?, ?, ?)').run(
    req.user.id, toUserId, subject || null, message
  );
  const feedback = db.prepare('SELECT * FROM feedback WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(feedback);
});

app.get('/api/feedback', authenticate, (req, res) => {
  let feedbacks;
  if (req.user.role === 'mentor') {
    feedbacks = db.prepare(`
      SELECT f.*, u.full_name as from_name, u.login as from_login
      FROM feedback f JOIN users u ON f.from_user_id = u.id
      WHERE f.parent_id IS NULL
      ORDER BY f.created_at DESC
    `).all();
  } else {
    feedbacks = db.prepare(`
      SELECT f.*, u.full_name as from_name
      FROM feedback f JOIN users u ON f.from_user_id = u.id
      WHERE f.from_user_id = ? AND f.parent_id IS NULL
      ORDER BY f.created_at DESC
    `).all(req.user.id);
  }
  res.json(feedbacks);
});

app.post('/api/feedback/:id/reply', authenticate, requireMentor, (req, res) => {
  const { message } = req.body;
  const original = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.id);
  if (!original) return res.status(404).json({ error: 'Сообщение не найдено' });
  
  const result = db.prepare('INSERT INTO feedback (from_user_id, to_user_id, subject, message, parent_id) VALUES (?, ?, ?, ?, ?)').run(
    req.user.id, original.from_user_id, 'Re: ' + (original.subject || ''), message, original.id
  );
  const reply = db.prepare('SELECT * FROM feedback WHERE id = ?').get(result.lastInsertRowid);
  
  // Mark original as read
  db.prepare('UPDATE feedback SET is_read = 1 WHERE id = ?').run(original.id);
  
  res.status(201).json(reply);
});

// ============ Dashboard stats ============
app.get('/api/dashboard', authenticate, requireMentor, (req, res) => {
  const totalStudents = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role = ?').get('student').cnt;
  const totalDisciplines = db.prepare('SELECT COUNT(*) as cnt FROM disciplines').get().cnt;
  const totalGroups = db.prepare('SELECT COUNT(*) as cnt FROM groups').get().cnt;
  const totalTests = db.prepare('SELECT COUNT(*) as cnt FROM tests WHERE is_active = 1').get().cnt;
  
  // Recent attempts
  const recentAttempts = db.prepare(`
    SELECT uta.*, u.full_name as student_name, t.start_datetime, l.title as lecture_title
    FROM user_test_attempts uta
    JOIN users u ON uta.user_id = u.id
    JOIN tests t ON uta.test_id = t.id
    JOIN lectures l ON t.lecture_id = l.id
    ORDER BY uta.started_at DESC LIMIT 10
  `).all();
  
  const unreadFeedback = db.prepare('SELECT COUNT(*) as cnt FROM feedback WHERE is_read = 0 AND parent_id IS NULL').get().cnt;
  
  res.json({
    totalStudents,
    totalDisciplines,
    totalGroups,
    totalTests,
    recentAttempts,
    unreadFeedback
  });
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Mentor Pro server running on port ${PORT}`);
});