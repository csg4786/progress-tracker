import React, { useEffect, useState } from 'react';
import axios from '../services/axios';
import FormModal from '../components/FormModal';
import { useModalStore } from '../stores/modalStore';

const DsaTracker: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { openModals, closeModal } = useModalStore();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/dsa');
      setItems(res.data.data || res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (formData: any) => {
    try {
      await axios.post('/dsa', {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
      });
      setSuccess('DSA problem added successfully!');
      setTimeout(() => setSuccess(null), 3000);
      fetchData();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create entry');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete(`/dsa/${id}`);
      setSuccess('Problem deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete entry');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.put(`/dsa/${id}`, { status: newStatus });
      setSuccess('Status updated!');
      setTimeout(() => setSuccess(null), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const formFields = [
    { name: 'name', label: 'Problem Name', type: 'text', required: true },
    { name: 'topic', label: 'Topic', type: 'text', required: false },
    { name: 'difficulty', label: 'Difficulty', type: 'select', required: false, options: [
      { label: 'Easy', value: 'Easy' },
      { label: 'Medium', value: 'Medium' },
      { label: 'Hard', value: 'Hard' },
    ]},
    { name: 'pattern', label: 'Pattern', type: 'text', required: false },
    { name: 'link', label: 'Link', type: 'text', required: false },
    { name: 'tags', label: 'Tags (comma-separated)', type: 'text', required: false },
    { name: 'notes', label: 'Notes', type: 'textarea', required: false },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">DSA Tracker</h2>

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">{success}</div>}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No problems yet. Create one with the + button!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((it) => (
            <div key={it._id} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-lg">{it.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {it.topic && <span>{it.topic} • </span>}
                    {it.difficulty && <span className="font-medium">{it.difficulty}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(it._id)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>

              {it.pattern && <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Pattern: {it.pattern}</div>}
              {it.link && (
                <div className="mb-2">
                  <a
                    href={it.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                  >
                    🔗 {it.link}
                  </a>
                </div>
              )}
              {it.notes && <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">{it.notes}</div>}
              {it.tags && it.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {it.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <select
                value={it.status || 'todo'}
                onChange={(e) => handleStatusChange(it._id, e.target.value)}
                className="w-full mt-2 p-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 text-sm"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          ))}
        </div>
      )}

      <FormModal
        open={openModals['create-dsa'] || false}
        onClose={() => closeModal('create-dsa')}
        title="Add DSA Problem"
        fields={formFields}
        onSubmit={handleCreate}
        loading={loading}
      />
    </div>
  );
};

export default DsaTracker;
