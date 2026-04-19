"use client";

import RouteErrorFallback from "@/components/ui/RouteErrorFallback";

export default function OperationDetailError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteErrorFallback
      error={error}
      unstable_retry={unstable_retry}
      route="Operation Detail"
    />
  );
}
