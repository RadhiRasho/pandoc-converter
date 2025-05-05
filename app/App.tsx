"use client";

import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SidebarProvider>
        <AppSidebar variant='inset' />
        <div className='flex flex-1'>
          <SidebarInset>
            <SiteHeader />
            <div>
              hello there
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}