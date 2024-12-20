'use client';

import React from 'react';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

export function AnalyticsWrapper(): React.JSX.Element {
  return <VercelAnalytics />;
} 