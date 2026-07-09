import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function SuperAdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-64 bg-surface-hover rounded mb-2"></div>
        <div className="h-4 w-96 bg-surface-hover rounded"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-2xl p-4 md:p-6 shadow-sm flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-hover shrink-0"></div>
            <div className="flex flex-col min-w-0 w-full gap-2">
              <div className="h-4 w-24 bg-surface-hover rounded"></div>
              <div className="h-8 w-16 bg-surface-hover rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Info Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="h-6 w-32 bg-surface-hover rounded"></div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div 
                  key={i}
                  className="flex gap-3 p-2 rounded-xl bg-surface-hover items-center border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-40 bg-border rounded mb-2"></div>
                    <div className="h-3 w-56 bg-border rounded"></div>
                  </div>
                  <div className="text-right">
                    <div className="w-8 h-8 rounded-lg bg-border"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
