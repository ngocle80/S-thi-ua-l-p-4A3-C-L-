import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Check,
  X,
  RefreshCw,
  Move,
  Camera,
  Sparkles,
} from 'lucide-react';
import { Student } from '../types';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  student: Student | null;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => Promise<void> | void;
}

const VIEWPORT_SIZE = 300; // kích thước vùng xem trước tương tác
const CROP_BOX_SIZE = 260; // khung cắt ảnh đại diện (hình vuông bo góc)
const OUTPUT_SIZE = 400;   // kích thước ảnh xuất ra sắc nét (400x400 px)

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  student,
  onClose,
  onSave,
}) => {
  const [zoom, setZoom] = useState<number>(1.2); // mặc định phóng nhẹ 1.2x để rõ mặt
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      // Khởi tạo zoom và căn giữa
      setZoom(1.2);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Vẽ canvas tương tác chính
  const drawMainCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    // Tính tỷ lệ cơ bản để ảnh lấp đầy khung crop
    const isRotatedSideways = rotation % 180 !== 0;
    const effectiveW = isRotatedSideways ? img.naturalHeight : img.naturalWidth;
    const effectiveH = isRotatedSideways ? img.naturalWidth : img.naturalHeight;

    const baseScale = Math.max(CROP_BOX_SIZE / effectiveW, CROP_BOX_SIZE / effectiveH);
    const totalScale = baseScale * zoom;

    ctx.save();
    // Chuyển gốc tọa độ về tâm khung
    ctx.translate(VIEWPORT_SIZE / 2 + offset.x, VIEWPORT_SIZE / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(totalScale, totalScale);

    // Vẽ ảnh ở tâm
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Vẽ lớp phủ làm tối bên ngoài vùng cắt CROP_BOX_SIZE
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)'; // slate-900 / 65%

    const cropX = (VIEWPORT_SIZE - CROP_BOX_SIZE) / 2;
    const cropY = (VIEWPORT_SIZE - CROP_BOX_SIZE) / 2;

    ctx.beginPath();
    ctx.rect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
    // Cắt lỗ trong suốt tròn / vuông bo góc
    ctx.roundRect(cropX, cropY, CROP_BOX_SIZE, CROP_BOX_SIZE, 28);
    ctx.fill('evenodd');

    // Viền khung cắt
    ctx.strokeStyle = '#38bdf8'; // sky-400
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Hướng dẫn căn khuôn mặt (vòng tròn mờ hỗ trợ căn chỉnh)
    ctx.beginPath();
    ctx.ellipse(
      VIEWPORT_SIZE / 2,
      VIEWPORT_SIZE / 2 - 5,
      CROP_BOX_SIZE * 0.32,
      CROP_BOX_SIZE * 0.40,
      0,
      0,
      2 * Math.PI
    );
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    ctx.restore();
  }, [zoom, rotation, offset]);

  // Tạo ảnh preview nhỏ ở bên cạnh
  const generatePreview = useCallback(() => {
    const img = imageObjRef.current;
    if (!img) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = OUTPUT_SIZE;
    offscreen.height = OUTPUT_SIZE;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    const isRotatedSideways = rotation % 180 !== 0;
    const effectiveW = isRotatedSideways ? img.naturalHeight : img.naturalWidth;
    const effectiveH = isRotatedSideways ? img.naturalWidth : img.naturalHeight;

    const baseScale = Math.max(CROP_BOX_SIZE / effectiveW, CROP_BOX_SIZE / effectiveH);
    const totalScale = baseScale * zoom;
    const factor = OUTPUT_SIZE / CROP_BOX_SIZE;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();
    ctx.translate(OUTPUT_SIZE / 2 + offset.x * factor, OUTPUT_SIZE / 2 + offset.y * factor);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(totalScale * factor, totalScale * factor);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    setPreviewDataUrl(offscreen.toDataURL('image/jpeg', 0.92));
  }, [zoom, rotation, offset]);

  // Vẽ lại khi state thay đổi
  useEffect(() => {
    drawMainCanvas();
    generatePreview();
  }, [drawMainCanvas, generatePreview]);

  // Xử lý kéo thả bằng chuột
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Xử lý kéo thả trên màn hình cảm ứng
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Phóng to / thu nhỏ bằng lăn chuột
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(Math.max(1.0, parseFloat((prev + delta).toFixed(2))), 4.0));
  };

  // Nút xoay 90 độ
  const handleRotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);

  // Đặt lại mặc định
  const handleReset = () => {
    setZoom(1.2);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Lưu ảnh đã cắt
  const handleSaveCropped = async () => {
    if (!previewDataUrl) return;
    setIsSaving(true);
    try {
      await onSave(previewDataUrl);
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu ảnh avatar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <Camera className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">
                Chỉnh Sửa Kích Thước & Căn Rõ Mặt
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                {student ? `${student.FullName} (${student.StudentCode})` : 'Ảnh đại diện học sinh'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Hướng dẫn thao tác */}
          <div className="flex items-center justify-between text-xs bg-sky-50 text-sky-900 px-3 py-2 rounded-xl border border-sky-200/70">
            <div className="flex items-center space-x-2">
              <Move className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                <strong>Nhấn giữ & kéo</strong> ảnh để căn giữa mặt • Dùng thanh trượt phóng to
              </span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer shrink-0"
              title="Đặt lại vị trí và tỷ lệ ban đầu"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Đặt lại</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            {/* Vùng Canvas kéo thả tương tác */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 shadow-md bg-slate-900 cursor-grab active:cursor-grabbing select-none shrink-0">
              <canvas
                ref={canvasRef}
                width={VIEWPORT_SIZE}
                height={VIEWPORT_SIZE}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                className="block"
              />
              <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
                <span className="text-[10px] font-bold text-white/80 bg-slate-950/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  {rotation !== 0 && `Xoay ${rotation}° • `}
                  Phóng to {zoom.toFixed(1)}x
                </span>
              </div>
            </div>

            {/* Cột Xem trước thực tế (Live Preview) */}
            <div className="flex flex-col items-center sm:items-start space-y-3 w-full sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Xem Trước Thực Tế
              </span>

              <div className="flex sm:flex-col items-center gap-4">
                {/* Preview 1: Dạng thẻ học sinh (80x80) */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-lg bg-slate-100 mx-auto">
                    {previewDataUrl && (
                      <img
                        src={previewDataUrl}
                        alt="Preview thẻ học sinh"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                    Thẻ học sinh
                  </span>
                </div>

                {/* Preview 2: Dạng tròn chấm điểm & xếp hạng (48x48) */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-100 mx-auto">
                    {previewDataUrl && (
                      <img
                        src={previewDataUrl}
                        alt="Preview chấm điểm"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                    Bảng thi đua
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thanh điều khiển Zoom */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <ZoomIn className="w-4 h-4 text-blue-600" />
                <span>Mức độ phóng to mặt học sinh:</span>
                <span className="text-blue-700 font-extrabold">{zoom.toFixed(1)}x</span>
              </label>

              {/* Các mức phóng to nhanh */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setZoom(1.0)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${zoom === 1.0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                >
                  1.0x
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1.5)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${zoom === 1.5 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                >
                  1.5x (Rõ)
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(2.2)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${zoom === 2.2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                >
                  2.2x (Cận cảnh)
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1.0, parseFloat((z - 0.1).toFixed(2))))}
                className="w-8 h-8 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer shadow-2xs"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4.0, parseFloat((z + 0.1).toFixed(2))))}
                className="w-8 h-8 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer shadow-2xs"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Công cụ Xoay hình ảnh (hữu ích khi chụp bằng điện thoại bị xoay ngang) */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-bold text-slate-700">Xoay ảnh chiều ngang / dọc:</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleRotateLeft}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center space-x-1 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Xoay trái 90°</span>
              </button>
              <button
                type="button"
                onClick={handleRotateRight}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center space-x-1 cursor-pointer shadow-2xs"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Xoay phải 90°</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveCropped}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 flex items-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang lưu ảnh...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Lưu Ảnh Đại Diện</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
