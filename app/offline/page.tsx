'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16a34a] to-[#15803d] flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">You&apos;re Offline</h1>
        <p className="text-[#94a3b8] text-sm mb-6">
          Your last known data is shown below. Connect to the internet to get the latest updates.
        </p>
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] text-left space-y-3">
          <div>
            <p className="text-xs text-[#94a3b8]">Cached Wallet Balance</p>
            <p className="text-lg font-bold text-white">Check when online</p>
          </div>
          <div>
            <p className="text-xs text-[#94a3b8]">Bachat Status</p>
            <p className="text-sm text-[#16a34a] font-medium">Last known: ACTIVE ✅</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-[#16a34a] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#15803d] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
