import React, { useState } from 'react';
import { Cloud, CheckCircle, ExternalLink, Loader2, X, UploadCloud, FolderCheck } from 'lucide-react';
import { googleSignIn, uploadSiteToGoogleDrive } from '../services/driveService';
import confetti from 'canvas-confetti';

interface DriveUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriveUploadModal: React.FC<DriveUploadModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'authorizing' | 'uploading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [driveLink, setDriveLink] = useState<string>('');

  if (!isOpen) return null;

  const handleStartUpload = async () => {
    try {
      setStatus('authorizing');
      setStatusMessage('جاري تسجيل الدخول بحساب Google...');
      const authResult = await googleSignIn();

      if (!authResult?.accessToken) {
        throw new Error('لم يتم استلام تصريح الدخول');
      }

      setStatus('uploading');
      setStatusMessage('جاري تجهيز ورفع ملفات الموقع إلى Google Drive...');

      const result = await uploadSiteToGoogleDrive(authResult.accessToken, (msg) => {
        setStatusMessage(msg);
      });

      setDriveLink(result.webViewLink);
      setStatus('success');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setStatusMessage(err.message || 'حدث خطأ أثناء الرفع إلى Google Drive');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-lg bg-[#0e0e1a] border border-red-500/30 rounded-3xl p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Cloud className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              رفع ملفات الموقع إلى Google Drive
            </h3>
            <p className="text-xs text-zinc-400">
              احصل على رابط مباشر لتحميل ملفات موقعك من درايف ومشاركتها في أي وقت
            </p>
          </div>
        </div>

        {status === 'idle' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-sm text-zinc-300">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <FolderCheck size={18} />
                <span>ماذا سيتم رفعه إلى حسابك على Google Drive؟</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400 pr-2">
                <li>ملف مضغوط <b>sultan-site-files.zip</b> يحتوي على كامل ملفات الموقع.</li>
                <li>ملف <b>index.html</b> جاهز للفتح الفوري.</li>
                <li>تنسيقات CSS، مشغل الأغاني، وصورة الأفاتار الملكية.</li>
              </ul>
            </div>

            <p className="text-xs text-zinc-400 text-center">
              بالضغط على الزر بالأسفل ستسجل دخولك بحساب Google وسيتم إنشاء الملفات في درايف الخاص بك بأمان.
            </p>

            <button
              onClick={handleStartUpload}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:opacity-95 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-[0.98]"
            >
              <UploadCloud size={20} />
              <span>تسجيل الدخول ورفع الملفات الآن 🚀</span>
            </button>
          </div>
        )}

        {(status === 'authorizing' || status === 'uploading') && (
          <div className="py-8 text-center space-y-4">
            <Loader2 size={42} className="animate-spin text-red-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">{statusMessage}</p>
              <p className="text-xs text-zinc-400">يرجى الانتظار ثوانٍ معدودة...</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle size={36} />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">تم الرفع بنجاح إلى Google Drive! 🎉</h4>
              <p className="text-xs text-zinc-400">
                تم حفظ ملف سلطان المضغوط <span className="text-amber-300 font-mono">sultan-site-files.zip</span> في حسابك.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <span>فتح الملف في Google Drive ↗</span>
                <ExternalLink size={16} />
              </a>

              <button
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-zinc-300 font-bold transition-all"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 text-center space-y-4">
            <div className="p-3 bg-red-500/20 text-red-300 rounded-xl text-xs border border-red-500/30">
              {statusMessage}
            </div>
            <button
              onClick={handleStartUpload}
              className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
