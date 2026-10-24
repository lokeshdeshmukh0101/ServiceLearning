import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, AlertCircle, CheckCircle2, MessageSquare, Paperclip, Star, Check } from 'lucide-react';
import { api, type FeedbackInput } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  relatedDocumentId?: string;
  relatedDocumentTitle?: string;
  documentId?: string;
  documentTitle?: string;
  onSuccess?: (report: any) => void;
}

const CATEGORIES = [
  'AI Summary/Quiz Issue',
  'Translation Issue',
  'Accessibility Issue',
  'Broken File',
  'Incorrect Content',
  'Feature Request',
  'Other',
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  relatedDocumentId,
  relatedDocumentTitle,
  documentId,
  documentTitle,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();

  const effectiveDocId = relatedDocumentId || documentId;
  const effectiveDocTitle = relatedDocumentTitle || documentTitle;

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(5);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setSubmittedReport(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSubmitted(false);
    setSubmittedReport(null);
    setTitle('');
    setDescription('');
    setScreenshot(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide both a title and description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: FeedbackInput = {
      title: title.trim(),
      description: description.trim(),
      category,
      rating,
      relatedDocumentId: effectiveDocId,
    };

    try {
      const response = await api.submitFeedback(payload, screenshot || undefined);
      const report = response?.report;
      setSubmittedReport(report);
      setSubmitted(true);

      // Trigger global notification message
      const successMsg = response?.message || t('feedback.success') || 'Issue reported successfully!';
      showSuccess(successMsg, 'Issue Reported');

      if (onSuccess && report) {
        onSuccess(report);
      }

      // Auto close after 4 seconds
      setTimeout(() => {
        handleClose();
      }, 4000);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || t('feedback.error') || 'Failed to submit report. Please try again.';
      setError(errMsg);
      showError(errMsg, 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-lg w-full p-6 text-slate-100 relative overflow-hidden z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 id="feedback-modal-title" className="text-lg font-bold text-white">
                {t('feedback.title') || 'Report an Issue'}
              </h2>
              <p className="text-xs text-slate-400">
                {effectiveDocTitle
                  ? `Regarding: ${effectiveDocTitle}`
                  : 'Help us improve your learning experience'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close feedback modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 px-2 text-center space-y-4 animate-fade-in">
            {/* Animated Success Icon */}
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-75" />
              <div className="relative p-3.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-full shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Issue Reported Successfully</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">Thank You for Your Report!</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your report has been received and logged into our system. Our administrators will review the issue and work on resolving it.
              </p>
            </div>

            {/* Reported Details Summary Box */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-700/60">
                <span>Category</span>
                <span className="font-semibold text-slate-200 bg-slate-700/60 px-2 py-0.5 rounded-md">
                  {category}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-700/60">
                <span>Summary</span>
                <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                  {title}
                </span>
              </div>
              {submittedReport?.id && (
                <div className="flex items-center justify-between text-slate-400">
                  <span>Report ID</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    #{submittedReport.id.slice(0, 8)}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Done</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Category */}
            <div>
              <label htmlFor="feedback-category" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Issue Category
              </label>
              <select
                id="feedback-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="feedback-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Summary Title
              </label>
              <input
                id="feedback-title"
                type="text"
                placeholder="e.g., Inaccurate quiz explanation in Marathi translation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="feedback-desc" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Details & Specific Notes
              </label>
              <textarea
                id="feedback-desc"
                rows={3}
                placeholder="Describe what went wrong, which question or page was affected, or what you suggest..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                required
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Content Quality Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Screenshot attachment */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Attach Screenshot (optional)
              </label>
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-700 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 cursor-pointer transition-colors">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <span className="truncate">
                  {screenshot ? screenshot.name : 'Choose image (PNG, JPG, WebP)...'}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setScreenshot(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {submitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
