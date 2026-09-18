import React, { useState } from 'react';
import { Grid, Plus, Trash2, Edit, Check } from 'lucide-react';

export const ManageCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState([
    { id: '1', name: 'Programming', desc: 'Python, C++, Java & syntax guides', count: 12 },
    { id: '2', name: 'Artificial Intelligence', desc: 'AI foundations & neural networks', count: 8 },
    { id: '3', name: 'Machine Learning', desc: 'Algorithms & predictive modeling', count: 15 },
    { id: '4', name: 'Excel', desc: 'Data analysis & formulas', count: 6 },
    { id: '5', name: 'Web Development', desc: 'HTML, CSS, React & full-stack development', count: 14 },
    { id: '6', name: 'Computer Networks', desc: 'Protocols, TCP/IP & network architecture', count: 9 },
    { id: '7', name: 'Data Structures', desc: 'Arrays, Trees, Graphs & Algorithms', count: 11 },
    { id: '8', name: 'Prompt Engineering', desc: 'LLM techniques & instruction design', count: 5 },
  ]);

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCategories((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newCatName.trim(),
        desc: newCatDesc.trim() || 'Custom academic domain category.',
        count: 0,
      },
    ]);
    setNewCatName('');
    setNewCatDesc('');
    setIsAdding(false);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Manage Categories</h1>
          <p className="text-xs text-slate-500">Organize and define academic domains for learning materials.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Category
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddCategory} className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-3">
          <h3 className="text-sm font-semibold text-navy-800">Add Academic Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Category Name (e.g. Cybersecurity)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <input
              type="text"
              placeholder="Description"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              className="text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1 font-semibold"
            >
              <Check className="w-3.5 h-3.5" /> Save Category
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">Category Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Materials Count</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                  <Grid className="w-4 h-4 text-tealAcc" />
                  <span>{cat.name}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{cat.desc}</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                    {cat.count} files
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
