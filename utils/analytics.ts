'use client';

import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

export function AnalyticsWrapper() {
  return <VercelAnalytics />;
} 