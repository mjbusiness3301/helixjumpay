import { SidebarProvider } from "@/components/ui/sidebar";
import { AffiliateSidebar } from "@/components/AffiliateSidebar";
import { ComplianceBanner } from "@/components/ComplianceBanner";

export function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AffiliateSidebar />
        <main className="flex-1 min-w-0">{children}</main>
        <ComplianceBanner />
      </div>
    </SidebarProvider>
  );
}
