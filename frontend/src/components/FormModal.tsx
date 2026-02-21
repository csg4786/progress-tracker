import React from 'react';
import Modal from './Modal';

interface FormField {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

const FormModal: React.FC<FormModalProps> = ({ open, onClose, title, fields, onSubmit, loading }) => {
  const [formData, setFormData] = React.useState<any>({});
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit(formData);
      setFormData({});
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <div className="p-2 bg-red-100 text-red-600 rounded">{error}</div>}
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-1">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                rows={3}
                required={field.required}
              />
            ) : field.type === 'select' ? (
              <select
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                required={field.required}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'number' ? (
              <input
                type="number"
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, Number(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                required={field.required}
              />
            ) : (
              <input
                type={field.type || 'text'}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                required={field.required}
              />
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-300 dark:bg-gray-700 p-2 rounded hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FormModal;
