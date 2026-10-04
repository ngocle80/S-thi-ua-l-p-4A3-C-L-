import React, { useState } from 'react';
import { GAS_BACKEND_FILES, GasFile } from '../services/gasBackendFiles';
import { GoogleSheetsDatabase } from '../services/sheetsEngine';
import {
  Database,
  Code2,
  Table,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  FileCode,
  Sparkles,
  Link,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface SheetsDatabaseModalProps {
  open: boolean;
  onClose: () => void;
  rawDb: GoogleSheetsDatabase;
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
  onTestGasConnection: (url: string) => Promise<any>;
  onResetDatabase: () => void;
  isAdmin?: boolean;
}

export const SheetsDatabaseModal: React.FC<SheetsDatabaseModalProps> = ({
  open,
  onClose,
  rawDb,
  gasUrl,
  onSaveGasUrl,
  onTestGasConnection,
  onResetDatabase,
  isAdmin = false,
}) => {
  const [tab, setTab] = useState<'tables' | 'scripts' | 'connection'>('tables');
  const [activeSheet, setActiveSheet] = useState<keyof GoogleSheetsDatabase>('STUDENTS');
  const [activeFile, setActiveFile] = useState<GasFile>(GAS_BACKEND_FILES[0]);
  const [copied, setCopied] = useState(false);

  // Connection test state
  const [inputUrl, setInputUrl] = useState(gasUrl);
  const [testResult, setTestResult] = useState<{ loading: boolean; res?: any; err?: string }>({
    loading: false,
  });

  if (!open) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePing = async () => {
    if (!inputUrl.trim()) return;
    setTestResult({ loading: true });
    const res = await onTestGasConnection(inputUrl.trim());
    if (res.success) {
      setTestResult({ loading: false, res: res.data });
      onSaveGasUrl(inputUrl.trim());
    } else {
      setTestResult({ loading: false, err: res.message });
    }
  };

  const sheetKeys: (keyof GoogleSheetsDatabase)[] = [
    'STUDENTS',
    'TEAMS',
    'CRITERIA',
    'DAILY_SCORES',
    'DAILY_COMMENTS',
    'USERS',
    'CONFIG',
    'WEEKLY_SUMMARY',
    'MONTHLY_SUMMARY',
    'AWARDS',
    'AUDIT_LOG',
  ];

  const currentSheetData = rawDb[activeSheet];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[92vh] max-h-[92vh] my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base sm:text-lg">
                  Trung Tâm Google Sheets & Google Apps Script
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Lớp 4A3 Database
                </span>
              </div>
              <p className="text-xs text-slate-400">
                11 Bảng tính chuẩn, API backend Google Apps Script và đồng bộ đám mây
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6">
          <button
            onClick={() => setTab('tables')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
              tab === 'tables'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Cơ Sở Dữ Liệu 11 Sheets Live</span>
          </button>

          <button
            onClick={() => setTab('scripts')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
              tab === 'scripts'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Bộ Mã Nguồn Apps Script (11 Files)</span>
          </button>

          <button
            onClick={() => setTab('connection')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
              tab === 'connection'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Kết Nối Web App GAS</span>
          </button>
        </div>

        {/* TAB 1: 11 SHEETS DATA INSPECTOR */}
        {tab === 'tables' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sheet Selector Sidebar */}
            <div className="w-full md:w-56 bg-slate-50 border-r border-slate-200 p-3 overflow-y-auto space-y-1">
              <div className="text-[11px] font-extrabold uppercase text-slate-400 px-2 py-1">
                Bảng Tính (Sheets)
              </div>
              {sheetKeys.map((k) => {
                const count = Array.isArray(rawDb[k]) ? (rawDb[k] as any[]).length : 1;
                return (
                  <button
                    key={k}
                    onClick={() => setActiveSheet(k)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      activeSheet === k
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{k}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        activeSheet === k ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              {isAdmin && (
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      if (confirm('Khôi phục dữ liệu gốc Lớp 4A3 (35 học sinh, 5 tổ, tiêu chí và tài khoản chuẩn)?')) {
                        onResetDatabase();
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục dữ liệu gốc</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sheet Table Viewer */}
            <div className="flex-1 p-4 overflow-auto bg-white flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-black text-sm text-slate-800 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Sheet: {activeSheet}</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Dữ liệu trực tiếp đang được lưu trữ và đồng bộ
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
                {Array.isArray(currentSheetData) ? (
                  currentSheetData.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Sheet này hiện chưa có dòng dữ liệu nào.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-800 text-white font-sans sticky top-0">
                        <tr>
                          {Object.keys(currentSheetData[0]).map((h) => (
                            <th key={h} className="py-2.5 px-3 border-r border-slate-700 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentSheetData.map((row: any, rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-blue-50/50">
                            {Object.keys(row).map((k) => (
                              <td key={k} className="py-2 px-3 border-r border-slate-100 whitespace-nowrap text-slate-700 max-w-xs truncate">
                                {String(row[k] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                ) : (
                  <pre className="p-4 text-xs font-mono text-slate-700 overflow-auto">
                    {JSON.stringify(currentSheetData, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPS SCRIPT CODE VIEWER & EXPORT */}
        {tab === 'scripts' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* File List */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-3 overflow-y-auto space-y-1">
              <div className="text-[11px] font-extrabold uppercase text-slate-400 px-2 py-1">
                Các File Apps Script
              </div>
              {GAS_BACKEND_FILES.map((f) => (
                <button
                  key={f.filename}
                  onClick={() => setActiveFile(f)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer ${
                    activeFile.filename === f.filename
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{f.filename}</span>
                </button>
              ))}
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col bg-slate-900 text-slate-100">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
                <div>
                  <div className="font-mono font-bold text-sm text-blue-400">{activeFile.filename}</div>
                  <div className="text-xs text-slate-400">{activeFile.description}</div>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto rounded-xl bg-slate-950 p-4 border border-slate-800">
                <pre className="font-mono text-xs text-emerald-300 leading-relaxed">
                  {activeFile.code}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GAS WEB APP CONNECTION SETUP */}
        {tab === 'connection' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-3xl mx-auto">
            <div className="space-y-2">
              <h4 className="font-black text-lg text-slate-800">
                Kết Nối Trực Tiếp Tới Google Apps Script Web App
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sau khi copy mã từ tab &ldquo;Bộ Mã Nguồn Apps Script&rdquo; vào Google Spreadsheet của bạn (Tiện ích mở rộng &rarr; Apps Script), bạn hãy triển khai dưới dạng <strong>Web App</strong> với quyền truy cập <strong>&ldquo;Bất kỳ ai&rdquo; (Anyone)</strong>. Sau đó dán URL Web App vào ô dưới đây để ứng dụng gửi trực tiếp mọi yêu cầu ghi điểm và nhận xét vào Google Sheets của bạn.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
              <label className="block text-xs font-extrabold uppercase text-blue-900">
                URL Triển Khai Web App Google Apps Script:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-blue-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={handlePing}
                  disabled={testResult.loading || !inputUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${testResult.loading ? 'animate-spin' : ''}`} />
                  <span>Kiểm tra kết nối</span>
                </button>
              </div>

              {testResult.err && (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{testResult.err}</span>
                </div>
              )}

              {testResult.res && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-medium flex items-center space-x-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>Kết nối thành công! Đã đồng bộ với Google Apps Script.</span>
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <h5 className="font-extrabold text-slate-800 uppercase">3 Bước Cài Đặt Trên Google Sheets:</h5>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>Tạo một Google Spreadsheet mới, đặt tên <strong>Sổ Thi Đua Lớp 4A3</strong>.</li>
                <li>Vào <strong>Tiện ích mở rộng (Extensions) &rarr; Apps Script</strong>, dán toàn bộ code của 11 file ở tab bên cạnh.</li>
                <li>Chạy hàm <code>setupAllSheets()</code> trong file <code>SetupSheets.gs</code> để tự động tạo đầy đủ 11 Sheets chuẩn với định dạng và dữ liệu 35 học sinh Lớp 4A3.</li>
                <li>Nhấn <strong>Triển khai (Deploy) &rarr; Triển khai mới (New deployment) &rarr; Web App</strong>, chọn <em>Execute as: Me</em> và <em>Who has access: Anyone</em>. Dán URL nhận được vào đây!</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
