import { SidebarProvider } from "@/components/ui/sidebar";
import { AffiliateSidebar } from "@/components/AffiliateSidebar";
import { ComplianceBanner } from "@/components/ComplianceBanner";

export function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <ComplianceBanner />
      <div className="flex flex-1">
        <SidebarProvider>
          <AffiliateSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </SidebarProvider>
      </div>
    </div>
  );
}
