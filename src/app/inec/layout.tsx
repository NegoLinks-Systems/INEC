// src/app/inec/layout.tsx
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function InecLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
