// src/app/inec/war-room/layout.tsx
// Override: War Room is fullscreen — skip the DashboardLayout wrapper
export default function WarRoomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
