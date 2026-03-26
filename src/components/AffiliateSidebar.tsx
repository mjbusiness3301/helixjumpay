import {
  LayoutDashboard,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompliance } from "@/contexts/ComplianceContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const affiliateMenuItems = [
  { title: "Dashboard", url: "/painel", icon: LayoutDashboard },
  { title: "Configurações", url: "/painel/configuracoes", icon: Settings },
];

const complianceMenuItems = [
  { title: "Dashboard", url: "/admin/compliance", icon: LayoutDashboard },
  { title: "Configurações", url: "/admin/compliance/configuracoes", icon: Settings },
];

export function AffiliateSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border [--sidebar-width-icon:4rem]">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:px-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <img src={logo} alt="Logo" className="h-12 w-12 flex-none rounded-lg object-contain" />
          {!collapsed && (
            <span className="text-lg font-bold text-foreground tracking-tight">HelixPay</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url} tooltip={item.title}>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-1">
        <Button variant="ghost" size="sm" onClick={toggleSidebar} className="w-full justify-start text-muted-foreground hover:text-foreground">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Recolher</span>}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
