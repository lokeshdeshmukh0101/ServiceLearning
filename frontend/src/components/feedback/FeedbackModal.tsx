import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, AlertCircle, CheckCircle2, MessageSquare, Paperclip, Star } from 'lucide-react';
import { api, type FeedbackInput } from '../../services/api';
import { useTranslation } from 'react-i18next';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  relatedDocumentId?: string;
  relatedDocumentTitle?: string;
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
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(5);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
      relatedDocumentId,
    };

    try {
      await api.submitFeedback(payload, screenshot || undefined);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle('');
        setDescription('');
        setScreenshot(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit report. Please try again.');
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
        if (e.target === e.currentTarget) onClose();
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
                {t('feedback.title') || 'Report Issue / Feedback'}
              </h2>
              <p className="text-xs text-slate-400">
                {relatedDocumentTitle
                  ? `Regarding: ${relatedDocumentTitle}`
                  : 'Help us improve your learning experience'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close feedback modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-white">Feedback Submitted!</h3>
            <p className="text-xs text-slate-300">
              Thank you for helping us make educational materials better and more accurate.
            </p>
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
                onClick={onClose}
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
