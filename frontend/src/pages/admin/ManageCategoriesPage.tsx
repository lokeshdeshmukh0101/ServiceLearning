import React, { useState, useEffect } from 'react';
import {
  Grid,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { api, type Category } from '../../services/api';
import { AdminNavTabs } from '../../components/navigation/AdminNavTabs';
import { useAudit } from '../../context/AuditContext';
import { useAuth } from '../../context/AuthContext';

export const ManageCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Add category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit category state
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete category confirmation modal state (IN-APP MODAL, NO window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { addLog } = useAudit();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadCategories();
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await api.createCategory(newCatName.trim(), newCatDesc.trim());
      setCategories((prev) => [...prev, created]);
      addLog({
        actor: currentUser?.name || 'Admin',
        actorRole: 'ADMIN',
        action: 'CREATE',
        target: created.name,
        detail: `Created new academic domain: ${created.name}`,
      });
      showToast(`Category "${created.name}" created and saved to database.`);
      setNewCatName('');
      setNewCatDesc('');
      setIsAdding(false);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editName.trim()) return;
    setIsUpdating(true);
    try {
      const updated = await api.updateCategory(editingCat.id, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? { ...c, ...updated } : c)));
      addLog({
        actor: currentUser?.name || 'Admin',
        actorRole: 'ADMIN',
        action: 'EDIT',
        target: updated.name,
        detail: `Updated category name/description for ${updated.name}`,
      });
      showToast(`Category "${updated.name}" updated successfully.`);
      setEditingCat(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update category');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      addLog({
        actor: currentUser?.name || 'Admin',
        actorRole: 'ADMIN',
        action: 'DELETE',
        target: deleteTarget.name,
        detail: `Deleted category: ${deleteTarget.name}`,
      });
      showToast(`Category "${deleteTarget.name}" deleted from database.`);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return cat.name.toLowerCase().includes(q) || (cat.description && cat.description.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Admin Tab Navigation Bar */}
      <AdminNavTabs />

      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-600 text-white rounded-xl shadow-md shadow-amber-500/20">
              <Grid className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manage Categories</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create, edit, and delete academic domains. All additions and deletions are immediately saved to the SQLite database.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Success Toast Banner */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-bold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-auto text-emerald-600 hover:text-emerald-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={loadCategories} className="ml-auto underline font-bold">Retry</button>
        </div>
      )}

      {/* Add Category Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Academic Category</h3>
                  <p className="text-xs text-slate-500">Define a new subject domain for learning materials.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Cybersecurity, Cloud Computing"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  autoFocus
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the topics and scope covered by this category..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Category</h3>
                  <p className="text-xs text-slate-500">Update name and description for {editingCat.name}.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCat(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated In-App Delete Confirmation Modal (NO window.confirm!) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-100 text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Delete Category</h3>
                  <p className="text-xs text-slate-500 font-medium">Permanent database deletion</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
                disabled={isDeleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
              <p className="text-xs font-bold text-rose-900">
                Are you sure you want to delete <span className="underline">"{deleteTarget.name}"</span>?
              </p>
              <p className="text-[11px] text-rose-700">
                This will permanently remove the category from the database. Existing documents with this tag will not be deleted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Yes, Delete Category</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold">
          {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
            <p className="text-xs text-slate-500 font-semibold">Loading categories from database…</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <FolderOpen className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700">No categories found</p>
            <p className="text-slate-400">Click "Add New Category" above to create an academic domain.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3.5">Category Name</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Linked Materials</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                        <Grid className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-extrabold">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 max-w-md font-medium leading-relaxed">
                    {cat.description || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 inline-flex items-center gap-1">
                      {cat.count ?? 0} {cat.count === 1 ? 'material' : 'materials'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => startEdit(cat)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all inline-flex items-center gap-1.5"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all inline-flex items-center gap-1.5"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
