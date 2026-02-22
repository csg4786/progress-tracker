import React, { useEffect, useState, useContext } from 'react';
import axios from '../services/axios';
import { useModalStore } from '../stores/modalStore';
import WorkspaceContext from '../contexts/WorkspaceContext';

interface TaskType {
  _id: string;
  name: string;
  color: string;
  customFields?: CustomField[];
}

interface CustomField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  label: string;
}

interface DailyTask {
  _id?: string;
  title: string;
  type: string;
  completed: boolean;
  assignee?: string | { _id: string; username: string };
  owner?: string | { _id: string; username: string }; // track who created the task
  customFields?: { [key: string]: any };
}

interface DailyEntry {
  _id: string;
  date: string;
  tasks: DailyTask[];
  score: number;
  workspace?: string;
}

const DailyTracker: React.FC = () => {
  const { workspaceId, role } = useContext(WorkspaceContext);
  const canEdit = !workspaceId || (role && (role === 'owner' || role === 'editor'));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyData, setDailyData] = useState<DailyEntry | null>(null);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#6366F1');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingCustomFields, setEditingCustomFields] = useState<{ [key: string]: any }>({});
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const fetchTaskTypes = async () => {
    try {
      const res = await axios.get('/task-types', { params: workspaceId ? { workspaceId } : {} });
      setTaskTypes(res.data.data || []);
      if (res.data.data?.length > 0 && !newTaskType) {
        setNewTaskType(res.data.data[0].name);
      }
    } catch (err: any) {
      console.error('Failed to load task types');
    }
  };

  const fetchWorkspaceMembers = async () => {
    if (!workspaceId) return;
    try {
      const res = await axios.get(`/workspaces/${workspaceId}/members`);
      const owner = res.data.owner ? [res.data.owner] : [];
      const members = (res.data.members || []).map((m: any) => m.user);
      setWorkspaceMembers([...owner, ...members]);
    } catch (err: any) {
      console.error('Failed to load workspace members');
    }
  };

  const fetchDailyData = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const dateStr = `${y}-${pad(m)}-${pad(d)}`;
      
      const params: any = { date: dateStr };
      if (workspaceId) params.workspaceId = workspaceId;
      const res = await axios.get('/daily', { params });
      
      // For workspace view, fetch all daily entries for this date and merge tasks with owner info
      if (workspaceId && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        // Merge all tasks from all workspace members and attach owner info
        const allTasks: DailyTask[] = [];
        res.data.data.forEach((daily: any) => {
          const ownerUsername = workspaceMembers.find(m => m._id === daily.user)?.username || 'Unknown';
          (daily.tasks || []).forEach((task: any) => {
            const assigneeUsername = task.assignee && workspaceMembers.find(m => m._id === task.assignee)?.username;
            allTasks.push({
              ...task,
              owner: { _id: daily.user, username: ownerUsername },
              assignee: assigneeUsername ? { _id: task.assignee, username: assigneeUsername } : task.assignee
            });
          });
        });
        const merged = {
          _id: res.data.data[0]._id,
          date: dateStr,
          workspace: workspaceId,
          tasks: allTasks,
          score: 0
        };
        setDailyData(merged);
      } else {
        let daily = res.data.data?.[0];
        if (!daily) {
          const body: any = { date: dateStr, tasks: [] };
          if (workspaceId) body.workspace = workspaceId;
          const createRes = await axios.post('/daily', body, { params: workspaceId ? { workspaceId } : {} });
          daily = createRes.data;
        }
        setDailyData(daily);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load daily data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskTypes();
    fetchWorkspaceMembers();
  }, [workspaceId]);

  useEffect(() => {
    fetchDailyData(selectedDate);
  }, [selectedDate]);

  const handleCreateTaskType = async () => {
    if (!newTypeName.trim()) return;
    try {
      const body: any = { name: newTypeName, color: newTypeColor };
      if (workspaceId) body.workspace = workspaceId;
      await axios.post('/task-types', body);
      setSuccess('Task type created!');
      setTimeout(() => setSuccess(null), 2000);
      setNewTypeName('');
      setNewTypeColor('#6366F1');
      fetchTaskTypes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task type');
    }
  };

  const handleDeleteTaskType = async (id: string) => {
    if (!confirm('Delete this task type?')) return;
    try {
      await axios.delete(`/task-types/${id}`);
      setSuccess('Task type deleted!');
      setTimeout(() => setSuccess(null), 2000);
      fetchTaskTypes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task type');
    }
  };

  const handleAddCustomField = async (typeId: string) => {
    const fieldName = prompt('Field name (e.g., duration, link, notes):');
    if (!fieldName) return;
    const fieldType = prompt('Field type (text, number, boolean, date):');
    if (!fieldType) return;

    try {
      await axios.post(`/task-types/${typeId}/fields`, {
        name: fieldName,
        type: fieldType || 'text',
        label: fieldName
      });
      setSuccess('Custom field added!');
      setTimeout(() => setSuccess(null), 2000);
      fetchTaskTypes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add custom field');
    }
  };

  const handleRemoveCustomField = async (typeId: string, fieldName: string) => {
    try {
      await axios.delete(`/task-types/${typeId}/fields`, { data: { fieldName } });
      setSuccess('Custom field removed!');
      setTimeout(() => setSuccess(null), 2000);
      fetchTaskTypes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove custom field');
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !dailyData) return;
    try {
      const body: any = { title: newTaskTitle, type: newTaskType, customFields: {} };
      const res = await axios.post(`/daily/${dailyData._id}/tasks`, body, { params: workspaceId ? { workspaceId } : {} });
      // For workspace view, re-fetch all dailies to preserve assignees from other members' tasks
      if (workspaceId) {
        await fetchDailyData(selectedDate);
      } else {
        setDailyData(res.data);
      }
      setNewTaskTitle('');
      setSuccess('Task added!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('handleAddTask error', err.response || err);
      setError(err.response?.data?.message || JSON.stringify(err.response?.data) || 'Failed to add task');
    }
  };

  const handleToggleTask = async (taskId: string | undefined) => {
    if (!taskId || !dailyData) return;
    try {
      const res = await axios.patch(`/daily/${dailyData._id}/tasks/${taskId}/toggle`, {}, { params: workspaceId ? { workspaceId } : {} });
      setDailyData(res.data);
    } catch (err: any) {
      console.error('handleToggleTask error', err.response || err);
      setError(err.response?.data?.message || JSON.stringify(err.response?.data) || 'Failed to toggle task');
    }
  };

  const handleUpdateCustomField = async (taskId: string | undefined) => {
    if (!taskId || !dailyData) return;
    try {
      const res = await axios.put(`/daily/${dailyData._id}/tasks/${taskId}`, { customFields: editingCustomFields }, { params: workspaceId ? { workspaceId } : {} });
      setDailyData(res.data);
      setEditingTaskId(null);
      setEditingCustomFields({});
      setSuccess('Task updated!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('handleUpdateCustomField error', err.response || err);
      setError(err.response?.data?.message || JSON.stringify(err.response?.data) || 'Failed to update task');
    }
  };

  const handleCopyToToday = async (taskId: string | undefined) => {
    if (!taskId || !dailyData) return;
    try {
      const res = await axios.post(`/daily/${dailyData._id}/tasks/${taskId}/copy-to-today`, {}, { params: workspaceId ? { workspaceId } : {} });
      setSuccess('Task copied to today!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('handleCopyToToday error', err.response || err);
      const msg = err.response?.data?.message || JSON.stringify(err.response?.data) || 'Failed to copy task';
      setError(msg);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteTask = async (taskId: string | undefined) => {
    if (!taskId || !dailyData) return;
    if (!confirm('Delete this task?')) return;
    try {
      const res = await axios.delete(`/daily/${dailyData._id}/tasks/${taskId}`, { params: workspaceId ? { workspaceId } : {} });
      setDailyData(res.data);
      setSuccess('Task deleted!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('handleDeleteTask error', err.response || err);
      setError(err.response?.data?.message || JSON.stringify(err.response?.data) || 'Failed to delete task');
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string | undefined) => {
    if (!taskId) return;
    setDraggingTaskId(taskId);
    try {
      e.dataTransfer.setData('text/plain', taskId);
      e.dataTransfer.effectAllowed = 'move';
    } catch (err) {
      // ignore
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const performReorder = async (newOrderIds: string[]) => {
    if (!dailyData) return;
    // optimistic update
    const tasksById: any = {};
    dailyData.tasks.forEach((t) => { tasksById[t._id!] = t; });
    const newTasks = newOrderIds.map((id) => tasksById[id]).filter(Boolean);
    setDailyData({ ...dailyData, tasks: newTasks });
    try {
      await axios.post(`/daily/${dailyData._id}/tasks/reorder`, { order: newOrderIds }, { params: workspaceId ? { workspaceId } : {} });
    } catch (err: any) {
      console.error('performReorder error', err);
      // on failure, refresh from server
      fetchDailyData(selectedDate);
    }
  };

  const handleDropOnTask = (e: React.DragEvent, targetTaskId: string | undefined) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    setDraggingTaskId(null);
    if (!draggedId || !dailyData) return;
    if (!targetTaskId || draggedId === targetTaskId) return;

    const ids = dailyData.tasks.map((t) => t._id!);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx = ids.indexOf(targetTaskId);
    if (fromIdx === -1 || toIdx === -1) return;

    // remove dragged
    ids.splice(fromIdx, 1);
    // insert before target index
    ids.splice(toIdx, 0, draggedId);
    performReorder(ids as string[]);
  };

  const handleDropOnList = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    setDraggingTaskId(null);
    if (!draggedId || !dailyData) return;
    const ids = dailyData.tasks.map((t) => t._id!);
    const fromIdx = ids.indexOf(draggedId);
    if (fromIdx === -1) return;
    // move to end
    ids.splice(fromIdx, 1);
    ids.push(draggedId);
    performReorder(ids as string[]);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getTaskCountByType = (type: string) => {
    return dailyData?.tasks?.filter((t) => t.type === type).length || 0;
  };

  const getCompletionPercentage = () => {
    if (!dailyData?.tasks || dailyData.tasks.length === 0) return 0;
    const completed = dailyData.tasks.filter((t) => t.completed).length;
    return Math.round((completed / dailyData.tasks.length) * 100);
  };

  const getTaskTypeColor = (typeName: string) => {
    return taskTypes.find((t) => t.name === typeName)?.color || '#6366F1';
  };

  const getTaskTypeCustomFields = (typeName: string) => {
    return taskTypes.find((t) => t.name === typeName)?.customFields || [];
  };

  const today = new Date();
  const todayLocalStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedLocalStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const isSelectedDatePast = selectedLocalStart.getTime() < todayLocalStart.getTime();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = getDaysInMonth(selectedDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Daily Tracker</h2>

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">{success}</div>}

      {/* Top Section: Calendar + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Calendar */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              ←
            </button>
            <h3 className="font-semibold">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              →
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const date = day ? new Date(currentYear, currentMonth, day) : null;
              const isSelected =
                date &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();
              const isToday =
                date &&
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
              const isFuture = date ? date > today : false;

              return (
                <button
                  key={idx}
                  onClick={() => date && setSelectedDate(date)}
                  disabled={!date || isFuture}
                  className={`p-2 text-sm font-medium rounded transition-colors ${
                    !date
                      ? ''
                      : isSelected
                      ? 'bg-indigo-600 text-white'
                      : isToday
                      ? 'bg-blue-500 text-white'
                      : isFuture
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
            <h3 className="font-semibold mb-4">Tasks by Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {taskTypes.map((type) => (
                <div
                  key={type._id}
                  className="p-3 rounded"
                  style={{ backgroundColor: type.color + '15', borderLeft: `4px solid ${type.color}` }}
                >
                  <div className="text-xs text-gray-600 dark:text-gray-400">{type.name}</div>
                  <div className="text-2xl font-bold" style={{ color: type.color }}>
                    {getTaskCountByType(type.name)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
            <h3 className="font-semibold mb-2">Completion Score</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-300 dark:text-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${(getCompletionPercentage() / 100) * 283} 283`}
                    className="text-green-500 transition-all"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{getCompletionPercentage()}%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {dailyData?.tasks?.filter((t) => t.completed).length || 0}/{dailyData?.tasks?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Type Manager */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded shadow">
        {canEdit && (
          <button
            onClick={() => setShowTypeManager(!showTypeManager)}
            className="font-semibold text-lg mb-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {showTypeManager ? '✕ Close' : '+ Manage Task Types'}
          </button>
        )}

        {showTypeManager && (
          <div className="space-y-4 border-t pt-4">
            {/* Create New Type */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h3 className="font-semibold mb-3">Create New Task Type</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Type name (e.g., Research, Bug Fix)..."
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600"
                />
                <input
                  type="color"
                  value={newTypeColor}
                  onChange={(e) => setNewTypeColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <button
                  onClick={handleCreateTaskType}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </div>

            {/* Existing Types */}
            <div className="space-y-3">
              <h3 className="font-semibold">Existing Task Types</h3>
              {taskTypes.map((type) => (
                <div
                  key={type._id}
                  className="p-4 border rounded"
                  style={{ borderLeftWidth: '4px', borderLeftColor: type.color }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: type.color }}
                      />
                      <div>
                        <h4 className="font-semibold">{type.name}</h4>
                        <div className="text-xs text-gray-500">
                          {type.customFields?.length || 0} custom fields
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTaskType(type._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Custom Fields */}
                  <div className="mt-3 pl-10">
                    {type.customFields && type.customFields.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Custom Fields:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {type.customFields.map((field) => (
                            <div
                              key={field.name}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs flex items-center gap-1"
                            >
                              {field.label} ({field.type})
                              <button
                                onClick={() => handleRemoveCustomField(type._id, field.name)}
                                className="ml-1 text-red-500 hover:font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleAddCustomField(type._id)}
                      className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200"
                    >
                      + Add Field
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <h3 className="font-semibold text-lg mb-4">
          Tasks for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </h3>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Add Task Input */}
            {canEdit && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600"
                />
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600"
                >
                  {taskTypes.map((type) => (
                    <option key={type._id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
              </div>
            )}

            {/* Tasks List */}
            {(!dailyData?.tasks || dailyData.tasks.length === 0) ? (
              <div className="text-center py-8 text-gray-500">No tasks yet. Add one above!</div>
            ) : (
              <div className="space-y-2" onDragOver={handleDragOver} onDrop={handleDropOnList}>
                {dailyData.tasks.map((task) => {
                  const customFields = getTaskTypeCustomFields(task.type);
                  const isEditing = editingTaskId === task._id;

                  return (
                    <div
                      key={task._id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnTask(e, task._id)}
                      className={`p-3 rounded transition-opacity ${
                        task.completed ? 'bg-gray-100 dark:bg-gray-700 opacity-70' : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                      style={{ borderLeft: `4px solid ${getTaskTypeColor(task.type)}` }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => canEdit ? handleToggleTask(task._id) : undefined}
                          className={`w-5 h-5 ${canEdit ? '' : 'opacity-50 cursor-not-allowed'}`}
                          disabled={!canEdit}
                        />
                        <div className="flex-1">
                          <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </div>
                          {workspaceId && task.owner && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Owner: {typeof task.owner === 'object' ? task.owner.username : task.owner}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className="text-xs px-2 py-1 rounded w-fit"
                              style={{ backgroundColor: getTaskTypeColor(task.type) + '30', color: getTaskTypeColor(task.type) }}
                            >
                              {task.type}
                            </div>
                            {/* Assignee display/selector */}
                            {workspaceId && (
                              <div className="text-xs">
                                {canEdit ? (
                                  <select
                                    value={(task.assignee && typeof task.assignee === 'object' ? task.assignee._id : task.assignee) || ''}
                                    onChange={async (e) => {
                                      try {
                                        const updatedTask = { ...task, assignee: e.target.value || undefined };
                                        await axios.put(`/daily/${dailyData!._id}/tasks/${task._id}`, { assignee: e.target.value || undefined }, { params: { workspaceId } });
                                        const updated = dailyData!.tasks.map(t => t._id === task._id ? updatedTask : t);
                                        setDailyData({ ...dailyData!, tasks: updated });
                                      } catch (err: any) {
                                        setError('Failed to update assignee');
                                      }
                                    }}
                                    className="px-2 py-0 border border-gray-300 rounded text-black"
                                  >
                                    <option value="">Unassigned</option>
                                    {workspaceMembers.map((m) => (
                                      <option key={m._id} value={m._id}>{m.username}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Assigned: {(task.assignee && typeof task.assignee === 'object' ? task.assignee.username : 'Unknown') || 'Unassigned'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {customFields.length > 0 && canEdit && (
                            <button
                              onClick={() => {
                                setEditingTaskId(isEditing ? null : (task._id || ''));
                                if (!isEditing) {
                                  setEditingCustomFields(task.customFields || {});
                                }
                              }}
                              className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                            >
                              {isEditing ? '✓' : '✎'}
                            </button>
                          )}
                          {isSelectedDatePast && canEdit && (
                            <button
                              onClick={() => handleCopyToToday(task._id)}
                              className="px-2 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                            >
                              ↪
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteTask(task._id)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Custom Fields */}
                      {customFields.length > 0 && (
                        <div className="ml-8 space-y-2 mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                          {isEditing ? (
                            <>
                              {customFields.map((field) => (
                                <div key={field.name}>
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {field.label}
                                  </label>
                                  {field.type === 'text' && (
                                    <input
                                      type="text"
                                      value={editingCustomFields[field.name] || ''}
                                      onChange={(e) =>
                                        setEditingCustomFields({
                                          ...editingCustomFields,
                                          [field.name]: e.target.value
                                        })
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600"
                                    />
                                  )}
                                  {field.type === 'number' && (
                                    <input
                                      type="number"
                                      value={editingCustomFields[field.name] || ''}
                                      onChange={(e) =>
                                        setEditingCustomFields({
                                          ...editingCustomFields,
                                          [field.name]: Number(e.target.value)
                                        })
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600"
                                    />
                                  )}
                                  {field.type === 'date' && (
                                    <input
                                      type="date"
                                      value={editingCustomFields[field.name] || ''}
                                      onChange={(e) =>
                                        setEditingCustomFields({
                                          ...editingCustomFields,
                                          [field.name]: e.target.value
                                        })
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600"
                                    />
                                  )}
                                  {field.type === 'boolean' && (
                                    <input
                                      type="checkbox"
                                      checked={editingCustomFields[field.name] || false}
                                      onChange={(e) =>
                                        setEditingCustomFields({
                                          ...editingCustomFields,
                                          [field.name]: e.target.checked
                                        })
                                      }
                                      className="w-4 h-4"
                                    />
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() => handleUpdateCustomField(task._id)}
                                className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                Save
                              </button>
                            </>
                          ) : (
                            <div className="text-xs space-y-1">
                              {customFields.map((field) => (
                                <div key={field.name} className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">{field.label}:</span>
                                  <span className="font-medium">
                                    {field.type === 'boolean'
                                      ? task.customFields?.[field.name]
                                        ? '✓'
                                        : '✗'
                                      : task.customFields?.[field.name] || '—'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DailyTracker;
