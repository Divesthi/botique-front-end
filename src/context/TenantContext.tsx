import React, { createContext, useContext, useState, useCallback } from 'react';

interface TenantContextType {
  tenantCode: string;
  setTenantCode: (code: string) => void;
  clearTenant: () => void;
}

const TENANT_CODE_KEY = 'bqom_tenant_code';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantCode, setTenantCodeState] = useState<string>(
    () => localStorage.getItem(TENANT_CODE_KEY) || ''
  );

  const setTenantCode = useCallback((code: string) => {
    localStorage.setItem(TENANT_CODE_KEY, code);
    setTenantCodeState(code);
  }, []);

  const clearTenant = useCallback(() => {
    localStorage.removeItem(TENANT_CODE_KEY);
    setTenantCodeState('');
  }, []);

  return (
    <TenantContext.Provider value={{ tenantCode, setTenantCode, clearTenant }}>
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
