export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5 py-5 md:gap-8 md:py-8 w-full max-w-7xl mx-auto px-4 md:px-0">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-5 w-16 bg-slate-200/70 rounded"></div>
        <div className="h-8 w-48 bg-slate-300/70 rounded mt-1"></div>
        <div className="h-4 w-72 bg-slate-200/50 rounded mt-2 hidden md:block"></div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="billia-card overflow-hidden p-4 md:p-6 animate-pulse">
        {/* Toolbar skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col gap-2">
            <div className="h-5 w-32 bg-slate-200/70 rounded"></div>
            <div className="h-4 w-56 bg-slate-100 rounded hidden md:block"></div>
          </div>
          <div className="h-10 w-28 bg-slate-200/70 rounded-lg"></div>
        </div>
        
        {/* Table skeleton with centered spinner */}
        <div className="space-y-3 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 text-slate-300">
            <svg className="animate-spin w-8 h-8 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="h-12 bg-slate-100 rounded-lg w-full"></div>
          <div className="h-14 bg-slate-50 border border-slate-100 rounded-lg w-full"></div>
          <div className="h-14 bg-slate-50 border border-slate-100 rounded-lg w-full"></div>
          <div className="h-14 bg-slate-50 border border-slate-100 rounded-lg w-full"></div>
          <div className="h-14 bg-slate-50 border border-slate-100 rounded-lg w-full"></div>
          <div className="h-14 bg-slate-50 border border-slate-100 rounded-lg w-full"></div>
        </div>
      </div>
    </div>
  );
}
