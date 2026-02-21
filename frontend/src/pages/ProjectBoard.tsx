import React, { useEffect, useState } from 'react';
import axios from '../services/axios';
import FormModal from '../components/FormModal';
import { useModalStore } from '../stores/modalStore';

const defaultColumns = ['Backlog', 'In Progress', 'Testing', 'Completed', 'Documented'];

const ProjectBoard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { openModals, closeModal } = useModalStore();
  const [showSectionManager, setShowSectionManager] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/tasks');
      setTasks(res.data.data || res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const res = await axios.get('/sections');
      const s = res.data.data || res.data;
      if (s && s.length > 0) setSections(s.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
      else setSections(defaultColumns.map((c, i) => ({ name: c, order: i })));
    } catch (err: any) {
      // fallback to defaults
      setSections(defaultColumns.map((c, i) => ({ name: c, order: i })));
    }
  };

  useEffect(() => {
    load();
    loadSections();
  }, []);

  const handleCreate = async (formData: any) => {
    try {
      await axios.post('/tasks', {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        area: formData.area,
        notes: formData.notes,
        column: sections?.[0]?.name || 'Backlog',
      });
      setSuccess('Task created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      load();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    try {
      await axios.post('/sections', { name: newSectionName });
      setNewSectionName('');
      setSuccess('Section created');
      setTimeout(() => setSuccess(null), 2000);
      loadSections();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create section');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Delete this section?')) return;
    try {
      await axios.delete(`/sections/${id}`);
      setSuccess('Section deleted');
      setTimeout(() => setSuccess(null), 2000);
      loadSections();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete section');
    }
  };

  const handleEditSection = async (id: string) => {
    setEditingSectionId(id);
    const section = sections.find(s => s._id === id);
    if (section) setEditingSectionName(section.name);
  };

  const handleSaveSection = async (id: string) => {
    if (!editingSectionName.trim()) return;
    try {
      await axios.put(`/sections/${id}`, { name: editingSectionName });
      setSuccess('Section updated');
      setTimeout(() => setSuccess(null), 2000);
      setEditingSectionId(null);
      setEditingSectionName('');
      loadSections();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update section');
    }
  };

  const handleDragStartSection = (e: React.DragEvent, sectionId: string | undefined) => {
    if (!sectionId) return;
    setDraggingSectionId(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('sectionId', sectionId);
    } catch (err) {
      // ignore
    }
  };

  const handleDragOverSection = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropSection = async (e: React.DragEvent, targetSectionId: string | undefined) => {
    e.preventDefault();
    if (!draggingSectionId || !targetSectionId || draggingSectionId === targetSectionId) {
      setDraggingSectionId(null);
      return;
    }

    const ids = sections.map(s => s._id);
    const fromIdx = ids.indexOf(draggingSectionId);
    const toIdx = ids.indexOf(targetSectionId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggingSectionId(null);
      return;
    }

    // Remove dragged section
    ids.splice(fromIdx, 1);
    // Insert before target
    ids.splice(toIdx, 0, draggingSectionId);
    setDraggingSectionId(null);

    // Optimistic update
    const newSections = ids.map(id => sections.find(s => s._id === id)!).filter(Boolean);
    setSections(newSections);

    try {
      await axios.post('/sections/reorder', { order: ids });
      setSuccess('Sections reordered');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reorder sections');
      loadSections(); // reload on error
    }
  };

  const handleEditTask = async (id: string, data: any) => {
    try {
      await axios.put(`/tasks/${id}`, data);
      setEditingTask(null);
      setSuccess('Task updated');
      setTimeout(() => setSuccess(null), 2000);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await axios.delete(`/tasks/${id}`);
      setSuccess('Task deleted!');
      setTimeout(() => setSuccess(null), 3000);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', id);
  };

  const onDrop = async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, column: targetColumn } : t))
    );

    try {
      await axios.put(`/tasks/${taskId}`, { column: targetColumn });
      setSuccess('Task moved!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to move task');
      load(); // Reload on error
    }
  };

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const byColumn = (col: string) => tasks.filter((t) => t.column === col);

  const handleColumnDrop = async (e: React.DragEvent, col: any) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      return onDrop(e, col.name || col);
    }

    const sectionId = e.dataTransfer.getData('sectionId') || draggingSectionId;
    if (sectionId && col._id) {
      return handleDropSection(e, col._id);
    }
  };

  const formFields = [
    { name: 'title', label: 'Task Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: false },
    { name: 'priority', label: 'Priority', type: 'select', required: false, options: [
      { label: 'Low', value: 'Low' },
      { label: 'Medium', value: 'Medium' },
      { label: 'High', value: 'High' },
    ]},
    { name: 'area', label: 'Area', type: 'text', required: false },
    { name: 'notes', label: 'Notes', type: 'textarea', required: false },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Project Board</h2>

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">{success}</div>}

      <div className="mb-4">
        <button
          onClick={() => setShowSectionManager(!showSectionManager)}
          className="px-3 py-1 bg-indigo-600 text-white rounded"
        >
          {showSectionManager ? 'Close Sections' : 'Manage Sections'}
        </button>
        {showSectionManager && (
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded space-y-3">
            <div className="flex gap-2">
              <input value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} placeholder="New section name" className="text-black flex-1 px-2 py-1 rounded border" />
              <button onClick={handleCreateSection} className="px-3 py-1 bg-green-500 text-white rounded">Create</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sections.map((s) => (
                <div key={s._id || s.name} className="p-2 border rounded">
                  {editingSectionId === s._id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingSectionName}
                        onChange={(e) => setEditingSectionName(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-black"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveSection(s._id)}
                        className="text-xs px-2 py-1 bg-green-500 text-white rounded"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingSectionId(null)}
                        className="text-xs px-2 py-1 bg-gray-400 text-white rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span>{s.name}</span>
                      <div className="flex gap-1">
                        {s._id && (
                          <>
                            <button onClick={() => handleEditSection(s._id)} className="text-xs px-2 py-1 bg-blue-500 text-white rounded">Edit</button>
                            <button onClick={() => handleDeleteSection(s._id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {(sections.length ? sections : defaultColumns).map((col: any) => (
          <div
            key={col._id || col.name || col}
            draggable={col._id ? true : false}
            onDragStart={(e) => col._id && handleDragStartSection(e, col._id)}
            onDragOver={handleDragOverSection}
            onDrop={(e) => handleColumnDrop(e, col)}
            className={`p-4 bg-gray-100 dark:bg-gray-800 rounded shadow min-h-[400px] ${col._id ? 'cursor-move' : ''}`}
          >
            <h3 className="font-semibold mb-4 text-lg">{col.name || col}</h3>
            <div className="space-y-3">
              {byColumn(col.name || col).map((t) => (
                <div
                  key={t._id}
                  draggable
                  onDragStart={(e) => onDragStart(e, t._id)}
                  className="p-3 bg-white dark:bg-gray-700 rounded cursor-move shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="font-medium flex-1">{t.title}</div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingTask(t)} className="text-xs px-2 py-1 bg-blue-500 text-white rounded">Edit</button>
                      <button
                        onClick={() => handleDelete(t._id)}
                        className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {t.priority && (
                    <div
                      className={`text-xs font-semibold mb-2 px-2 py-1 rounded w-fit ${
                        t.priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : t.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {t.priority}
                    </div>
                  )}
                  {t.description && <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t.description}</div>}
                  {t.area && <div className="text-xs text-gray-500 dark:text-gray-500">Area: {t.area}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <FormModal
        open={openModals['create-task'] || false}
        onClose={() => closeModal('create-task')}
        title="Create New Task"
        fields={formFields}
        onSubmit={handleCreate}
        loading={loading}
      />
      {editingTask && (
        <FormModal
          open={true}
          onClose={() => setEditingTask(null)}
          title="Edit Task"
          fields={formFields}
          onSubmit={(data: any) => handleEditTask(editingTask._id, data)}
          initialValues={editingTask}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ProjectBoard;
