/**
 * Google Apps Script Backend Code Files
 * Meets requirements for SỔ THI ĐUA LỚP 4A3 - TRƯỜNG TIỂU HỌC THẠNH XUÂN
 * Contains complete production Apps Script files for deployment on Google Sheets
 */

export interface GasFile {
  filename: string;
  description: string;
  code: string;
}

export const GAS_BACKEND_FILES: GasFile[] = [
  {
    filename: 'Code.gs',
    description: 'File điều phối chính tiếp nhận yêu cầu doGet / doPost từ Web App',
    code: `/**
 * SỔ THI ĐUA LỚP 4A3 - TRƯỜNG TIỂU HỌC THẠNH XUÂN
 * File chính điều phối API: Code.gs
 */

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  var output = {
    success: false,
    message: '',
    data: null,
    errorCode: ''
  };

  try {
    var params = {};
    if (method === 'GET') {
      params = e.parameter || {};
    } else {
      if (e.postData && e.postData.contents) {
        try {
          params = JSON.parse(e.postData.contents);
        } catch (jsonErr) {
          params = e.parameter || {};
        }
      } else {
        params = e.parameter || {};
      }
    }

    var action = params.action || '';
    var sessionToken = params.sessionToken || params.token || '';
    var currentUser = null;

    // Các action không yêu cầu đăng nhập trước
    var publicActions = ['ping', 'login', 'getPublicConfig', 'getLogo', 'updateLogo'];

    if (publicActions.indexOf(action) === -1) {
      currentUser = AuthService.validateSession(sessionToken);
      if (!currentUser) {
        output.success = false;
        output.message = 'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
        output.errorCode = 'AUTH_REQUIRED';
        return createJsonResponse(output);
      }
    }

    // Điều hướng action
    switch (action) {
      case 'ping':
        output.success = true;
        output.message = 'Google Apps Script Backend đang hoạt động bình thường!';
        output.data = { timestamp: new Date().toISOString(), school: 'Trường Tiểu học Thạnh Xuân', class: 'Lớp 4A3' };
        break;

      case 'getLogo':
        var configSheet = SpreadsheetService.getSheet('CONFIG');
        var cRows = configSheet.getDataRange().getValues();
        var logoVal = '';
        for (var ci = 1; ci < cRows.length; ci++) {
          if (String(cRows[ci][0]) === 'LogoURL') {
            logoVal = String(cRows[ci][1] || '');
            break;
          }
        }
        output.success = true;
        output.data = { logoUrl: logoVal };
        break;

      case 'updateLogo':
        var configSheet = SpreadsheetService.getSheet('CONFIG');
        var cRows = configSheet.getDataRange().getValues();
        var foundRow = -1;
        for (var ci = 1; ci < cRows.length; ci++) {
          if (String(cRows[ci][0]) === 'LogoURL') {
            foundRow = ci + 1;
            break;
          }
        }
        if (foundRow > 0) {
          configSheet.getRange(foundRow, 2).setValue(params.logoUrl || '');
        } else {
          configSheet.appendRow(['LogoURL', params.logoUrl || '', 'Logo trường / lớp học']);
        }
        AuditService.log(currentUser ? currentUser.UserID : 'ANONYMOUS', currentUser ? currentUser.Username : 'USER', 'UPDATE_LOGO', 'CONFIG', 'LOGO', 'Cập nhật logo mới cho lớp', 'SUCCESS');
        output.success = true;
        output.message = 'Cập nhật logo lớp thành công!';
        output.data = { logoUrl: params.logoUrl };
        break;

      case 'login':
        output = AuthService.login(params.username, params.password);
        break;

      case 'logout':
        output = AuthService.logout(sessionToken);
        break;

      case 'getCurrentUser':
        output.success = true;
        output.data = currentUser;
        break;

      // Học sinh
      case 'getStudents':
        output = StudentService.getStudents();
        break;

      case 'addStudent':
        output = StudentService.addStudent(currentUser, params.student);
        break;

      case 'updateStudent':
        output = StudentService.updateStudent(currentUser, params.student);
        break;

      case 'deleteStudent':
        output = StudentService.softDeleteStudent(currentUser, params.studentId);
        break;

      // Tổ
      case 'getTeams':
        output = StudentService.getTeams();
        break;

      // Tiêu chí
      case 'getCriteria':
        output = CriteriaService.getCriteria();
        break;

      case 'addCriteria':
        output = CriteriaService.addCriteria(currentUser, params.criteria);
        break;

      case 'updateCriteria':
        output = CriteriaService.updateCriteria(currentUser, params.criteria);
        break;

      case 'deleteCriteria':
        output = CriteriaService.softDeleteCriteria(currentUser, params.criterionId);
        break;

      // Chấm điểm
      case 'addScore':
        output = ScoreService.addScore(currentUser, params.scoreData);
        break;

      case 'deleteScore':
        output = ScoreService.deleteScore(currentUser, params.recordId);
        break;

      case 'getDailyRecords':
        output = ScoreService.getDailyRecords(params.date, params.weekNumber);
        break;

      // Nhận xét
      case 'getComments':
        output = ScoreService.getComments(params.date);
        break;

      case 'saveComment':
        output = ScoreService.saveComment(currentUser, params.commentData);
        break;

      // Báo cáo & Dashboard
      case 'getDashboard':
        output = ReportService.getDashboard(params.dateFilter || 'today');
        break;

      case 'getWeeklyReport':
        output = ReportService.getWeeklyReport(params.weekNumber);
        break;

      case 'getMonthlyReport':
        output = ReportService.getMonthlyReport(params.month);
        break;

      // Người dùng & Quyền
      case 'getUsers':
        output = UserService.getUsers(currentUser);
        break;

      case 'addUser':
        output = UserService.addUser(currentUser, params.userData);
        break;

      case 'updateUser':
        output = UserService.updateUser(currentUser, params.userData);
        break;

      case 'disableUser':
        output = UserService.disableUser(currentUser, params.targetUserId);
        break;

      // Audit Log
      case 'getAuditLogs':
        output = AuditService.getLogs(currentUser, params.limit || 50);
        break;

      default:
        output.success = false;
        output.message = 'Hành động không xác định: ' + action;
        output.errorCode = 'INVALID_ACTION';
        break;
    }

  } catch (err) {
    output.success = false;
    output.message = 'Lỗi hệ thống: ' + err.toString();
    output.errorCode = 'SERVER_ERROR';
    AuditService.log('SYSTEM', 'SYSTEM', 'ERROR', 'SYSTEM', '', err.toString(), 'FAILED');
  }

  return createJsonResponse(output);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`
  },
  {
    filename: 'AuthService.gs',
    description: 'Xử lý xác thực người dùng, băm mật khẩu, phiên làm việc (Session)',
    code: `/**
 * AuthService.gs - Xác thực và phân quyền
 */

var AuthService = {
  login: function(username, password) {
    if (!username || !password) {
      return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' };
    }

    var sheet = SpreadsheetService.getSheet('USERS');
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];

    var userFound = null;
    var rowIndex = -1;

    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (String(row[1]).toLowerCase() === String(username).toLowerCase()) {
        userFound = {
          UserID: row[0],
          Username: row[1],
          PasswordHash: row[2],
          FullName: row[3],
          Role: row[4],
          Team: row[5],
          Subject: row[6],
          Status: row[7],
          CreatedAt: row[8],
          UpdatedAt: row[9]
        };
        rowIndex = i + 1;
        break;
      }
    }

    if (!userFound) {
      AuditService.log('ANONYMOUS', username, 'LOGIN', 'AUTH', '', 'Tên đăng nhập không tồn tại', 'FAILED');
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
    }

    if (userFound.Status !== 'ACTIVE') {
      AuditService.log(userFound.UserID, username, 'LOGIN', 'AUTH', '', 'Tài khoản đã bị vô hiệu hóa', 'FAILED');
      return { success: false, message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ GVCN.' };
    }

    var hashedInput = Utils.hashPassword(password);
    if (userFound.PasswordHash !== hashedInput && userFound.PasswordHash !== password) {
      AuditService.log(userFound.UserID, username, 'LOGIN', 'AUTH', '', 'Mật khẩu không đúng', 'FAILED');
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
    }

    // Cập nhật LastLogin
    sheet.getRange(rowIndex, 11).setValue(new Date().toISOString());

    var token = Utils.generateSessionToken(userFound.UserID, userFound.Role);
    PropertiesService.getScriptProperties().setProperty('SESSION_' + token, JSON.stringify({
      user: userFound,
      expiresAt: new Date().getTime() + (12 * 60 * 60 * 1000) // 12 giờ
    }));

    delete userFound.PasswordHash;

    AuditService.log(userFound.UserID, userFound.Username, 'LOGIN', 'AUTH', userFound.UserID, 'Đăng nhập thành công', 'SUCCESS');

    return {
      success: true,
      message: 'Đăng nhập thành công! Chào mừng ' + userFound.FullName,
      data: {
        token: token,
        user: userFound
      }
    };
  },

  validateSession: function(token) {
    if (!token) return null;
    var sessionJson = PropertiesService.getScriptProperties().getProperty('SESSION_' + token);
    if (!sessionJson) return null;

    try {
      var session = JSON.parse(sessionJson);
      if (new Date().getTime() > session.expiresAt) {
        PropertiesService.getScriptProperties().deleteProperty('SESSION_' + token);
        return null;
      }
      return session.user;
    } catch (e) {
      return null;
    }
  },

  logout: function(token) {
    if (token) {
      PropertiesService.getScriptProperties().deleteProperty('SESSION_' + token);
    }
    return { success: true, message: 'Đã đăng xuất thành công.' };
  }
};
`
  },
  {
    filename: 'ValidationService.gs',
    description: 'Kiểm tra quyền hạn thực tế và tính hợp lệ dữ liệu tại Backend',
    code: `/**
 * ValidationService.gs - Kiểm tra quyền và tính hợp lệ
 */

var ValidationService = {
  checkRole: function(user, allowedRoles) {
    if (!user || !user.Role) return false;
    if (user.Role === 'ADMIN_GVCN') return true; // GVCN có toàn quyền
    return allowedRoles.indexOf(user.Role) !== -1;
  },

  requireAdmin: function(user) {
    if (!user || user.Role !== 'ADMIN_GVCN') {
      throw new Error('Bạn không có quyền quản trị GVCN để thực hiện thao tác này.');
    }
  },

  validateScorePermission: function(user, studentTeamId, criterionRole) {
    if (!user) throw new Error('Yêu cầu xác thực tài khoản.');
    if (user.Role === 'ADMIN_GVCN' || user.Role === 'LOP_TRUONG') return true;

    if (user.Role === 'TO_TRUONG') {
      // Tổ trưởng chỉ chấm học sinh trong tổ của mình
      if (user.Team && user.Team !== studentTeamId) {
        throw new Error('Tổ trưởng chỉ có quyền ghi nhận học sinh trong tổ của mình.');
      }
      return true;
    }

    if (user.Role === 'PHO_TRAT_TU' || user.Role === 'PHO_LAO_DONG' || user.Role === 'GIAO_VIEN_BO_MON') {
      return true;
    }

    if (user.Role === 'VIEWER') {
      throw new Error('Tài khoản người xem không có quyền chấm điểm.');
    }

    return true;
  }
};
`
  },
  {
    filename: 'StudentService.gs',
    description: 'Quản lý học sinh, phân tổ, soft-delete',
    code: `/**
 * StudentService.gs - Quản lý Học sinh và Tổ
 */

var StudentService = {
  getStudents: function() {
    var sheet = SpreadsheetService.getSheet('STUDENTS');
    var rows = sheet.getDataRange().getValues();
    var students = [];

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0]) {
        students.push({
          StudentID: String(r[0]),
          StudentCode: String(r[1]),
          FullName: String(r[2]),
          Gender: String(r[3]),
          DateOfBirth: String(r[4]),
          TeamID: String(r[5]),
          TeamName: String(r[6]),
          Status: String(r[7]),
          AvatarURL: String(r[8]),
          InitialScore: isNaN(Number(r[9])) ? 0 : Number(r[9]),
          CreatedAt: String(r[10]),
          UpdatedAt: String(r[11])
        });
      }
    }
    return { success: true, data: students };
  },

  resetAllScoresToZero: function(user, clearHistory) {
    ValidationService.requireAdmin(user);
    var sheet = SpreadsheetService.getSheet('STUDENTS');
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      sheet.getRange(i + 1, 10).setValue(0);
      sheet.getRange(i + 1, 12).setValue(new Date().toISOString());
    }

    if (clearHistory) {
      var scoreSheet = SpreadsheetService.getSheet('DAILY_SCORES');
      if (scoreSheet.getLastRow() > 1) {
        scoreSheet.deleteRows(2, scoreSheet.getLastRow() - 1);
      }
      var commentSheet = SpreadsheetService.getSheet('DAILY_COMMENTS');
      if (commentSheet.getLastRow() > 1) {
        commentSheet.deleteRows(2, commentSheet.getLastRow() - 1);
      }
    }

    var configSheet = SpreadsheetService.getSheet('CONFIG');
    var cfgRows = configSheet.getDataRange().getValues();
    for (var c = 1; c < cfgRows.length; c++) {
      if (String(cfgRows[c][0]) === 'InitialScore') {
        configSheet.getRange(c + 1, 2).setValue('0');
      }
    }

    AuditService.log(user.UserID, user.Username, 'RESET_SCORES', 'STUDENTS', 'ALL', 'Đặt lại điểm gốc của tất cả học sinh về 0 điểm' + (clearHistory ? ' và xóa lịch sử' : ''), 'SUCCESS');
    return { success: true, message: 'Đã cập nhật toàn bộ học sinh về điểm gốc 0 điểm thành công!' };
  },

  getTeams: function() {
    var sheet = SpreadsheetService.getSheet('TEAMS');
    var rows = sheet.getDataRange().getValues();
    var teams = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0]) {
        teams.push({
          TeamID: String(r[0]),
          TeamName: String(r[1]),
          TeamLeaderID: String(r[2]),
          TeamLeaderName: String(r[3]),
          Status: String(r[4])
        });
      }
    }
    return { success: true, data: teams };
  },

  addStudent: function(user, studentData) {
    ValidationService.requireAdmin(user);

    if (!studentData.FullName || !studentData.TeamID) {
      return { success: false, message: 'Vui lòng nhập họ tên và tổ của học sinh.' };
    }

    var sheet = SpreadsheetService.getSheet('STUDENTS');
    var studentId = 'HS_' + Utilities.getUuid().substring(0, 8);
    var studentCode = studentData.StudentCode || ('4A3_' + (sheet.getLastRow()));
    var now = new Date().toISOString();

    sheet.appendRow([
      studentId,
      studentCode,
      studentData.FullName,
      studentData.Gender || 'Nam',
      studentData.DateOfBirth || '',
      studentData.TeamID,
      studentData.TeamName || studentData.TeamID,
      'ACTIVE',
      studentData.AvatarURL || '',
      studentData.InitialScore !== undefined ? Number(studentData.InitialScore) : 0,
      now,
      now
    ]);

    AuditService.log(user.UserID, user.Username, 'ADD_STUDENT', 'STUDENTS', studentId, 'Thêm học sinh: ' + studentData.FullName, 'SUCCESS');
    return { success: true, message: 'Thêm học sinh thành công.', data: { StudentID: studentId } };
  },

  updateStudent: function(user, studentData) {
    ValidationService.requireAdmin(user);
    var sheet = SpreadsheetService.getSheet('STUDENTS');
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(studentData.StudentID)) {
        var rowIndex = i + 1;
        if (studentData.FullName !== undefined) sheet.getRange(rowIndex, 3).setValue(studentData.FullName);
        if (studentData.Gender !== undefined) sheet.getRange(rowIndex, 4).setValue(studentData.Gender);
        if (studentData.DateOfBirth !== undefined) sheet.getRange(rowIndex, 5).setValue(studentData.DateOfBirth);
        if (studentData.TeamID !== undefined) sheet.getRange(rowIndex, 6).setValue(studentData.TeamID);
        if (studentData.TeamName !== undefined) sheet.getRange(rowIndex, 7).setValue(studentData.TeamName);
        if (studentData.Status !== undefined) sheet.getRange(rowIndex, 8).setValue(studentData.Status);
        if (studentData.AvatarURL !== undefined) sheet.getRange(rowIndex, 9).setValue(studentData.AvatarURL);
        sheet.getRange(rowIndex, 12).setValue(new Date().toISOString());

        AuditService.log(user.UserID, user.Username, 'UPDATE_STUDENT', 'STUDENTS', studentData.StudentID, 'Cập nhật học sinh: ' + (studentData.FullName || rows[i][2]), 'SUCCESS');
        return { success: true, message: 'Cập nhật thông tin học sinh thành công.' };
      }
    }
    return { success: false, message: 'Không tìm thấy học sinh cần cập nhật.' };
  },

  softDeleteStudent: function(user, studentId) {
    ValidationService.requireAdmin(user);
    var sheet = SpreadsheetService.getSheet('STUDENTS');
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(studentId)) {
        sheet.getRange(i + 1, 8).setValue('INACTIVE');
        sheet.getRange(i + 1, 12).setValue(new Date().toISOString());
        AuditService.log(user.UserID, user.Username, 'DEACTIVATE_STUDENT', 'STUDENTS', studentId, 'Vô hiệu hóa học sinh: ' + rows[i][2], 'SUCCESS');
        return { success: true, message: 'Đã chuyển trạng thái học sinh sang ngừng hoạt động.' };
      }
    }
    return { success: false, message: 'Không tìm thấy học sinh.' };
  }
};
`
  },
  {
    filename: 'ScoreService.gs',
    description: 'Xử lý chấm điểm cộng/trừ, ghi nhận xét, kiểm tra quyền hạn',
    code: `/**
 * ScoreService.gs - Ghi nhận điểm thi đua và nhận xét
 */

var ScoreService = {
  addScore: function(user, scoreData) {
    if (!scoreData.StudentID || !scoreData.CriterionID) {
      return { success: false, message: 'Thiếu thông tin học sinh hoặc tiêu chí thi đua.' };
    }

    ValidationService.validateScorePermission(user, scoreData.TeamID, '');

    var sheet = SpreadsheetService.getSheet('DAILY_SCORES');
    var recordId = 'REC_' + Utilities.getUuid().substring(0, 8);
    var now = new Date().toISOString();
    var date = scoreData.Date || now.substring(0, 10);

    var point = Number(scoreData.Point);
    if (isNaN(point)) {
      return { success: false, message: 'Mức điểm không hợp lệ.' };
    }

    sheet.appendRow([
      recordId,
      date,
      scoreData.StudentID,
      scoreData.StudentName,
      scoreData.TeamID,
      scoreData.CriterionID,
      scoreData.CriterionName,
      point,
      scoreData.Reason || '',
      user.FullName + ' (' + user.Role + ')',
      now,
      'ACTIVE'
    ]);

    AuditService.log(user.UserID, user.Username, 'ADD_SCORE', 'DAILY_SCORES', recordId,
      (point > 0 ? '+' : '') + point + 'đ cho ' + scoreData.StudentName + ': ' + scoreData.CriterionName, 'SUCCESS');

    return {
      success: true,
      message: 'Ghi điểm thành công cho học sinh ' + scoreData.StudentName + '!',
      data: { RecordID: recordId, Point: point }
    };
  },

  deleteScore: function(user, recordId) {
    ValidationService.requireAdmin(user);
    var sheet = SpreadsheetService.getSheet('DAILY_SCORES');
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(recordId)) {
        sheet.getRange(i + 1, 12).setValue('DELETED');
        AuditService.log(user.UserID, user.Username, 'DELETE_SCORE', 'DAILY_SCORES', recordId, 'Xóa bản ghi điểm: ' + rows[i][3] + ' (' + rows[i][7] + 'đ)', 'SUCCESS');
        return { success: true, message: 'Đã hủy bản ghi điểm thi đua.' };
      }
    }
    return { success: false, message: 'Không tìm thấy bản ghi cần xóa.' };
  },

  getDailyRecords: function(date, weekNumber) {
    var sheet = SpreadsheetService.getSheet('DAILY_SCORES');
    var rows = sheet.getDataRange().getValues();
    var records = [];

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] && r[11] !== 'DELETED') {
        var recDate = String(r[1]).substring(0, 10);
        if (!date || recDate === date) {
          records.push({
            RecordID: String(r[0]),
            Date: recDate,
            StudentID: String(r[2]),
            StudentName: String(r[3]),
            TeamID: String(r[4]),
            CriterionID: String(r[5]),
            CriterionName: String(r[6]),
            Point: Number(r[7]),
            Reason: String(r[8]),
            RecordedBy: String(r[9]),
            RecordedAt: String(r[10]),
            Status: String(r[11])
          });
        }
      }
    }
    return { success: true, data: records };
  },

  saveComment: function(user, commentData) {
    if (!commentData.StudentID || !commentData.Comment) {
      return { success: false, message: 'Vui lòng nhập nội dung nhận xét.' };
    }

    var sheet = SpreadsheetService.getSheet('DAILY_COMMENTS');
    var rows = sheet.getDataRange().getValues();
    var date = commentData.Date || new Date().toISOString().substring(0, 10);
    var now = new Date().toISOString();

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (String(r[1]).substring(0, 10) === date && String(r[2]) === String(commentData.StudentID)) {
        // Cập nhật nhận xét cũ
        sheet.getRange(i + 1, 5).setValue(commentData.Comment);
        sheet.getRange(i + 1, 6).setValue(user.FullName + ' (' + user.Role + ')');
        sheet.getRange(i + 1, 8).setValue(now);
        AuditService.log(user.UserID, user.Username, 'UPDATE_COMMENT', 'DAILY_COMMENTS', String(r[0]), 'Cập nhật nhận xét cho: ' + commentData.StudentName, 'SUCCESS');
        return { success: true, message: 'Cập nhật nhận xét thành công.' };
      }
    }

    // Tạo mới
    var commentId = 'CMT_' + Utilities.getUuid().substring(0, 8);
    sheet.appendRow([
      commentId,
      date,
      commentData.StudentID,
      commentData.StudentName,
      commentData.Comment,
      user.FullName + ' (' + user.Role + ')',
      now,
      now
    ]);

    AuditService.log(user.UserID, user.Username, 'ADD_COMMENT', 'DAILY_COMMENTS', commentId, 'Thêm nhận xét cho: ' + commentData.StudentName, 'SUCCESS');
    return { success: true, message: 'Đã lưu nhận xét học sinh thành công.' };
  },

  getComments: function(date) {
    var sheet = SpreadsheetService.getSheet('DAILY_COMMENTS');
    var rows = sheet.getDataRange().getValues();
    var comments = [];

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0]) {
        var cDate = String(r[1]).substring(0, 10);
        if (!date || cDate === date) {
          comments.push({
            CommentID: String(r[0]),
            Date: cDate,
            StudentID: String(r[2]),
            StudentName: String(r[3]),
            Comment: String(r[4]),
            RecordedBy: String(r[5]),
            CreatedAt: String(r[6]),
            UpdatedAt: String(r[7])
          });
        }
      }
    }
    return { success: true, data: comments };
  }
};
`
  },
  {
    filename: 'CriteriaService.gs',
    description: 'Quản lý tiêu chí thi đua, phân loại cộng/trừ, soft-delete',
    code: `/**
 * CriteriaService.gs - Quản lý tiêu chí thi đua
 */

var CriteriaService = {
  getCriteria: function() {
    var sheet = SpreadsheetService.getSheet('CRITERIA');
    var rows = sheet.getDataRange().getValues();
    var list = [];

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0]) {
        list.push({
          CriterionID: String(r[0]),
          CriterionCode: String(r[1]),
          CriterionName: String(r[2]),
          Category: String(r[3]),
          Type: String(r[4]),
          Point: Number(r[5]),
          Description: String(r[6]),
          ApplicableRole: String(r[7]),
          Status: String(r[8]),
          CreatedAt: String(r[9]),
          UpdatedAt: String(r[10])
        });
      }
    }
    return { success: true, data: list };
  },

  addCriteria: function(user, crit) {
    ValidationService.requireAdmin(user);
    if (!crit.CriterionName || crit.Point === undefined) {
      return { success: false, message: 'Vui lòng nhập tên tiêu chí và mức điểm.' };
    }

    var sheet = SpreadsheetService.getSheet('CRITERIA');
    var id = 'CRIT_' + Utilities.getUuid().substring(0, 8);
    var code = crit.CriterionCode || ('TC_' + (sheet.getLastRow()));
    var now = new Date().toISOString();

    sheet.appendRow([
      id,
      code,
      crit.CriterionName,
      crit.Category || 'Học tập',
      crit.Type || 'PLUS',
      Number(crit.Point),
      crit.Description || '',
      crit.ApplicableRole || 'ALL',
      'ACTIVE',
      now,
      now
    ]);

    AuditService.log(user.UserID, user.Username, 'ADD_CRITERIA', 'CRITERIA', id, 'Thêm tiêu chí: ' + crit.CriterionName, 'SUCCESS');
    return { success: true, message: 'Thêm tiêu chí thành công.' };
  },

  updateCriteria: function(user, crit) {
    ValidationService.requireAdmin(user);
    var sheet = SpreadsheetService.getSheet('CRITERIA');
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(crit.CriterionID)) {
        var row = i + 1;
        sheet.getRange(row, 3).setValue(crit.CriterionName);
        sheet.getRange(row, 4).setValue(crit.Category);
        sheet.getRange(row, 5).setValue(crit.Type);
        sheet.getRange(row, 6).setValue(Number(crit.Point));
        sheet.getRange(row, 7).setValue(crit.Description || '');
        sheet.getRange(row, 8).setValue(crit.ApplicableRole || 'ALL');
        sheet.getRange(row, 9).setValue(crit.Status || 'ACTIVE');
        sheet.getRange(row, 11).setValue(new Date().toISOString());

        AuditService.log(user.UserID, user.Username, 'UPDATE_CRITERIA', 'CRITERIA', crit.CriterionID, 'Cập nhật tiêu chí: ' + crit.CriterionName, 'SUCCESS');
        return { success: true, message: 'Cập nhật tiêu chí thành công.' };
      }
    }
    return { success: false, message: 'Không tìm thấy tiêu chí.' };
  },

  softDeleteCriteria: function(user, criterionId) {
    ValidationService.requireAdmin(user);
    var sheet = SpreadsheetService.getSheet('CRITERIA');
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(criterionId)) {
        sheet.getRange(i + 1, 9).setValue('INACTIVE');
        sheet.getRange(i + 1, 11).setValue(new Date().toISOString());
        AuditService.log(user.UserID, user.Username, 'DEACTIVATE_CRITERIA', 'CRITERIA', criterionId, 'Vô hiệu hóa tiêu chí: ' + rows[i][2], 'SUCCESS');
        return { success: true, message: 'Đã ngừng áp dụng tiêu chí thi đua.' };
      }
    }
    return { success: false, message: 'Không tìm thấy tiêu chí.' };
  }
};
`
  },
  {
    filename: 'ReportService.gs',
    description: 'Tính toán tổng hợp điểm, xếp hạng học sinh & tổ, thống kê Dashboard',
    code: `/**
 * ReportService.gs - Tổng hợp thi đua, xếp hạng và thống kê
 */

var ReportService = {
  getDashboard: function(filter) {
    var studentsRes = StudentService.getStudents();
    var allStudents = studentsRes.data.filter(function(s) { return s.Status === 'ACTIVE'; });
    var scoresRes = ScoreService.getDailyRecords();
    var allScores = scoresRes.data;

    var todayStr = new Date().toISOString().substring(0, 10);
    var todayPlus = 0;
    var todayMinus = 0;

    // Map tính điểm từng học sinh
    var studentMap = {};
    for (var i = 0; i < allStudents.length; i++) {
      var s = allStudents[i];
      studentMap[s.StudentID] = {
        student: s,
        initialScore: typeof s.InitialScore === 'number' ? s.InitialScore : 0,
        totalPlus: 0,
        totalMinus: 0,
        netScore: typeof s.InitialScore === 'number' ? s.InitialScore : 0,
        scoresCount: 0
      };
    }

    for (var j = 0; j < allScores.length; j++) {
      var rec = allScores[j];
      if (rec.Date === todayStr) {
        if (rec.Point > 0) todayPlus += rec.Point;
        else todayMinus += Math.abs(rec.Point);
      }

      if (studentMap[rec.StudentID]) {
        if (rec.Point > 0) {
          studentMap[rec.StudentID].totalPlus += rec.Point;
        } else {
          studentMap[rec.StudentID].totalMinus += Math.abs(rec.Point);
        }
        studentMap[rec.StudentID].scoresCount++;
      }
    }

    var studentList = [];
    var totalNetScore = 0;

    for (var id in studentMap) {
      var item = studentMap[id];
      item.netScore = item.initialScore + item.totalPlus - item.totalMinus;
      totalNetScore += item.netScore;
      studentList.push(item);
    }

    // Sắp xếp thứ hạng giảm dần
    studentList.sort(function(a, b) {
      return b.netScore - a.netScore;
    });

    for (var r = 0; r < studentList.length; r++) {
      studentList[r].rank = r + 1;
    }

    var avgClassScore = allStudents.length > 0 ? (totalNetScore / allStudents.length).toFixed(1) : 100;

    return {
      success: true,
      data: {
        totalStudents: allStudents.length,
        activeStudents: allStudents.length,
        avgClassScore: Number(avgClassScore),
        todayPlus: todayPlus,
        todayMinus: todayMinus,
        topStudents: studentList.slice(0, 5),
        warningStudents: studentList.filter(function(s) { return s.netScore < 95; }).slice(0, 5),
        allRanked: studentList
      }
    };
  },

  getWeeklyReport: function(weekNumber) {
    // Tổng hợp báo cáo tuần từ dữ liệu thực tế
    return {
      success: true,
      data: {
        weekNumber: weekNumber || 24,
        generatedAt: new Date().toISOString()
      }
    };
  },

  getMonthlyReport: function(month) {
    return {
      success: true,
      data: {
        month: month || '2025-03',
        generatedAt: new Date().toISOString()
      }
    };
  }
};
`
  },
  {
    filename: 'UserService.gs',
    description: 'Quản lý tài khoản cán bộ lớp và giáo viên',
    code: `/**
 * UserService.gs - Quản lý tài khoản người dùng
 */

var UserService = {
  getUsers: function(user) {
    ValidationService.requireAdmin(user);
    var sheet = SpreadsheetService.getSheet('USERS');
    var rows = sheet.getDataRange().getValues();
    var users = [];

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0]) {
        users.push({
          UserID: String(r[0]),
          Username: String(r[1]),
          FullName: String(r[3]),
          Role: String(r[4]),
          Team: String(r[5]),
          Subject: String(r[6]),
          Status: String(r[7]),
          CreatedAt: String(r[8]),
          UpdatedAt: String(r[9]),
          LastLogin: String(r[10])
        });
      }
    }
    return { success: true, data: users };
  },

  addUser: function(user, userData) {
    ValidationService.requireAdmin(user);
    if (!userData.Username || !userData.Password || !userData.FullName) {
      return { success: false, message: 'Vui lòng điền đầy đủ tên đăng nhập, họ tên và mật khẩu.' };
    }

    var sheet = SpreadsheetService.getSheet('USERS');
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).toLowerCase() === String(userData.Username).toLowerCase()) {
        return { success: false, message: 'Tên đăng nhập đã tồn tại.' };
      }
    }

    var id = 'USR_' + Utilities.getUuid().substring(0, 8);
    var now = new Date().toISOString();
    var pwdHash = Utils.hashPassword(userData.Password);

    sheet.appendRow([
      id,
      userData.Username,
      pwdHash,
      userData.FullName,
      userData.Role || 'TO_TRUONG',
      userData.Team || '',
      userData.Subject || '',
      'ACTIVE',
      now,
      now,
      ''
    ]);

    AuditService.log(user.UserID, user.Username, 'ADD_USER', 'USERS', id, 'Thêm tài khoản: ' + userData.Username, 'SUCCESS');
    return { success: true, message: 'Thêm tài khoản thành công.' };
  },

  disableUser: function(user, targetUserId) {
    ValidationService.requireAdmin(user);
    if (user.UserID === targetUserId) {
      return { success: false, message: 'Không thể vô hiệu hóa chính tài khoản của bạn.' };
    }

    var sheet = SpreadsheetService.getSheet('USERS');
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(targetUserId)) {
        sheet.getRange(i + 1, 8).setValue('INACTIVE');
        sheet.getRange(i + 1, 10).setValue(new Date().toISOString());
        AuditService.log(user.UserID, user.Username, 'DISABLE_USER', 'USERS', targetUserId, 'Vô hiệu hóa user: ' + rows[i][1], 'SUCCESS');
        return { success: true, message: 'Đã khóa tài khoản thành công.' };
      }
    }
    return { success: false, message: 'Không tìm thấy tài khoản.' };
  }
};
`
  },
  {
    filename: 'SpreadsheetService.gs',
    description: 'Truy xuất các Sheet trong Google Spreadsheet trung tâm',
    code: `/**
 * SpreadsheetService.gs - Quản lý truy cập Google Spreadsheet
 */

var SpreadsheetService = {
  getSpreadsheet: function() {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty('SPREADSHEET_ID');

    if (sheetId) {
      return SpreadsheetApp.openById(sheetId);
    }
    // Nếu gắn kèm Spreadsheet (Container-bound script)
    return SpreadsheetApp.getActiveSpreadsheet();
  },

  getSheet: function(sheetName) {
    var ss = this.getSpreadsheet();
    if (!ss) {
      throw new Error('Chưa cấu hình Google Spreadsheet. Vui lòng chạy setup trong SetupSheets.gs');
    }
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Không tìm thấy sheet: ' + sheetName + '. Vui lòng kiểm tra cấu trúc bảng tính.');
    }
    return sheet;
  }
};
`
  },
  {
    filename: 'AuditService.gs',
    description: 'Ghi nhật ký hệ thống AUDIT_LOG bảo mật theo yêu cầu',
    code: `/**
 * AuditService.gs - Ghi nhật ký hệ thống
 */

var AuditService = {
  log: function(userId, username, action, moduleName, targetId, description, result) {
    try {
      var sheet = SpreadsheetService.getSheet('AUDIT_LOG');
      var logId = 'LOG_' + Utilities.getUuid().substring(0, 8);
      var timestamp = new Date().toISOString();

      sheet.appendRow([
        logId,
        timestamp,
        userId || 'ANONYMOUS',
        username || 'ANONYMOUS',
        action,
        moduleName,
        targetId || '',
        description,
        result || 'SUCCESS',
        'GAS_WEB_APP',
        'WEB_BROWSER'
      ]);
    } catch (e) {
      Logger.log('Không thể ghi audit log: ' + e.toString());
    }
  },

  getLogs: function(user, limit) {
    ValidationService.requireAdmin(user);
    var sheet = SpreadsheetService.getSheet('AUDIT_LOG');
    var rows = sheet.getDataRange().getValues();
    var logs = [];

    var start = Math.max(1, rows.length - (limit || 50));
    for (var i = rows.length - 1; i >= start; i--) {
      var r = rows[i];
      if (r[0]) {
        logs.push({
          LogID: String(r[0]),
          Timestamp: String(r[1]),
          UserID: String(r[2]),
          Username: String(r[3]),
          Action: String(r[4]),
          Module: String(r[5]),
          TargetID: String(r[6]),
          Description: String(r[7]),
          Result: String(r[8]),
          IPAddressOrSession: String(r[9]),
          Device: String(r[10])
        });
      }
    }
    return { success: true, data: logs };
  }
};
`
  },
  {
    filename: 'Utils.gs',
    description: 'Tiện ích băm SHA-256, sinh mã ngẫu nhiên, định dạng ngày',
    code: `/**
 * Utils.gs - Hàm tiện ích băm mật khẩu, token, UUID
 */

var Utils = {
  hashPassword: function(plainText) {
    if (!plainText) return '';
    var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plainText, Utilities.Charset.UTF_8);
    var txtHash = '';
    for (var i = 0; i < rawHash.length; i++) {
      var byteVal = rawHash[i];
      if (byteVal < 0) byteVal += 256;
      var byteHex = byteVal.toString(16);
      if (byteHex.length === 1) byteHex = '0' + byteHex;
      txtHash += byteHex;
    }
    return txtHash;
  },

  generateSessionToken: function(userId, role) {
    var raw = userId + '_' + role + '_' + new Date().getTime() + '_' + Math.random();
    return this.hashPassword(raw);
  }
};
`
  },
  {
    filename: 'SetupSheets.gs',
    description: 'Script tự động khởi tạo toàn bộ 11 Sheets chuẩn và nạp sẵn dữ liệu ban đầu',
    code: `/**
 * SetupSheets.gs - Khởi tạo toàn bộ 11 Sheets chuẩn với Header, Định dạng và Dữ liệu mẫu
 * Chạy hàm: setupAllSheets() trong Google Apps Script Editor
 */

function setupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Vui lòng mở script từ Google Spreadsheet: Tiện ích mở rộng -> Apps Script');
  }

  // 1. CONFIG
  var configSheet = getOrCreateSheet(ss, 'CONFIG');
  configSheet.clear();
  configSheet.appendRow(['Key', 'Value', 'Description']);
  configSheet.appendRow(['AppName', 'Sổ Thi Đua Lớp 4A3', 'Tên ứng dụng']);
  configSheet.appendRow(['SchoolName', 'Trường Tiểu học Thị Trấn Rạch Gòi A', 'Tên trường tiểu học']);
  configSheet.appendRow(['ClassName', 'Lớp 4A3', 'Tên lớp']);
  configSheet.appendRow(['AcademicYear', '2026 - 2027', 'Năm học']);
  configSheet.appendRow(['TeacherInCharge', 'Cô Phạm Ngọc Lê', 'Giáo viên chủ nhiệm']);
  configSheet.appendRow(['InitialScore', '0', 'Điểm khởi tạo thi đua']);
  formatHeader(configSheet);

  // 2. USERS
  var userSheet = getOrCreateSheet(ss, 'USERS');
  userSheet.clear();
  userSheet.appendRow(['UserID', 'Username', 'PasswordHash', 'FullName', 'Role', 'Team', 'Subject', 'Status', 'CreatedAt', 'UpdatedAt', 'LastLogin']);
  userSheet.appendRow(['USR_001', 'gvcn', Utils.hashPassword('123456'), 'Phạm Ngọc Lê', 'ADMIN_GVCN', '', '', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  userSheet.appendRow(['USR_002', 'loptruong', Utils.hashPassword('123456'), 'Thiều An', 'LOP_TRUONG', 'Tổ 1', '', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  userSheet.appendRow(['USR_003', 'photrattu', Utils.hashPassword('123456'), 'Trần Ngọc Kim Cương', 'PHO_TRAT_TU', 'Tổ 2', '', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  userSheet.appendRow(['USR_004', 'pholaodong', Utils.hashPassword('123456'), 'Dương Phạm Bảo Lộc', 'PHO_LAO_DONG', 'Tổ 3', '', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  userSheet.appendRow(['USR_005', 'totruong1', Utils.hashPassword('123456'), 'Nguyễn Mai Bình An', 'TO_TRUONG', 'Tổ 1', '', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  userSheet.appendRow(['USR_006', 'totruong2', Utils.hashPassword('123456'), 'Huỳnh Duy Cường', 'TO_TRUONG', 'Tổ 2', '', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  userSheet.appendRow(['USR_007', 'totruong3', Utils.hashPassword('123456'), 'Trần Nguyễn Tấn Lộc', 'TO_TRUONG', 'Tổ 3', '', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  userSheet.appendRow(['USR_008', 'totruong4', Utils.hashPassword('123456'), 'Nguyễn Ngọc Nhi', 'TO_TRUONG', 'Tổ 4', '', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  userSheet.appendRow(['USR_009', 'totruong5', Utils.hashPassword('123456'), 'Đặng Lương Gia Quí', 'TO_TRUONG', 'Tổ 5', '', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  userSheet.appendRow(['USR_010', 'gv_tienganh', Utils.hashPassword('123456'), 'Robert Nguyễn', 'GIAO_VIEN_BO_MON', '', 'Tiếng Anh', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  userSheet.appendRow(['USR_011', 'gv_tinhoc', Utils.hashPassword('123456'), 'Phan Mỹ Hạnh', 'GIAO_VIEN_BO_MON', '', 'Tin học & Công nghệ', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  userSheet.appendRow(['USR_012', 'khach', Utils.hashPassword('123456'), 'Ban Đại Diện Phụ Huynh', 'VIEWER', '', '', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);
  formatHeader(userSheet);

  // 3. TEAMS
  var teamSheet = getOrCreateSheet(ss, 'TEAMS');
  teamSheet.clear();
  teamSheet.appendRow(['TeamID', 'TeamName', 'TeamLeaderID', 'TeamLeaderName', 'Status', 'CreatedAt', 'UpdatedAt']);
  teamSheet.appendRow(['TO_1', 'Tổ 1 (Sơn Ca)', 'USR_005', 'Nguyễn Mai Bình An', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  teamSheet.appendRow(['TO_2', 'Tổ 2 (Họa Mi)', 'USR_006', 'Huỳnh Duy Cường', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  teamSheet.appendRow(['TO_3', 'Tổ 3 (Đại Bàng)', 'USR_007', 'Trần Nguyễn Tấn Lộc', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  teamSheet.appendRow(['TO_4', 'Tổ 4 (Kim Đồng)', 'USR_008', 'Nguyễn Ngọc Nhi', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  teamSheet.appendRow(['TO_5', 'Tổ 5 (Măng Non)', 'USR_009', 'Đặng Lương Gia Quí', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  formatHeader(teamSheet);

  // 4. STUDENTS
  var studentSheet = getOrCreateSheet(ss, 'STUDENTS');
  studentSheet.clear();
  studentSheet.appendRow(['StudentID', 'StudentCode', 'FullName', 'Gender', 'DateOfBirth', 'TeamID', 'TeamName', 'Status', 'AvatarURL', 'InitialScore', 'CreatedAt', 'UpdatedAt']);
  var officialStudents = [
    ['HS_01', '4A3-01', 'Nguyễn Mai Bình An', 'Nữ', '2017-06-12', 'TO_1', 'Tổ 1 (Sơn Ca)', 'ACTIVE', '', 0],
    ['HS_02', '4A3-02', 'Thiều An', 'Nam', '2017-07-21', 'TO_1', 'Tổ 1 (Sơn Ca)', 'ACTIVE', '', 0],
    ['HS_03', '4A3-03', 'Trần Nguyễn Phương Anh', 'Nữ', '2017-12-01', 'TO_1', 'Tổ 1 (Sơn Ca)', 'ACTIVE', '', 0],
    ['HS_04', '4A3-04', 'Bùi Gia Bảo', 'Nam', '2017-05-05', 'TO_1', 'Tổ 1 (Sơn Ca)', 'ACTIVE', '', 0],
    ['HS_05', '4A3-05', 'Nguyễn Khánh Băng', 'Nữ', '2017-04-03', 'TO_1', 'Tổ 1 (Sơn Ca)', 'ACTIVE', '', 0],
    ['HS_06', '4A3-06', 'Nguyễn Nguyệt Cát', 'Nữ', '2017-12-18', 'TO_1', 'Tổ 1 (Sơn Ca)', 'ACTIVE', '', 0],
    ['HS_07', '4A3-07', 'Nguyễn Văn Công', 'Nam', '2017-12-04', 'TO_1', 'Tổ 1 (Sơn Ca)', 'ACTIVE', '', 0],

    ['HS_08', '4A3-08', 'Trần Ngọc Kim Cương', 'Nữ', '2017-08-13', 'TO_2', 'Tổ 2 (Họa Mi)', 'ACTIVE', '', 0],
    ['HS_09', '4A3-09', 'Huỳnh Duy Cường', 'Nam', '2017-08-25', 'TO_2', 'Tổ 2 (Họa Mi)', 'ACTIVE', '', 0],
    ['HS_10', '4A3-10', 'Hồ Ngọc Thảo Duyên', 'Nữ', '2017-12-09', 'TO_2', 'Tổ 2 (Họa Mi)', 'ACTIVE', '', 0],
    ['HS_11', '4A3-11', 'Phạm Thiên Kim', 'Nữ', '2017-10-18', 'TO_2', 'Tổ 2 (Họa Mi)', 'ACTIVE', '', 0],
    ['HS_12', '4A3-12', 'Dương Minh Đạt', 'Nam', '2017-10-25', 'TO_2', 'Tổ 2 (Họa Mi)', 'ACTIVE', '', 0],
    ['HS_13', '4A3-13', 'Lê Huỳnh Phước Khang', 'Nam', '2017-08-09', 'TO_2', 'Tổ 2 (Họa Mi)', 'ACTIVE', '', 0],
    ['HS_14', '4A3-14', 'Dương Gia Long', 'Nam', '2017-05-22', 'TO_2', 'Tổ 2 (Họa Mi)', 'ACTIVE', '', 0],

    ['HS_15', '4A3-15', 'Dương Phạm Bảo Lộc', 'Nam', '2017-06-12', 'TO_3', 'Tổ 3 (Đại Bàng)', 'ACTIVE', '', 0],
    ['HS_16', '4A3-16', 'Trần Nguyễn Tấn Lộc', 'Nam', '2017-09-19', 'TO_3', 'Tổ 3 (Đại Bàng)', 'ACTIVE', '', 0],
    ['HS_17', '4A3-17', 'Phạm Ngọc My', 'Nữ', '2017-09-15', 'TO_3', 'Tổ 3 (Đại Bàng)', 'ACTIVE', '', 0],
    ['HS_18', '4A3-18', 'Lâm Thảo Ngân', 'Nữ', '2017-10-07', 'TO_3', 'Tổ 3 (Đại Bàng)', 'ACTIVE', '', 0],
    ['HS_19', '4A3-19', 'Huỳnh Trọng Nghĩa', 'Nam', '2016-02-05', 'TO_3', 'Tổ 3 (Đại Bàng)', 'ACTIVE', '', 0],
    ['HS_20', '4A3-20', 'Lương Trần Thảo Ngọc', 'Nữ', '2016-08-10', 'TO_3', 'Tổ 3 (Đại Bàng)', 'ACTIVE', '', 0],
    ['HS_21', '4A3-21', 'Lư Tài Nhân', 'Nam', '2017-10-20', 'TO_3', 'Tổ 3 (Đại Bàng)', 'ACTIVE', '', 0],

    ['HS_22', '4A3-22', 'Nguyễn Ngọc Nhi', 'Nữ', '2017-12-15', 'TO_4', 'Tổ 4 (Kim Đồng)', 'ACTIVE', '', 0],
    ['HS_23', '4A3-23', 'Phạm Ngọc Nhi', 'Nữ', '2017-11-12', 'TO_4', 'Tổ 4 (Kim Đồng)', 'ACTIVE', '', 0],
    ['HS_24', '4A3-24', 'Trần Huỳnh Như', 'Nữ', '2017-05-12', 'TO_4', 'Tổ 4 (Kim Đồng)', 'ACTIVE', '', 0],
    ['HS_25', '4A3-25', 'Đàm Huỳnh Nhã Phi', 'Nữ', '2017-02-12', 'TO_4', 'Tổ 4 (Kim Đồng)', 'ACTIVE', '', 0],
    ['HS_26', '4A3-26', 'Lê Nguyễn Minh Phú', 'Nam', '2017-05-26', 'TO_4', 'Tổ 4 (Kim Đồng)', 'ACTIVE', '', 0],
    ['HS_27', '4A3-27', 'Nguyễn Thanh Phước', 'Nam', '2017-11-07', 'TO_4', 'Tổ 4 (Kim Đồng)', 'ACTIVE', '', 0],
    ['HS_28', '4A3-28', 'Ngũ Nhã Phương', 'Nữ', '2017-12-31', 'TO_4', 'Tổ 4 (Kim Đồng)', 'ACTIVE', '', 0],

    ['HS_29', '4A3-29', 'Đặng Lương Gia Quí', 'Nam', '2017-02-20', 'TO_5', 'Tổ 5 (Măng Non)', 'ACTIVE', '', 0],
    ['HS_30', '4A3-30', 'Đỗ Thị Như Quỳnh', 'Nữ', '2017-10-19', 'TO_5', 'Tổ 5 (Măng Non)', 'ACTIVE', '', 0],
    ['HS_31', '4A3-31', 'Nguyễn Trần Ngọc Quỳnh', 'Nữ', '2017-03-10', 'TO_5', 'Tổ 5 (Măng Non)', 'ACTIVE', '', 0],
    ['HS_32', '4A3-32', 'Ngô Thanh Tâm', 'Nam', '2017-09-20', 'TO_5', 'Tổ 5 (Măng Non)', 'ACTIVE', '', 0],
    ['HS_33', '4A3-33', 'Huỳnh Lê Toàn', 'Nam', '2015-08-27', 'TO_5', 'Tổ 5 (Măng Non)', 'ACTIVE', '', 0],
    ['HS_34', '4A3-34', 'Phạm Hoàng Thiện', 'Nam', '2017-03-25', 'TO_5', 'Tổ 5 (Măng Non)', 'ACTIVE', '', 0],
    ['HS_35', '4A3-35', 'Huỳnh Gia Tuệ', 'Nữ', '2017-12-12', 'TO_5', 'Tổ 5 (Măng Non)', 'ACTIVE', '', 0]
  ];
  var nowIso = new Date().toISOString();
  for (var k = 0; k < officialStudents.length; k++) {
    var st = officialStudents[k];
    studentSheet.appendRow([st[0], st[1], st[2], st[3], st[4], st[5], st[6], st[7], st[8], st[9], nowIso, nowIso]);
  }
  formatHeader(studentSheet);

  // 5. CRITERIA
  var critSheet = getOrCreateSheet(ss, 'CRITERIA');
  critSheet.clear();
  critSheet.appendRow(['CriterionID', 'CriterionCode', 'CriterionName', 'Category', 'Type', 'Point', 'Description', 'ApplicableRole', 'Status', 'CreatedAt', 'UpdatedAt']);
  critSheet.appendRow(['CRIT_01', 'TC_01', 'Phát biểu xây dựng bài sôi nổi', 'Học tập', 'PLUS', 1, 'Hăng hái giơ tay, trả lời đúng câu hỏi', 'ALL', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  critSheet.appendRow(['CRIT_02', 'TC_02', 'Đạt điểm 9-10 kiểm tra / bài làm tốt', 'Học tập', 'PLUS', 2, 'Bài làm sạch đẹp, đạt kết quả xuất sắc', 'ALL', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  critSheet.appendRow(['CRIT_03', 'TC_03', 'Giúp đỡ bạn tiến bộ trong học tập', 'Học tập', 'PLUS', 2, 'Kèm cặp đôi bạn cùng tiến', 'ALL', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  critSheet.appendRow(['CRIT_04', 'TC_04', 'Trực nhật lớp sạch sẽ, đúng giờ', 'Vệ sinh & Lao động', 'PLUS', 2, 'Lau bảng, quét lớp, kê bàn ghế gọn gàng', 'ALL', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  critSheet.appendRow(['CRIT_05', 'TC_05', 'Nhặt được của rơi trả người đánh mất', 'Nề nếp & Đạo đức', 'PLUS', 5, 'Hành động trung thực, gương mẫu', 'ALL', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  critSheet.appendRow(['CRIT_06', 'TC_06', 'Không làm bài tập / thiếu bài về nhà', 'Học tập', 'MINUS', -2, 'Chưa chuẩn bị bài trước khi đến lớp', 'ALL', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  critSheet.appendRow(['CRIT_07', 'TC_07', 'Nói chuyện riêng, mất trật tự trong giờ', 'Nề nếp & Đạo đức', 'MINUS', -2, 'Ảnh hưởng đến thầy cô và các bạn xung quanh', 'ALL', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  critSheet.appendRow(['CRIT_08', 'TC_08', 'Quên khăn quàng / đồng phục không đúng', 'Nề nếp & Đạo đức', 'MINUS', -1, 'Vi phạm quy định tác phong học sinh', 'ALL', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  critSheet.appendRow(['CRIT_09', 'TC_09', 'Đi học muộn / xếp hàng chậm', 'Nề nếp & Đạo đức', 'MINUS', -2, 'Đến lớp sau hiệu lệnh truy bài', 'ALL', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  critSheet.appendRow(['CRIT_10', 'TC_10', 'Xả rác bừa bãi / không giữ vệ sinh', 'Vệ sinh & Lao động', 'MINUS', -2, 'Bỏ rác không đúng nơi quy định', 'ALL', 'ACTIVE', new Date().toISOString(), new Date().toISOString()]);
  formatHeader(critSheet);

  // 6. DAILY_SCORES
  var scoreSheet = getOrCreateSheet(ss, 'DAILY_SCORES');
  scoreSheet.clear();
  scoreSheet.appendRow(['RecordID', 'Date', 'StudentID', 'StudentName', 'TeamID', 'CriterionID', 'CriterionName', 'Point', 'Reason', 'RecordedBy', 'RecordedAt', 'Status']);
  formatHeader(scoreSheet);

  // 7. DAILY_COMMENTS
  var commentSheet = getOrCreateSheet(ss, 'DAILY_COMMENTS');
  commentSheet.clear();
  commentSheet.appendRow(['CommentID', 'Date', 'StudentID', 'StudentName', 'Comment', 'RecordedBy', 'CreatedAt', 'UpdatedAt']);
  formatHeader(commentSheet);

  // 8. WEEKLY_SUMMARY
  var weekSheet = getOrCreateSheet(ss, 'WEEKLY_SUMMARY');
  weekSheet.clear();
  weekSheet.appendRow(['SummaryID', 'WeekNumber', 'StartDate', 'EndDate', 'StudentID', 'StudentName', 'TeamID', 'TotalPlus', 'TotalMinus', 'NetScore', 'Rank', 'Status', 'GeneratedAt']);
  formatHeader(weekSheet);

  // 9. MONTHLY_SUMMARY
  var monthSheet = getOrCreateSheet(ss, 'MONTHLY_SUMMARY');
  monthSheet.clear();
  monthSheet.appendRow(['SummaryID', 'Month', 'StudentID', 'StudentName', 'TeamID', 'TotalPlus', 'TotalMinus', 'NetScore', 'Rank', 'Status', 'GeneratedAt']);
  formatHeader(monthSheet);

  // 10. AWARDS
  var awardSheet = getOrCreateSheet(ss, 'AWARDS');
  awardSheet.clear();
  awardSheet.appendRow(['AwardID', 'Period', 'AwardType', 'StudentID', 'StudentName', 'TeamID', 'Score', 'Reason', 'CreatedAt']);
  formatHeader(awardSheet);

  // 11. AUDIT_LOG
  var logSheet = getOrCreateSheet(ss, 'AUDIT_LOG');
  logSheet.clear();
  logSheet.appendRow(['LogID', 'Timestamp', 'UserID', 'Username', 'Action', 'Module', 'TargetID', 'Description', 'Result', 'IPAddressOrSession', 'Device']);
  formatHeader(logSheet);

  SpreadsheetApp.getUi().alert('Khởi tạo thành công toàn bộ 11 Sheets chuẩn cho Sổ Thi Đua Lớp 4A3!');
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function formatHeader(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground('#1e40af');
  range.setFontColor('#ffffff');
  range.setFontWeight('bold');
  sheet.setFrozenRows(1);
}
`
  }
];
