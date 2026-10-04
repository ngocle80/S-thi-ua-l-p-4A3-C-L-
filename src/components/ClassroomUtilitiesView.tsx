import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wrench,
  Clock,
  Users,
  Dices,
  TrafficCone,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Shuffle,
  AlertCircle,
  BellRing,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, AppConfig } from '../types';
import { ClassRoleBadge } from './ClassRoleBadge';

interface ClassroomUtilitiesViewProps {
  students: Student[];
  config: AppConfig;
}

type UtilityTab = 'timer' | 'groups' | 'dice' | 'traffic' | 'picker';

export const ClassroomUtilitiesView: React.FC<ClassroomUtilitiesViewProps> = ({
  students,
  config,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<UtilityTab>('timer');

  // ========================================================
  // 1. STATE & LOGIC: ĐỒNG HỒ ĐẾM NGƯỢC (TIMER)
  // ========================================================
  const [initialSeconds, setInitialSeconds] = useState<number>(300); // Mặc định 5 phút (300s)
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Form tùy chỉnh phút/giây
  const [customMinutes, setCustomMinutes] = useState<number>(5);
  const [customSeconds, setCustomSeconds] = useState<number>(0);

  // Ref lưu timer interval
  const timerRef = useRef<any>(null);
  const timerContainerRef = useRef<HTMLDivElement>(null);

  // Web Audio API: Phát âm thanh chuông leng keng vui tươi khi hết giờ
  const playAlarmSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      // Chuỗi nốt nhạc C - E - G - C cao
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const startTime = ctx.currentTime + index * 0.15;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (e) {
      console.log('Audio playback error', e);
    }
  }, [soundEnabled]);

  // Bộ đếm đếm ngược
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            setIsFinished(true);
            playAlarmSound();
            // Bắn pháo hoa ăn mừng
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, playAlarmSound]);

  // Thiết lập thời gian từ nút chọn nhanh
  const handleSelectQuickTime = (seconds: number) => {
    setIsRunning(false);
    setIsFinished(false);
    setInitialSeconds(seconds);
    setTimeLeft(seconds);
    setCustomMinutes(Math.floor(seconds / 60));
    setCustomSeconds(seconds % 60);
  };

  // Áp dụng thời gian từ form tự chỉnh
  const handleApplyCustomTime = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSecs = (Number(customMinutes) || 0) * 60 + (Number(customSeconds) || 0);
    if (totalSecs <= 0) return;
    setIsRunning(false);
    setIsFinished(false);
    setInitialSeconds(totalSecs);
    setTimeLeft(totalSecs);
  };

  // Nút Bắt đầu / Tạm dừng
  const handleTogglePlay = () => {
    if (timeLeft === 0) {
      // Nếu đã về 0, khôi phục lại mức ban đầu rồi chạy
      setTimeLeft(initialSeconds);
      setIsFinished(false);
      setIsRunning(true);
    } else {
      setIsFinished(false);
      setIsRunning(!isRunning);
    }
  };

  // Nút Đặt lại (Reset)
  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(initialSeconds);
  };

  // Định dạng thời gian MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Tính tỷ lệ % thời gian còn lại
  const progressPercent = initialSeconds > 0 ? (timeLeft / initialSeconds) * 100 : 0;

  // Bật/tắt toàn màn hình cho đồng hồ
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      timerContainerRef.current?.requestFullscreen?.();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullScreen(false);
    }
  };

  // ========================================================
  // 2. STATE & LOGIC: CHIA NHÓM NGẪU NHIÊN
  // ========================================================
  const [numGroups, setNumGroups] = useState<number>(4);
  const [balancedGender, setBalancedGender] = useState<boolean>(true);
  const [generatedGroups, setGeneratedGroups] = useState<{ id: number; name: string; color: string; members: Student[] }[]>([]);
  const [isShufflingGroups, setIsShufflingGroups] = useState<boolean>(false);
  const [copiedGroups, setCopiedGroups] = useState<boolean>(false);

  const groupColors = [
    { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
    { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
    { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  ];

  const handleGenerateGroups = () => {
    if (students.length === 0) return;
    setIsShufflingGroups(true);

    setTimeout(() => {
      const activeStudents = [...students].filter((s) => s.Status === 'ACTIVE');
      let shuffled: Student[] = [];

      if (balancedGender) {
        const boys = activeStudents.filter((s) => s.Gender === 'Nam').sort(() => Math.random() - 0.5);
        const girls = activeStudents.filter((s) => s.Gender === 'Nữ').sort(() => Math.random() - 0.5);
        const maxLen = Math.max(boys.length, girls.length);
        for (let i = 0; i < maxLen; i++) {
          if (boys[i]) shuffled.push(boys[i]);
          if (girls[i]) shuffled.push(girls[i]);
        }
      } else {
        shuffled = activeStudents.sort(() => Math.random() - 0.5);
      }

      const groups: { id: number; name: string; color: string; members: Student[] }[] = [];
      for (let g = 0; g < numGroups; g++) {
        groups.push({
          id: g + 1,
          name: `Nhóm ${g + 1}`,
          color: groupColors[g % groupColors.length].bg,
          members: [],
        });
      }

      shuffled.forEach((student, index) => {
        const targetGroup = index % numGroups;
        groups[targetGroup].members.push(student);
      });

      setGeneratedGroups(groups);
      setIsShufflingGroups(false);
    }, 400);
  };

  const handleCopyGroups = () => {
    if (generatedGroups.length === 0) return;
    const text = generatedGroups
      .map((g) => `📌 ${g.name} (${g.members.length} học sinh):\n` + g.members.map((m, i) => `  ${i + 1}. ${m.FullName} (${m.Gender})`).join('\n'))
      .join('\n\n');
    navigator.clipboard.writeText(`KẾT QUẢ CHIA NHÓM LỚP 4A3:\n\n${text}`);
    setCopiedGroups(true);
    setTimeout(() => setCopiedGroups(false), 2000);
  };

  // ========================================================
  // 3. STATE & LOGIC: XÚC XẮC (DICE)
  // ========================================================
  const [numDice, setNumDice] = useState<number>(1);
  const [diceValues, setDiceValues] = useState<number[]>([6]);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [diceHistory, setDiceHistory] = useState<{ id: number; values: number[]; total: number; time: string }[]>([]);

  const handleRollDice = () => {
    setIsRollingDice(true);
    let count = 0;
    const interval = setInterval(() => {
      const tempVals = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
      setDiceValues(tempVals);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const finalVals = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
        setDiceValues(finalVals);
        setIsRollingDice(false);
        const total = finalVals.reduce((a, b) => a + b, 0);
        setDiceHistory((prev) => [
          {
            id: Date.now(),
            values: finalVals,
            total,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
          ...prev.slice(0, 7),
        ]);
      }
    }, 60);
  };

  // ========================================================
  // 4. STATE & LOGIC: ĐÈN TÍN HIỆU LỚP HỌC (TRAFFIC LIGHT)
  // ========================================================
  type TrafficMode = 'RED' | 'YELLOW' | 'GREEN';
  const [trafficMode, setTrafficMode] = useState<TrafficMode>('GREEN');

  // ========================================================
  // 5. STATE & LOGIC: GỌI TÊN NGẪU NHIÊN (RANDOM PICKER)
  // ========================================================
  const [selectedRandomStudent, setSelectedRandomStudent] = useState<Student | null>(null);
  const [isPicking, setIsPicking] = useState<boolean>(false);

  const handlePickRandomStudent = () => {
    if (students.length === 0) return;
    setIsPicking(true);
    setSelectedRandomStudent(null);

    let counter = 0;
    const active = students.filter((s) => s.Status === 'ACTIVE');
    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * active.length);
      setSelectedRandomStudent(active[randIdx]);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        const chosen = active[Math.floor(Math.random() * active.length)];
        setSelectedRandomStudent(chosen);
        setIsPicking(false);
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      }
    }, 80);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* ======================================================== */}
      {/* 1. BỐ CỤC HEADER (THEO ĐÚNG YÊU CẦU THIẾT KẾ) */}
      {/* ======================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Bên trái: Icon cờ lê nền xanh lá đậm + Tiêu đề + Phụ đề */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
            <Wrench className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Tiện Ích Hỗ Trợ Lớp Học
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {config.ClassName || 'Lớp 4A3'} • {config.SchoolName || 'Trường Tiểu học Thị Trấn Rạch Gòi A'} • GVCN: {config.TeacherInCharge || 'Cô Phạm Ngọc Lê'}
            </p>
          </div>
        </div>

        {/* Bên phải: Menu cuộn ngang chứa các tab tiện ích */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveSubTab('timer')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              activeSubTab === 'timer'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Đồng Hồ</span>
          </button>

          <button
            onClick={() => setActiveSubTab('groups')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              activeSubTab === 'groups'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Chia Nhóm</span>
          </button>

          <button
            onClick={() => setActiveSubTab('dice')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              activeSubTab === 'dice'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Xúc Xắc</span>
          </button>

          <button
            onClick={() => setActiveSubTab('traffic')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              activeSubTab === 'traffic'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TrafficCone className="w-4 h-4" />
            <span>Đèn Tín Hiệu</span>
          </button>

          <button
            onClick={() => setActiveSubTab('picker')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              activeSubTab === 'picker'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Gọi Tên Ngẫu Nhiên</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. GIAO DIỆN TAB: ĐỒNG HỒ (BẤM GIỜ & ĐẾM NGƯỢC LỚP HỌC) */}
      {/* ======================================================== */}
      {activeSubTab === 'timer' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6">
          {/* Màn hình chính đồng hồ kỹ thuật số */}
          <div
            ref={timerContainerRef}
            className={`relative rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center transition-all overflow-hidden ${
              isFinished
                ? 'bg-gradient-to-b from-rose-950 to-slate-900 border-4 border-rose-500 shadow-2xl'
                : isRunning
                ? 'bg-gradient-to-b from-slate-900 to-emerald-950 border-4 border-emerald-500/50 shadow-2xl'
                : 'bg-slate-900 border-4 border-slate-700 shadow-xl'
            }`}
          >
            {/* Top Bar bên trong màn hình đồng hồ */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 font-semibold mb-2 sm:mb-4">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isFinished
                      ? 'bg-rose-500 animate-ping'
                      : isRunning
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-500'
                  }`}
                />
                <span className="uppercase tracking-wider font-bold">
                  {isFinished ? 'ĐÃ HẾT GIỜ !' : isRunning ? 'ĐANG ĐẾM NGƯỢC' : 'SẴN SÀNG'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Đang bật chuông báo' : 'Đang tắt chuông báo'}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer transition-colors"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </button>
                <button
                  onClick={toggleFullScreen}
                  title="Phóng to toàn màn hình máy chiếu"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer transition-colors"
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Chữ số điện tử cỡ lớn hiển thị thời gian */}
            <div className="my-2 sm:my-4 text-center select-none">
              <span
                className={`font-mono font-black text-6xl sm:text-8xl md:text-9xl tracking-wider tabular-nums transition-colors ${
                  isFinished
                    ? 'text-rose-400 drop-shadow-[0_0_35px_rgba(244,63,94,0.6)] animate-bounce'
                    : timeLeft <= 10 && isRunning
                    ? 'text-rose-400 drop-shadow-[0_0_25px_rgba(244,63,94,0.5)] animate-pulse'
                    : 'text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.35)]'
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Thông báo hoàn thành khi về 00:00 */}
            {isFinished && (
              <div className="mt-2 text-rose-400 font-extrabold text-sm sm:text-base flex items-center space-x-2 animate-bounce">
                <BellRing className="w-5 h-5" />
                <span>⏰ HẾT THỜI GIAN LÀM BÀI / THẢO LUẬN!</span>
              </div>
            )}

            {/* Thanh tiến trình thời gian mượt mà */}
            <div className="w-full max-w-xl h-2.5 bg-white/10 rounded-full mt-4 sm:mt-6 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isFinished ? 'bg-rose-500' : timeLeft <= 10 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Hàng nút chọn nhanh (pill-shaped) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Chọn nhanh thời gian:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: '30 giây', sec: 30 },
                { label: '1 phút', sec: 60 },
                { label: '1 phút 30 giây', sec: 90 },
                { label: '3 phút', sec: 180 },
                { label: '5 phút', sec: 300 },
                { label: '10 phút', sec: 600 },
                { label: '15 phút', sec: 900 },
              ].map((item) => (
                <button
                  key={item.sec}
                  type="button"
                  onClick={() => handleSelectQuickTime(item.sec)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    initialSeconds === item.sec && !isRunning
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-400 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form tùy chỉnh thời gian: Phút & Giây + Nút Áp Dụng */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <form onSubmit={handleApplyCustomTime} className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-slate-700">Tự chỉnh thời gian:</span>
                <div className="flex items-center space-x-1.5">
                  <div className="flex items-center space-x-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 text-center text-sm font-bold text-slate-800 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium">phút</span>
                  </div>

                  <span className="text-slate-400 font-bold">:</span>

                  <div className="flex items-center space-x-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={customSeconds}
                      onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-12 text-center text-sm font-bold text-slate-800 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium">giây</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-95"
              >
                Áp Dụng
              </button>
            </form>
          </div>

          {/* Nút điều khiển: Bắt đầu / Tạm dừng & Đặt lại */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`w-full sm:w-auto min-w-[200px] px-8 py-3.5 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-lg active:scale-95 ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Tạm Dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>{timeLeft === 0 ? 'Chạy Lại' : 'Bắt Đầu'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto min-w-[150px] px-6 py-3.5 rounded-2xl font-bold text-base bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-5 h-5 text-slate-500" />
              <span>Đặt Lại</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. GIAO DIỆN TAB: CHIA NHÓM NGẪU NHIÊN */}
      {/* ======================================================== */}
      {activeSubTab === 'groups' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Chia Nhóm Học Tập Ngẫu Nhiên</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động chia đều 35 học sinh Lớp 4A3 thành các nhóm thảo luận, bài tập nhóm hoặc trò chơi
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {generatedGroups.length > 0 && (
                <button
                  onClick={handleCopyGroups}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedGroups ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedGroups ? 'Đã sao chép' : 'Sao chép kết quả'}</span>
                </button>
              )}

              <button
                disabled={isShufflingGroups}
                onClick={handleGenerateGroups}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Shuffle className={`w-4 h-4 ${isShufflingGroups ? 'animate-spin' : ''}`} />
                <span>{isShufflingGroups ? 'Đang chia nhóm...' : 'Xáo Trộn & Chia Nhóm'}</span>
              </button>
            </div>
          </div>

          {/* Tùy chọn cấu hình chia nhóm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Số lượng nhóm muốn chia:</label>
              <div className="flex items-center space-x-1.5 flex-wrap">
                {[2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumGroups(num)}
                    className={`w-9 h-9 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                      numGroups === num
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:justify-end">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={balancedGender}
                  onChange={(e) => setBalancedGender(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700">
                  Cân đối tỷ lệ Nam / Nữ giữa các nhóm
                </span>
              </label>
            </div>
          </div>

          {/* Danh sách các nhóm sau khi chia */}
          {generatedGroups.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">Chưa có nhóm nào được chia</p>
              <p className="text-xs text-slate-400 mt-1">
                Bấm vào nút <strong>&ldquo;Xáo Trộn & Chia Nhóm&rdquo;</strong> ở trên để bắt đầu
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {generatedGroups.map((group, idx) => (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col"
                >
                  <div className={`p-3 text-white font-black text-sm flex items-center justify-between ${group.color}`}>
                    <span>{group.name}</span>
                    <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-bold">
                      {group.members.length} HS
                    </span>
                  </div>

                  <div className="p-3 divide-y divide-slate-100 flex-1 space-y-2">
                    {group.members.map((member, mIdx) => (
                      <div key={member.StudentID} className="flex items-center space-x-2.5 pt-1.5 first:pt-0">
                        <span className="text-xs font-bold text-slate-400 w-4 text-center">
                          {mIdx + 1}
                        </span>
                        <img
                          src={member.AvatarURL || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'}
                          alt={member.FullName}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1 flex-wrap">
                            <p className="text-xs font-bold text-slate-800 truncate">{member.FullName}</p>
                            <ClassRoleBadge role={member.ClassRole} size="xs" />
                          </div>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                              member.Gender === 'Nữ' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {member.Gender}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. GIAO DIỆN TAB: XÚC XẮC (DICE) */}
      {/* ======================================================== */}
      {activeSubTab === 'dice' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                <Dices className="w-5 h-5 text-emerald-600" />
                <span>Xúc Xắc Lớp Học May Mắn</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dùng cho các trò chơi học tập, chia lượt phát biểu hoặc câu hỏi thử thách
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">Số xúc xắc:</span>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setNumDice(n);
                    setDiceValues(Array.from({ length: n }, () => 6));
                  }}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    numDice === n ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Vùng hiển thị xúc xắc */}
          <div className="py-8 bg-gradient-to-b from-emerald-900 to-slate-900 rounded-3xl flex flex-col items-center justify-center p-6 text-white shadow-xl">
            <div className="flex items-center justify-center gap-6 my-4">
              {diceValues.map((val, idx) => (
                <div
                  key={idx}
                  className={`w-24 h-24 sm:w-28 sm:h-28 bg-white text-slate-900 rounded-3xl shadow-2xl border-4 border-amber-300 flex items-center justify-center transform transition-transform select-none ${
                    isRollingDice ? 'animate-bounce rotate-12 scale-105' : 'hover:scale-105'
                  }`}
                >
                  <span className="text-5xl sm:text-6xl font-black text-slate-800">{val}</span>
                </div>
              ))}
            </div>

            {/* Tổng điểm xúc xắc */}
            <div className="text-center mt-3">
              <div className="text-xs uppercase font-extrabold text-emerald-300">Tổng điểm</div>
              <div className="text-3xl sm:text-4xl font-black text-white">
                {diceValues.reduce((a, b) => a + b, 0)}
              </div>
            </div>

            <button
              disabled={isRollingDice}
              onClick={handleRollDice}
              className="mt-6 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-base shadow-lg shadow-amber-500/30 flex items-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Dices className={`w-5 h-5 ${isRollingDice ? 'animate-spin' : ''}`} />
              <span>{isRollingDice ? 'Đang Lắc Xúc Xắc...' : 'Tung Xúc Xắc'}</span>
            </button>
          </div>

          {/* Lịch sử các lần lắc */}
          {diceHistory.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Lịch sử các lần tung gần nhất:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {diceHistory.map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center space-x-2"
                  >
                    <span className="font-bold text-emerald-700">{item.values.join(' + ')} = {item.total}</span>
                    <span className="text-[10px] text-slate-400">({item.time})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. GIAO DIỆN TAB: ĐÈN TÍN HIỆU LỚP HỌC (TRAFFIC LIGHT) */}
      {/* ======================================================== */}
      {activeSubTab === 'traffic' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
              <TrafficCone className="w-5 h-5 text-emerald-600" />
              <span>Đèn Tín Hiệu & Quy Ước Nề Nếp Lớp Học</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quy định mức độ âm lượng và hình thức làm việc của cả lớp bằng màu sắc đèn trực quan
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-4">
            {/* Cột đèn giao thông 3 bóng */}
            <div className="w-36 bg-slate-900 p-4 rounded-4xl border-4 border-slate-800 shadow-2xl flex flex-col items-center space-y-4">
              {/* Đèn Đỏ */}
              <button
                type="button"
                onClick={() => setTrafficMode('RED')}
                className={`w-24 h-24 rounded-full transition-all cursor-pointer border-4 flex items-center justify-center ${
                  trafficMode === 'RED'
                    ? 'bg-rose-500 border-white shadow-[0_0_30px_rgba(244,63,94,0.8)] scale-105'
                    : 'bg-rose-950/60 border-rose-900/40 opacity-40 hover:opacity-60'
                }`}
              >
                {trafficMode === 'RED' && <span className="text-2xl">🤫</span>}
              </button>

              {/* Đèn Vàng */}
              <button
                type="button"
                onClick={() => setTrafficMode('YELLOW')}
                className={`w-24 h-24 rounded-full transition-all cursor-pointer border-4 flex items-center justify-center ${
                  trafficMode === 'YELLOW'
                    ? 'bg-amber-400 border-white shadow-[0_0_30px_rgba(251,191,36,0.8)] scale-105'
                    : 'bg-amber-950/60 border-amber-900/40 opacity-40 hover:opacity-60'
                }`}
              >
                {trafficMode === 'YELLOW' && <span className="text-2xl">💬</span>}
              </button>

              {/* Đèn Xanh */}
              <button
                type="button"
                onClick={() => setTrafficMode('GREEN')}
                className={`w-24 h-24 rounded-full transition-all cursor-pointer border-4 flex items-center justify-center ${
                  trafficMode === 'GREEN'
                    ? 'bg-emerald-500 border-white shadow-[0_0_30px_rgba(16,185,129,0.8)] scale-105'
                    : 'bg-emerald-950/60 border-emerald-900/40 opacity-40 hover:opacity-60'
                }`}
              >
                {trafficMode === 'GREEN' && <span className="text-2xl">🎉</span>}
              </button>
            </div>

            {/* Bảng giải thích chi tiết trạng thái hiện tại */}
            <div className="flex-1 max-w-md w-full space-y-3">
              <div
                className={`p-5 rounded-3xl border-2 transition-all ${
                  trafficMode === 'RED'
                    ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-md'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-2 font-black text-base text-rose-700">
                  <span className="text-xl">🔴</span>
                  <span>ĐÈN ĐỎ: GIỮ IM LẶNG TUYỆT ĐỐI</span>
                </div>
                <p className="text-xs mt-1 text-slate-600 font-medium">
                  Áp dụng khi: Cô giáo đang giảng bài, làm bài kiểm tra cá nhân, hoặc trong giờ truy bài đầu giờ.
                </p>
              </div>

              <div
                className={`p-5 rounded-3xl border-2 transition-all ${
                  trafficMode === 'YELLOW'
                    ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-md'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-2 font-black text-base text-amber-700">
                  <span className="text-xl">🟡</span>
                  <span>ĐÈN VÀNG: THÌ THẦM / TRAO ĐỔI NHỎ</span>
                </div>
                <p className="text-xs mt-1 text-slate-600 font-medium">
                  Áp dụng khi: Thảo luận cặp đôi, chữa bài cùng bạn bên cạnh, hỏi cô giáo nhẹ nhàng.
                </p>
              </div>

              <div
                className={`p-5 rounded-3xl border-2 transition-all ${
                  trafficMode === 'GREEN'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-md'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-2 font-black text-base text-emerald-700">
                  <span className="text-xl">🟢</span>
                  <span>ĐÈN XANH: THẢO LUẬN TỰ DO & SÔI NỔI</span>
                </div>
                <p className="text-xs mt-1 text-slate-600 font-medium">
                  Áp dụng khi: Thảo luận nhóm lớn, trò chơi khởi động, thi đua văn nghệ hoặc phát biểu sôi nổi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. GIAO DIỆN TAB: GỌI TÊN NGẪU NHIÊN */}
      {/* ======================================================== */}
      {activeSubTab === 'picker' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-black text-slate-800 flex items-center justify-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Gọi Tên Ngẫu Nhiên Lên Bảng</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Quay chọn ngẫu nhiên 1 trong 35 bạn học sinh của Lớp 4A3 để trả lời câu hỏi hoặc nhận quà
            </p>
          </div>

          <div className="py-8 bg-gradient-to-b from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col items-center justify-center">
            {selectedRandomStudent ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-200">
                <img
                  src={selectedRandomStudent.AvatarURL || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'}
                  alt={selectedRandomStudent.FullName}
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-amber-300 shadow-2xl mb-3"
                />
                <h4 className="text-2xl sm:text-3xl font-black text-amber-300">
                  {selectedRandomStudent.FullName}
                </h4>
                {selectedRandomStudent.ClassRole && (
                  <div className="mt-2">
                    <ClassRoleBadge role={selectedRandomStudent.ClassRole} size="sm" variant="solid" />
                  </div>
                )}
                <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                  Mã số: {selectedRandomStudent.StudentCode} • {selectedRandomStudent.TeamName}
                </p>
              </div>
            ) : (
              <div className="py-8">
                <HelpCircle className="w-20 h-20 text-indigo-300/40 mx-auto mb-2" />
                <p className="text-sm font-bold text-indigo-200">Bấm nút bên dưới để chọn ngẫu nhiên học sinh</p>
              </div>
            )}

            <button
              disabled={isPicking}
              onClick={handlePickRandomStudent}
              className="mt-6 px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base shadow-lg shadow-emerald-500/30 flex items-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <UserCheck className={`w-5 h-5 ${isPicking ? 'animate-spin' : ''}`} />
              <span>{isPicking ? 'Đang quay chọn...' : 'Quay Chọn Học Sinh'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
