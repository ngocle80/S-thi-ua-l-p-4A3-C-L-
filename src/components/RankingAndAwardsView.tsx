import React, { useState } from 'react';
import { StudentScoreSummary, TeamScoreSummary } from '../types';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Sparkles,
  Users,
  Search,
  Star,
  Shield,
} from 'lucide-react';
import { ClassRoleBadge } from './ClassRoleBadge';

interface RankingAndAwardsViewProps {
  studentSummaries: StudentScoreSummary[];
  teamSummaries: TeamScoreSummary[];
}

export const RankingAndAwardsView: React.FC<RankingAndAwardsViewProps> = ({
  studentSummaries,
  teamSummaries,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'teams' | 'badges'>('students');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = studentSummaries.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.student.FullName.toLowerCase().includes(q) ||
        s.student.StudentCode.toLowerCase().includes(q) ||
        s.student.TeamName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl shadow-amber-500/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-100 mb-1">
              <Crown className="w-3.5 h-3.5 text-amber-200" />
              <span>Bảng Vinh Danh Phong Trào Thi Đua</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Bảng Vàng Thi Đua Lớp 4A3
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm max-w-xl">
              Tuyên dương các cá nhân xuất sắc và các tổ dẫn đầu trong học tập, nề nếp và phong trào
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white/15 p-1 rounded-2xl backdrop-blur-md border border-white/20">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeTab === 'students' ? 'bg-white text-orange-800 shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              Học Sinh ({studentSummaries.length})
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeTab === 'teams' ? 'bg-white text-orange-800 shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              5 Tổ Thi Đua
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeTab === 'badges' ? 'bg-white text-orange-800 shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              Huy Hiệu Thi Đua
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: BẢNG XẾP HẠNG HỌC SINH */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-800 flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Xếp Hạng Thi Đua Cá Nhân</span>
            </h2>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm học sinh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Hạng</th>
                    <th className="py-3 px-4">Học Sinh</th>
                    <th className="py-3 px-4">Tổ</th>
                    <th className="py-3 px-4 text-center">Khởi Tạo</th>
                    <th className="py-3 px-4 text-center">Điểm Cộng (+)</th>
                    <th className="py-3 px-4 text-center">Điểm Trừ (-)</th>
                    <th className="py-3 px-4 text-center">Tổng Điểm</th>
                    <th className="py-3 px-4">Huy Hiệu Tuyên Dương</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((item) => {
                    const isTop1 = item.rank === 1;
                    const isTop2 = item.rank === 2;
                    const isTop3 = item.rank === 3;

                    return (
                      <tr
                        key={item.student.StudentID}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isTop1 ? 'bg-amber-50/40' : isTop2 ? 'bg-slate-50/40' : isTop3 ? 'bg-orange-50/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-black">
                          <div className="flex items-center space-x-1.5">
                            {isTop1 ? (
                              <span className="w-7 h-7 rounded-full bg-amber-400 text-blue-950 font-black flex items-center justify-center shadow-xs">
                                🥇
                              </span>
                            ) : isTop2 ? (
                              <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-black flex items-center justify-center shadow-xs">
                                🥈
                              </span>
                            ) : isTop3 ? (
                              <span className="w-7 h-7 rounded-full bg-orange-200 text-orange-900 font-black flex items-center justify-center shadow-xs">
                                🥉
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                                {item.rank}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={item.student.AvatarURL}
                              alt={item.student.FullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                <span className="font-extrabold text-slate-900">{item.student.FullName}</span>
                                <ClassRoleBadge role={item.student.ClassRole} size="xs" />
                              </div>
                              <div className="text-[11px] text-slate-400">{item.student.StudentCode}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {item.student.TeamName}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                          {item.initialScore}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                          +{item.totalPlus}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-rose-600">
                          -{item.totalMinus}
                        </td>

                        <td className="py-3.5 px-4 text-center font-black text-blue-700 text-base">
                          {item.netScore}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {item.badges.length > 0 ? (
                              item.badges.map((b, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200"
                                >
                                  {b}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs italic">Cố gắng rèn luyện</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BẢNG XẾP HẠNG 5 TỔ */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamSummaries.map((t, idx) => (
            <div
              key={t.team.TeamID}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${
                idx === 0
                  ? 'border-amber-400 ring-2 ring-amber-400/20 bg-gradient-to-b from-amber-50/30 to-white'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                      {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🚩'}
                    </span>
                    <h3 className="font-black text-slate-800 text-base">{t.team.TeamName}</h3>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    idx === 0 ? 'bg-amber-400 text-blue-950' : 'bg-slate-100 text-slate-700'
                  }`}>
                    Hạng {t.rank}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 mb-4">
                  <div>Tổ trưởng phụ trách: <strong>{t.team.TeamLeaderName}</strong></div>
                  <div>Sĩ số tổ: <strong>{t.memberCount} học sinh</strong></div>
                </div>

                {/* Score stats */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center mb-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Điểm TB</div>
                    <div className="text-lg font-black text-blue-700">{t.averageScore}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Cộng</div>
                    <div className="text-sm font-bold text-emerald-600">+{t.totalPlus}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Trừ</div>
                    <div className="text-sm font-bold text-rose-600">-{t.totalMinus}</div>
                  </div>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
                Tổng điểm cả tổ: <span className="font-black text-slate-800">{t.totalScore}đ</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: DANH HIỆU & HUY HIỆU THI ĐUA */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: '🌟 Ngôi sao việc tốt',
              rule: 'Đạt từ 10 điểm cộng việc tốt trở lên',
              desc: 'Tuyên dương tinh thần nhiệt tình, đóng góp nhiều hành động tốt cho lớp.',
              color: 'from-amber-500 to-yellow-500',
            },
            {
              title: '🛡️ Nề nếp gương mẫu',
              rule: 'Có điểm cộng và không vi phạm bất kỳ lỗi nề nếp nào',
              desc: 'Học sinh chuẩn mực, đúng giờ, đồng phục nghiêm túc, trật tự trong giờ học.',
              color: 'from-blue-600 to-indigo-600',
            },
            {
              title: '🤝 Người bạn tốt',
              rule: 'Có điểm cộng giúp đỡ bạn cùng tiến trong học tập',
              desc: 'Giúp đỡ kèm cặp bạn bè, tinh thần đoàn kết thân ái cao.',
              color: 'from-emerald-500 to-teal-600',
            },
            {
              title: '🧹 Siêu trực nhật',
              rule: 'Có điểm cộng hoàn thành xuất sắc nhiệm vụ vệ sinh lớp',
              desc: 'Giữ gìn bàn ghế sạch sẽ, chăm sóc bồn hoa lớp học.',
              color: 'from-cyan-500 to-blue-500',
            },
            {
              title: '💎 Tấm gương trung thực',
              rule: 'Nhặt được của rơi trả lại người đánh mất',
              desc: 'Được tuyên dương toàn trường vì lòng trung thực và đạo đức tốt.',
              color: 'from-purple-600 to-pink-600',
            },
            {
              title: '🙋 Hăng hái phát biểu',
              rule: 'Nhiều lần giơ tay xây dựng bài sôi nổi trong các tiết học',
              desc: 'Phát huy tinh thần tự chủ, tích cực trong giờ học.',
              color: 'from-rose-500 to-orange-500',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center font-bold text-lg shadow-md`}>
                  ★
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">{item.title}</h3>
                  <div className="text-[11px] font-bold text-blue-600">{item.rule}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
