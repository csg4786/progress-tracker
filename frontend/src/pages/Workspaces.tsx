import React, { useEffect, useState } from 'react';
import axios from '../services/axios';
import FormModal from '../components/FormModal';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Workspaces: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [shareOpenFor, setShareOpenFor] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const auth = useAuthStore();

  const navigate = useNavigate();

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/workspaces');
      setWorkspaces(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async (data: any) => {
    await axios.post('/workspaces', data);
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete workspace? This cannot be undone')) return;
    await axios.delete(`/workspaces/${id}`);
    fetch();
  };

  const handleSearch = async (q: string) => {
    setSearchQ(q);
    if (!q) return setSearchResults([]);
    const res = await axios.get('/users/search', { params: { q } });
    setSearchResults(res.data.data || []);
  };

  const [modalMembers, setModalMembers] = useState<any[]>([]);
  const [membersCollapsed, setMembersCollapsed] = useState(false);

  useEffect(() => {
    if (!shareOpenFor) return;
    const loadMembers = async () => {
      try {
        const res = await axios.get(`/workspaces/${shareOpenFor}/members`);
        // owner in res.data.owner, members in res.data.members
        const owner = res.data.owner;
        const members = res.data.members || [];
        setModalMembers([{ user: owner, role: 'owner' }, ...members]);
      } catch (err) {
        console.error('Failed to load members', err);
      }
    };
    loadMembers();
  }, [shareOpenFor]);

  const handleShare = async (workspaceId: string, targetUserId: string, role: string) => {
    await axios.post(`/workspaces/${workspaceId}/share`, { userId: targetUserId, role });
    setShareOpenFor(null);
    fetch();
  };

  const your = workspaces.filter(w => (w.owner && (w.owner._id ? w.owner._id === auth.user?.id || w.owner._id === auth.user?._id : w.owner === auth.user?.id || w.owner === auth.user?._id)));
  const shared = workspaces.filter(w => !your.includes(w));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Workspaces</h2>
        <button onClick={() => setCreateOpen(true)} className="bg-indigo-600 text-white px-3 py-1 rounded">New Workspace</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Your Workspaces</h3>
          {loading ? <div>Loading...</div> : (
            your.length ? your.map(w => (
              <div key={w._id} className="p-3 border-b last:border-b-0 flex justify-between items-center">
                <div>
                  <div className="font-semibold cursor-pointer text-indigo-600" onClick={() => navigate(`/workspaces/${w._id}`)}>{w.name}</div>
                  <div className="text-xs text-gray-500">{w.description}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShareOpenFor(w._id)} className="text-sm px-2 py-1 bg-blue-600 text-white rounded">Share</button>
                  <button onClick={() => handleDelete(w._id)} className="text-sm px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
              </div>
            )) : <div className="text-gray-500">No workspaces yet</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Shared Workspaces</h3>
          {loading ? <div>Loading...</div> : (
            shared.length ? shared.map(w => (
              <div key={w._id} className="p-3 border-b last:border-b-0 flex justify-between items-center">
                <div>
                  <div className="font-semibold cursor-pointer text-indigo-600" onClick={() => navigate(`/workspaces/${w._id}`)}>{w.name}</div>
                  <div className="text-xs text-gray-500">Owned by: {w.owner && (w.owner.username || w.owner)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShareOpenFor(w._id)} className="text-sm px-2 py-1 bg-blue-600 text-white rounded">Members</button>
                </div>
              </div>
            )) : <div className="text-gray-500">No shared workspaces</div>
          )}
        </div>
      </div>

      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Workspace"
        fields={[{ name: 'name', label: 'Name', required: true }, { name: 'description', label: 'Description', type: 'textarea' }]}
        onSubmit={handleCreate}
      />

      {shareOpenFor && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 p-4 rounded w-96">
            <h4 className="font-semibold mb-2">Share Workspace</h4>
            <input
              value={searchQ}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search username"
              className="w-full p-2 border rounded mb-2"
            />
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Members ({modalMembers.length})</div>
                <button onClick={() => setMembersCollapsed((s) => !s)} className="text-sm px-2 py-1 bg-blue-400 text-white rounded">{membersCollapsed ? 'Expand' : 'Collapse'}</button>
              </div>
              <div className={`max-h-48 overflow-auto mb-2 transition-all ${membersCollapsed ? 'max-h-0' : 'max-h-48'}`}>
                {modalMembers.map((m: any) => (
                  <div key={m.user._id || m.user} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <div className="font-medium">{m.user?.username || m.user}</div>
                      <div className="text-xs text-gray-500">{m.role}</div>
                    </div>
                    <div className="flex gap-2">
                      {/* Owner cannot be changed here */}
                      {m.role !== 'owner' && (
                        <button onClick={async () => { await handleShare(shareOpenFor!, m.user._id || m.user, 'remove'); const res = await axios.get(`/workspaces/${shareOpenFor}/members`); setModalMembers([{ user: res.data.owner, role: 'owner' }, ...(res.data.members || [])]); }} className="text-xs px-2 py-1 bg-red-500 text-white rounded">Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Only owners can add new shares */}
              {modalMembers.find((m: any) => m.user?._id === auth.user?.id)?.role === 'owner' && (
                <>
                  <input
                    value={searchQ}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search username"
                    className="w-full p-2 border rounded mb-2"
                  />
                  <div className="max-h-48 overflow-auto mb-2">
                    {searchResults.map((u) => (
                      <div key={u._id} className="flex justify-between items-center p-2 border-b">
                        <div>{u.username}</div>
                        <div className="flex gap-1">
                          <button onClick={() => handleShare(shareOpenFor!, u._id, 'viewer')} className="px-2 py-1 bg-blue-500 text-white rounded">Viewer</button>
                          <button onClick={() => handleShare(shareOpenFor!, u._id, 'editor')} className="px-2 py-1 bg-blue-700 text-white rounded">Editor</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                <button onClick={() => setShareOpenFor(null)} className="px-3 py-1 bg-blue-400 text-white rounded">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspaces;
