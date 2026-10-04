import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import {
  INITIAL_CONFIG,
  INITIAL_STUDENTS,
  INITIAL_TEAMS,
  INITIAL_USERS,
  INITIAL_CRITERIA,
  INITIAL_DAILY_SCORES,
  INITIAL_DAILY_COMMENTS,
  INITIAL_AUDIT_LOGS,
} from './src/data/initialData';

const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON with 50MB limit for high-res images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories for persistent storage
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const AVATARS_DIR = path.resolve(UPLOADS_DIR, 'avatars');
const LOGOS_DIR = path.resolve(UPLOADS_DIR, 'logos');
const BACKGROUNDS_DIR = path.resolve(UPLOADS_DIR, 'backgrounds');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR, AVATARS_DIR, LOGOS_DIR, BACKGROUNDS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper: Load database from disk or initialize
function loadDatabase(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && data.STUDENTS && data.CONFIG) {
        // Ensure SchoolName and teacher match official Class 4A3
        if (!data.CONFIG.SchoolName || data.CONFIG.SchoolName === 'Trường Tiểu học Thạnh Xuân') {
          data.CONFIG.SchoolName = 'Trường Tiểu học Thị Trấn Rạch Gòi A';
        }
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading database.json:', err);
  }

  // Initial seed database
  const seed = {
    CONFIG: { ...INITIAL_CONFIG, SchoolName: 'Trường Tiểu học Thị Trấn Rạch Gòi A' },
    USERS: [...INITIAL_USERS],
    STUDENTS: [...INITIAL_STUDENTS],
    TEAMS: [...INITIAL_TEAMS],
    CRITERIA: [...INITIAL_CRITERIA],
    DAILY_SCORES: [...INITIAL_DAILY_SCORES],
    DAILY_COMMENTS: [...INITIAL_DAILY_COMMENTS],
    WEEKLY_SUMMARY: [],
    MONTHLY_SUMMARY: [],
    AWARDS: [],
    AUDIT_LOG: [...INITIAL_AUDIT_LOGS],
  };

  saveDatabase(seed);
  return seed;
}

// Helper: Save database to disk
function saveDatabase(data: any): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database.json:', err);
  }
}

// In-memory cache of database
let db = loadDatabase();

