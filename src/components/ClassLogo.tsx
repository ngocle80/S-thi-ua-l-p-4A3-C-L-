import React, { useRef, useState } from 'react';
import { GraduationCap, Camera, Loader2, Check, AlertCircle } from 'lucide-react';

interface ClassLogoProps {
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onUploadLogo?: (fileDataUrl: string) => Promise<{ success: boolean; message?: string }>;
  className?: string;
}

export const ClassLogo: React.FC<ClassLogoProps> = ({
  logoUrl,
  size = 'md',
  editable = false,
  onUploadLogo,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const displayUrl = previewUrl || logoUrl;

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-20 h-20 rounded-3xl',
  }[size];

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-11 h-11',
  }[size];

  const cameraBadgeSizes = {
    sm: 'w-5 h-5 -bottom-1 -right-1',
    md: 'w-6 h-6 -bottom-1 -right-1',
    lg: 'w-7 h-7 -bottom-1.5 -right-1.5',
  }[size];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editable) {
      setToastMsg({ text: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi logo!', error: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng hợp lệ (.png, .jpg, .jpeg, .svg, .webp)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    const validExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExt)) {
      setToastMsg({ text: 'Chỉ chấp nhận file ảnh định dạng .png, .jpg, .svg!', error: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    // Giới hạn dung lượng tối đa 4MB
    if (file.size > 4 * 1024 * 1024) {
      setToastMsg({ text: 'Dung lượng ảnh tối đa là 4MB. Vui lòng chọn ảnh nhẹ hơn.', error: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    // Đọc file sang Base64 Data URL để preview ngay lập tức
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);

      if (onUploadLogo) {
        setUploading(true);
        try {
          const res = await onUploadLogo(dataUrl);
          if (res.success) {
            setToastMsg({ text: 'Đã lưu vĩnh viễn logo mới vào Google Sheets & Database!' });
          } else {
            setToastMsg({ text: res.message || 'Lỗi khi lưu logo.', error: true });
          }
        } catch (err: any) {
          setToastMsg({ text: 'Lỗi upload logo: ' + err.message, error: true });
        } finally {
          setUploading(false);
          setTimeout(() => setToastMsg(null), 3500);
        }
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`relative inline-block select-none group ${className}`}>
      {/* Hidden File Input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={handleFileChange}
          className="hidden"
          title="Chọn logo từ máy tính"
        />
      )}

      {/* Main Logo Container */}
      <div
        onClick={editable ? triggerUpload : undefined}
        title={editable ? 'Bấm vào để tải logo mới từ máy tính (.png, .jpg, .svg)' : 'Logo Lớp 4A3'}
        className={`relative overflow-hidden flex items-center justify-center shadow-md shadow-blue-500/20 transition-all ${sizeClasses} ${
          editable ? 'cursor-pointer hover:ring-3 hover:ring-blue-400 active:scale-95' : ''
        } ${
          displayUrl
            ? 'bg-white border border-slate-200'
            : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
        }`}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Logo Lớp 4A3"
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <GraduationCap className={iconSizes} />
        )}

        {/* Hover Camera Overlay */}
        {editable && (
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </div>
        )}
      </div>

      {/* Camera Badge Icon (Always visible so users immediately know it is clickable) */}
      {editable && (
        <button
          type="button"
          onClick={triggerUpload}
          title="Tải logo từ máy tính (.png, .jpg, .svg)"
          className={`absolute rounded-full bg-white text-blue-700 border-2 border-blue-500 shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer ${cameraBadgeSizes}`}
        >
          {uploading ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-600" />
          ) : (
            <Camera className="w-2.5 h-2.5" />
          )}
        </button>
      )}

      {/* Floating Mini Toast */}
      {toastMsg && (
        <div
          className={`absolute -top-10 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-black text-white shadow-xl flex items-center space-x-1.5 animate-in fade-in duration-150 ${
            toastMsg.error ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toastMsg.error ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
          <span>{toastMsg.text}</span>
        </div>
      )}
    </div>
  );
};
