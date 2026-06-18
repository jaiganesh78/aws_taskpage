'use client';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-aws-gray-50">
      <div className="bg-ambient fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-[10%] w-[500px] h-[500px] rounded-full bg-aws-orange/5 blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[5%] w-[400px] h-[400px] rounded-full bg-aws-slate/[0.04] blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-aws-orange/[0.03] blur-[80px]" />
      </div>
      <div className="bg-grid-pattern fixed inset-0 pointer-events-none z-0 opacity-50" />
      <main className="flex-1 relative z-10 min-w-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
