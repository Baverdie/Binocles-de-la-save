export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-48 bg-brown/10 rounded-lg" />
        <div className="h-4 w-64 bg-brown/5 rounded-lg mt-2" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-beige/70 border border-brown/10 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-brown/5" />
            <div>
              <div className="h-7 w-12 bg-brown/10 rounded-lg" />
              <div className="h-3 w-24 bg-brown/5 rounded mt-1.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-beige/70 border border-brown/10 rounded-2xl p-6"
          >
            <div className="h-5 w-40 bg-brown/10 rounded-lg mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between py-3 border-b border-brown/5 last:border-0"
                >
                  <div>
                    <div className="h-4 w-28 bg-brown/10 rounded" />
                    <div className="h-3 w-40 bg-brown/5 rounded mt-1.5" />
                  </div>
                  <div className="h-3 w-12 bg-brown/5 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
