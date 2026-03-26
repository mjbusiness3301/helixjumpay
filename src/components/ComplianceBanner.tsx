import { Shield, ArrowLeft } from "lucide-react";
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
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium text-amber-500">
          Modo Compliance
        </span>
        <span className="text-sm text-amber-400/80">
          — Visualizando conta de <strong>{complianceAffiliate.name}</strong>
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExit}
        className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 gap-1.5"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao Admin
      </Button>
    </div>
  );
}