// Helper to save Base64 data URL to file
function saveBase64ToFile(dataUrl: string, targetDir: string, filePrefix: string): string {
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let ext = 'jpg';
  let buffer: Buffer;

  if (matches && matches.length === 3) {
    const mime = matches[1];
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('svg')) ext = 'svg';
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    buffer = Buffer.from(dataUrl, 'base64');
  }

  const filename = `${filePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, buffer);
  return filename;
}

// Helper to remove old file if in /uploads
function removeOldUploadFile(publicUrl: string) {
  try {
    if (publicUrl && publicUrl.startsWith('/uploads/')) {
      const relPath = publicUrl.replace('/uploads/', '');
      const fullPath = path.join(UPLOADS_DIR, relPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (e) {
    console.warn('Could not remove old upload file:', e);
  }
}

// ==========================================================
// API ROUTES
// ==========================================================

// 1. Lấy toàn bộ cơ sở dữ liệu
app.get('/api/database', (_req, res) => {
  res.json({ success: true, data: db });
});

// 2. Đồng bộ / Lưu toàn bộ cơ sở dữ liệu
app.post('/api/database', (req, res) => {
  if (req.body && req.body.STUDENTS) {
    db = req.body;
    saveDatabase(db);
    return res.json({ success: true, message: 'Đã lưu cơ sở dữ liệu thành công.', data: db });
  }
  res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
});

// 3. Tải lên và lưu vĩnh viễn Avatar học sinh
app.post('/api/upload/avatar', (req, res) => {
  try {
    const { studentId, imageBase64 } = req.body;
    if (!studentId || !imageBase64) {
      return res.status(400).json({ success: false, message: 'Thiếu studentId hoặc ảnh imageBase64.' });
    }

    const student = db.STUDENTS.find((s: any) => s.StudentID === studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: `Không tìm thấy học sinh với ID ${studentId}.` });
    }

    // Xóa file ảnh cũ nếu có trên server
    if (student.AvatarURL) {
      removeOldUploadFile(student.AvatarURL);
    }

    // Lưu file mới vào thư mục /uploads/avatars/
    const filename = saveBase64ToFile(imageBase64, AVATARS_DIR, `avatar_${studentId}`);
    const fileUrl = `/uploads/avatars/${filename}`;

    // Cập nhật Database
    student.AvatarURL = fileUrl;
    student.UpdatedAt = new Date().toISOString();

    // Thêm nhật ký Audit
    if (Array.isArray(db.AUDIT_LOG)) {
      db.AUDIT_LOG.unshift({
        LogID: `LOG_${Date.now()}`,
        Timestamp: new Date().toISOString(),
        UserID: 'USR_001',
        Username: 'gvcn',
        Action: 'UPDATE_AVATAR',
        TargetSheet: 'STUDENTS',
        RecordID: studentId,
        Details: `Cập nhật ảnh đại diện sắc nét cho học sinh ${student.FullName}`,
        Status: 'SUCCESS',
      });
    }

    saveDatabase(db);

    console.log(`[Avatar Upload] Successfully saved permanent avatar for ${student.FullName}: ${fileUrl}`);
    res.json({
      success: true,
      message: `Đã lưu vĩnh viễn ảnh đại diện cho học sinh ${student.FullName}!`,
      data: {
        url: fileUrl,
        student,
      },
    });
  } catch (err: any) {
    console.error('Error handling avatar upload:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu ảnh avatar trên máy chủ: ' + err.message });
  }
});

// 4. Tải lên và lưu vĩnh viễn Logo Lớp
app.post('/api/upload/logo', (req, res) => {
  try {
    const { imageBase64 } = req.body;

    // Trường hợp reset logo mặc định (imageBase64 rỗng)
    if (!imageBase64) {
      if (db.CONFIG.LogoURL) {
        removeOldUploadFile(db.CONFIG.LogoURL);
      }
      db.CONFIG.LogoURL = '';
      saveDatabase(db);
      return res.json({
        success: true,
        message: 'Đã khôi phục logo mặc định của ứng dụng.',
        data: { url: '' },
      });
    }

    // Xóa logo cũ nếu có
    if (db.CONFIG.LogoURL) {
      removeOldUploadFile(db.CONFIG.LogoURL);
    }

    // Lưu logo mới vào /uploads/logos/
    const filename = saveBase64ToFile(imageBase64, LOGOS_DIR, 'class_logo');
    const fileUrl = `/uploads/logos/${filename}`;

    // Cập nhật cấu hình
    db.CONFIG.LogoURL = fileUrl;

    if (Array.isArray(db.AUDIT_LOG)) {
      db.AUDIT_LOG.unshift({
        LogID: `LOG_${Date.now()}`,
        Timestamp: new Date().toISOString(),
        UserID: 'USR_001',
        Username: 'gvcn',
        Action: 'UPDATE_LOGO',
        TargetSheet: 'CONFIG',
        RecordID: 'LOGO',
        Details: 'Cập nhật logo trường / lớp học mới',
        Status: 'SUCCESS',
      });
    }

    saveDatabase(db);

    console.log(`[Logo Upload] Successfully saved permanent class logo: ${fileUrl}`);
    res.json({
      success: true,
      message: 'Đã lưu vĩnh viễn logo lớp lên máy chủ!',
      data: { url: fileUrl },
    });
  } catch (err: any) {
    console.error('Error handling logo upload:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu logo trên máy chủ: ' + err.message });
  }
});

// 4b. Tải lên và lưu vĩnh viễn Hình nền / Ảnh bìa lớp (Chỉ Admin)
app.post('/api/upload/background', (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      if (db.CONFIG.BackgroundImageURL) {
        removeOldUploadFile(db.CONFIG.BackgroundImageURL);
      }
      db.CONFIG.BackgroundImageURL = '';
      saveDatabase(db);
      return res.json({
        success: true,
        message: 'Đã khôi phục hình nền mặc định của lớp học.',
        data: { url: '' },
      });
    }

    if (db.CONFIG.BackgroundImageURL) {
      removeOldUploadFile(db.CONFIG.BackgroundImageURL);
    }

    const filename = saveBase64ToFile(imageBase64, BACKGROUNDS_DIR, 'class_bg');
    const fileUrl = `/uploads/backgrounds/${filename}`;

    db.CONFIG.BackgroundImageURL = fileUrl;
    saveDatabase(db);

    console.log(`[Background Upload] Successfully saved permanent background: ${fileUrl}`);
    res.json({
      success: true,
      message: 'Đã cập nhật và lưu vĩnh viễn hình nền lớp học!',
      data: { url: fileUrl },
    });
  } catch (err: any) {
    console.error('Error handling background upload:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu hình nền trên máy chủ: ' + err.message });
  }
});

// 5. Cập nhật học sinh (Họ tên, Tổ, Chức vụ Ban cán sự, Điểm khởi tạo...)
app.post('/api/students/update', (req, res) => {
  try {
    const updated = req.body;
    if (!updated || !updated.StudentID) {
      return res.status(400).json({ success: false, message: 'Thiếu StudentID.' });
    }

    const idx = db.STUDENTS.findIndex((s: any) => s.StudentID === updated.StudentID);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh.' });
    }

    const currentStudent = db.STUDENTS[idx];
    const newRole = updated.ClassRole !== undefined ? updated.ClassRole : currentStudent.ClassRole;

    db.STUDENTS[idx] = {
      ...currentStudent,
      ...updated,
      UpdatedAt: new Date().toISOString(),
    };

    const targetStudent = db.STUDENTS[idx];

    // Tự động đồng bộ chức vụ Ban cán sự vào CONFIG và USERS
    if (newRole && newRole !== 'Thành viên' && newRole !== 'Thành viên (Không giữ chức vụ)') {
      if (newRole.includes('Lớp trưởng')) {
        if (db.CONFIG) db.CONFIG.ClassPresident = targetStudent.FullName;
        const u = db.USERS.find((x: any) => x.Username === 'loptruong');
        if (u) u.FullName = targetStudent.FullName;
      } else if (newRole.includes('Lớp phó trật tự')) {
        const u = db.USERS.find((x: any) => x.Username === 'photrattu');
        if (u) u.FullName = targetStudent.FullName;
      } else if (newRole.includes('Lớp phó lao động')) {
        const u = db.USERS.find((x: any) => x.Username === 'pholaodong');
        if (u) u.FullName = targetStudent.FullName;
      } else if (newRole.includes('Tổ trưởng')) {
        const teamNum = (targetStudent.TeamID || '').replace(/\D/g, '') || '1';
        const team = db.TEAMS.find((t: any) => t.TeamID === targetStudent.TeamID);
        if (team) team.TeamLeaderName = targetStudent.FullName;
        const u = db.USERS.find((x: any) => x.Username === 'totruong' + teamNum);
        if (u) u.FullName = targetStudent.FullName;
      }
    }

    saveDatabase(db);
    res.json({
      success: true,
      message: 'Cập nhật thông tin học sinh và đồng bộ chức vụ thành công.',
      data: db.STUDENTS[idx],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Thêm điểm thi đua (Score Record)
app.post('/api/scores/add', (req, res) => {
  try {
    const record = req.body;
    if (!record || !record.StudentID) {
      return res.status(400).json({ success: false, message: 'Dữ liệu chấm điểm không hợp lệ.' });
    }

    db.DAILY_SCORES.unshift(record);
    saveDatabase(db);
    res.json({ success: true, message: 'Đã lưu điểm thi đua lên máy chủ.', data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Xóa điểm thi đua
app.post('/api/scores/delete', (req, res) => {
  try {
    const { recordId } = req.body;
    db.DAILY_SCORES = db.DAILY_SCORES.filter((s: any) => s.RecordID !== recordId);
    saveDatabase(db);
    res.json({ success: true, message: 'Đã xóa bản ghi điểm trên máy chủ.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Đặt lại điểm thi đua về 0
app.post('/api/scores/reset', (req, res) => {
  try {
    db.DAILY_SCORES = [];
    if (Array.isArray(db.STUDENTS)) {
      db.STUDENTS.forEach((st: any) => {
        st.InitialScore = 0;
      });
    }
    saveDatabase(db);
    res.json({ success: true, message: 'Đã đặt lại toàn bộ điểm thi đua về 0 trên máy chủ.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Thêm / cập nhật nhận xét
app.post('/api/comments/add', (req, res) => {
  try {
    const comment = req.body;
    const existingIdx = db.DAILY_COMMENTS.findIndex((c: any) => c.CommentID === comment.CommentID);
    if (existingIdx !== -1) {
      db.DAILY_COMMENTS[existingIdx] = comment;
    } else {
      db.DAILY_COMMENTS.unshift(comment);
    }
    saveDatabase(db);
    res.json({ success: true, message: 'Đã lưu nhận xét học sinh lên máy chủ.', data: comment });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Đổi mật khẩu cá nhân (Người dùng tự đổi)
app.post('/api/users/change-password', (req, res) => {
  try {
    const { userId, currentPasswordHash, newPasswordHash } = req.body;
    if (!userId || !currentPasswordHash || !newPasswordHash) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đổi mật khẩu.' });
    }

    const user = db.USERS.find((u: any) => u.UserID === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    }

    if (user.PasswordHash !== currentPasswordHash && user.PasswordHash !== currentPasswordHash.trim()) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
    }

    user.PasswordHash = newPasswordHash;
    user.UpdatedAt = new Date().toISOString();

    // Đồng bộ alias nếu là Cô Phương
    if (user.Username === 'gv_tienganh') {
      const alias = db.USERS.find((u: any) => u.Username === 'cophuong');
      if (alias) alias.PasswordHash = newPasswordHash;
    } else if (user.Username === 'cophuong') {
      const mainU = db.USERS.find((u: any) => u.Username === 'gv_tienganh');
      if (mainU) mainU.PasswordHash = newPasswordHash;
    }

    if (Array.isArray(db.AUDIT_LOG)) {
      db.AUDIT_LOG.unshift({
        LogID: `LOG_${Date.now()}`,
        Timestamp: new Date().toISOString(),
        UserID: user.UserID,
        Username: user.Username,
        Action: 'CHANGE_PASSWORD',
        TargetSheet: 'USERS',
        RecordID: user.UserID,
        Details: 'Người dùng tự đổi mật khẩu tài khoản thành công',
        Status: 'SUCCESS',
      });
    }

    saveDatabase(db);
    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. Cấp lại mật khẩu thành viên (Chỉ GVCN - Admin)
app.post('/api/users/reset-password', (req, res) => {
  try {
    const { adminUserId, targetUserId, newPasswordHash } = req.body;
    if (!adminUserId || !targetUserId || !newPasswordHash) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin cấp lại mật khẩu.' });
    }

    const admin = db.USERS.find((u: any) => u.UserID === adminUserId);
    if (!admin || admin.Role !== 'ADMIN_GVCN') {
      return res.status(403).json({ success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền cấp lại mật khẩu cho các thành viên!' });
    }

    const target = db.USERS.find((u: any) => u.UserID === targetUserId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản cần cấp lại mật khẩu.' });
    }

    target.PasswordHash = newPasswordHash;
    target.UpdatedAt = new Date().toISOString();

    // Đồng bộ alias nếu là Cô Phương
    if (target.Username === 'gv_tienganh') {
      const alias = db.USERS.find((u: any) => u.Username === 'cophuong');
      if (alias) alias.PasswordHash = newPasswordHash;
    } else if (target.Username === 'cophuong') {
      const mainU = db.USERS.find((u: any) => u.Username === 'gv_tienganh');
      if (mainU) mainU.PasswordHash = newPasswordHash;
    }

    if (Array.isArray(db.AUDIT_LOG)) {
      db.AUDIT_LOG.unshift({
        LogID: `LOG_${Date.now()}`,
        Timestamp: new Date().toISOString(),
        UserID: admin.UserID,
        Username: admin.Username,
        Action: 'RESET_PASSWORD',
        TargetSheet: 'USERS',
        RecordID: target.UserID,
        Details: `GVCN cấp lại mật khẩu cho tài khoản ${target.Username} (${target.FullName})`,
        Status: 'SUCCESS',
      });
    }

    saveDatabase(db);
    res.json({ success: true, message: `Đã cấp lại mật khẩu thành công cho tài khoản ${target.FullName} (${target.Username})!` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================================
// VITE / STATIC SERVING
// ==========================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`🚀 Sổ Thi Đua Lớp 4A3 Server running at http://0.0.0.0:${port}`);
    console.log(`📁 Persistent storage active at: ${DATA_DIR}`);
    console.log(`🖼️ Uploads directory active at: ${UPLOADS_DIR}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
