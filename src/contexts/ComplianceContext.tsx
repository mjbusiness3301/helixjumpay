import { createContext, useContext, useState, ReactNode } from "react";
import type { Affiliate } from "@/types/database";

interface ComplianceContextType {
  complianceAffiliate: Affiliate | null;
  setComplianceAffiliate: (affiliate: Affiliate | null) => void;
  isComplianceMode: boolean;
}

const ComplianceContext = createContext<ComplianceContextType>({
  complianceAffiliate: null,
  setComplianceAffiliate: () => {},
  isComplianceMode: false,
});

export function ComplianceProvider({ children }: { children: ReactNode }) {
  const [complianceAffiliate, setComplianceAffiliate] = useState<Affiliate | null>(null);

  return (
    <ComplianceContext.Provider
      value={{
        complianceAffiliate,
        setComplianceAffiliate,
        isComplianceMode: !!complianceAffiliate,
      }}
    >
      {children}
    </ComplianceContext.Provider>
  );
}

export const useCompliance = () => useContext(ComplianceContext);
