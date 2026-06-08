'use client';

import { useEffect } from 'react';

type FunnelEvent =
  | 'viewed_tour'
  | 'started_planner'
  | 'generated_itinerary'
  | 'saved_itinerary'
  | 'submitted_enquiry'
  | 'completed_booking';

type FunnelTrackerProps = {
  event: FunnelEvent;
  meta?: Record<string, unknown>;
};

export function FunnelTracker({ event, meta }: FunnelTrackerProps) {
  useEffect(() => {
    const sessionId = (() => {
      const existing = sessionStorage.getItem('cv_session');
      if (existing) return existing;
      const id = crypto.randomUUID();
      sessionStorage.setItem('cv_session', id);
      return id;
    })();

    fetch('/api/funnel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        sessionId,
        path: window.location.pathname,
        meta,
      }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
