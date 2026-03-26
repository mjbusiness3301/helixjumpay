import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompliance } from "@/contexts/ComplianceContext";
import { useNavigate } from "react-router-dom";

export function ComplianceBanner() {
  const { complianceAffiliate, setComplianceAffiliate } = useCompliance();
  const navigate = useNavigate();

  if (!complianceAffiliate) return null;

  const handleExit = () => {
    setComplianceAffiliate(null);
    navigate("/admin/afiliados");
  };

  return (
    <div className="fixed top-4 right-4 z-[100] bg-card border border-amber-500/40 rounded-lg shadow-lg shadow-amber-500/10 px-4 py-3 flex items-center gap-3 max-w-xs">
      <Shield className="h-4 w-4 text-amber-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-amber-500 uppercase tracking-wider">Compliance</p>
        <p className="text-xs text-muted-foreground truncate">{complianceAffiliate.name}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleExit}
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
