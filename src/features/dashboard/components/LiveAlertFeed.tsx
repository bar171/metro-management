import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { SeverityBadge } from '@/components/shared/StatusIndicators';
import type { LogEntry } from '@/types';

interface LiveAlertFeedProps {
  logs: LogEntry[];
}

const EASTER_EGG_CLICK_THRESHOLD = 3;

/**
 * Critical / warning log stream + the "Emanuel, step behind the yellow line"
 * easter egg triggered by 3 clicks on the feed title.
 */
export function LiveAlertFeed({ logs }: LiveAlertFeedProps) {
  const [alertClickCount, setAlertClickCount] = useState(0);

  const handleTitleClick = () => {
    setAlertClickCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= EASTER_EGG_CLICK_THRESHOLD) {
        toast.custom(
          () => (
            <div className="alert-feed__easter-egg">
              <div className="alert-feed__easter-egg-icon">⚠️</div>
              <div className="flex flex-col gap-1">
                <span className="alert-feed__easter-egg-title">
                  Station Announcement
                </span>
                <span className="alert-feed__easter-egg-text">
                  Emanuel, please step behind the yellow line! 🚇
                </span>
              </div>
            </div>
          ),
          { duration: 6000, position: 'top-center' },
        );
        return 0;
      }
      return newCount;
    });
  };

  return (
    <div className="alert-feed">
      <div className="alert-feed__header">
        <span
          className="alert-feed__title"
          onClick={handleTitleClick}
        >
          Live Alert Feed
        </span>
        <span className="alert-feed__pulse" />
      </div>
      <div className="alert-feed__list">
        {logs.map((log, i) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="alert-feed__item"
          >
            <SeverityBadge severity={log.severity} />
            <span className="alert-feed__message">{log.message}</span>
            <span className="alert-feed__time">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
