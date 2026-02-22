import React from 'react';

export interface WorkspaceContextValue {
  workspaceId?: string | null;
  role?: 'owner' | 'editor' | 'viewer' | null;
  setContext?: (id?: string | null, role?: WorkspaceContextValue['role']) => void;
}

export const WorkspaceContext = React.createContext<WorkspaceContextValue>({ workspaceId: null, role: null });

export const WorkspaceProvider: React.FC<any> = ({ children, initialId, initialRole }) => {
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(initialId || null);
  const [role, setRole] = React.useState<WorkspaceContextValue['role']>(initialRole || null);

  const setContext = (id?: string | null, r?: WorkspaceContextValue['role']) => {
    setWorkspaceId(id || null);
    setRole(r || null);
  };

  // update internal state when parent changes initial props
  React.useEffect(() => {
    setWorkspaceId(initialId || null);
  }, [initialId]);

  React.useEffect(() => {
    setRole(initialRole || null);
  }, [initialRole]);

  return (
    <WorkspaceContext.Provider value={{ workspaceId, role, setContext }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export default WorkspaceContext;
