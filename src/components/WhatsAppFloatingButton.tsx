import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MessageCircle } from "lucide-react";

export function WhatsAppFloatingButton() {
  const { data: link } = useQuery({
    queryKey: ["settings", "whatsapp_group_link"],
    queryFn: async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "whatsapp_group_link")
        .maybeSingle();
      return data?.value || "";
    },
  });

  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform duration-200 hover:shadow-xl"
      aria-label="Grupo WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
