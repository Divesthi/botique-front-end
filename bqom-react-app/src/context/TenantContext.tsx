import React, { createContext, useContext, useState, useCallback } from 'react';

interface TenantContextType {
  tenantCode: string;
  tenantName: string;
  setTenant: (code: string, name: string) => void;
  clearTenant: () => void;
}

const TENANT_CODE_KEY = 'bqom_tenant_code';
const TENANT_NAME_KEY = 'bqom_tenant_name';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantCode, setTenantCodeState] = useState<string>(
    () => localStorage.getItem(TENANT_CODE_KEY) || ''
  );
  const [tenantName, setTenantNameState] = useState<string>(
    () => localStorage.getItem(TENANT_NAME_KEY) || ''
  );

  const setTenant = useCallback((code: string, name: string) => {
    localStorage.setItem(TENANT_CODE_KEY, code);
    localStorage.setItem(TENANT_NAME_KEY, name);
    setTenantCodeState(code);
    setTenantNameState(name);
  }, []);

  const clearTenant = useCallback(() => {
    localStorage.removeItem(TENANT_CODE_KEY);
    localStorage.removeItem(TENANT_NAME_KEY);
    setTenantCodeState('');
    setTenantNameState('');
  }, []);

  return (
    <TenantContext.Provider value={{ tenantCode, tenantName, setTenant, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return ctx;
};

export default TenantContext;
