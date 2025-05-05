import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { SidebarIcon } from "lucide-react";

export function SiteHeader() {
    const { toggleSidebar } = useSidebar();
    return (
        <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
            <Button type="button" variant={'ghost'} onClick={toggleSidebar}>
                <SidebarIcon />
            </Button>
        </header>
    )
}
