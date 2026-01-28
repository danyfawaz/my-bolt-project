# Notification Platform - Implementation Plan

**Generated:** 2026-01-28
**Project:** Grower Platform Notification System
**Status:** Phase 1 Complete, Ready for Phase 2

---

## Executive Summary

This document provides a comprehensive implementation plan for both Backend (BE) and Frontend (FE) teams to continue development on the notification platform. The foundation is complete with core notification CRUD, real-time delivery via Pusher, user preferences management, and a polished UI. This plan outlines what's been built, what needs to be completed, and critical issues to address.

---

## Table of Contents

1. [Current System Architecture](#current-system-architecture)
2. [What's Been Built](#whats-been-built)
3. [Critical Issues to Address](#critical-issues-to-address)
4. [Remaining Work](#remaining-work)
5. [Backend Team Tasks](#backend-team-tasks)
6. [Frontend Team Tasks](#frontend-team-tasks)
7. [Database Schema Reference](#database-schema-reference)
8. [API Reference](#api-reference)
9. [Environment Setup](#environment-setup)
10. [Testing Strategy](#testing-strategy)

---

## Current System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GROWER PLATFORM                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────────┐  │
│  │  React App  │◄───│   Pusher    │◄───│      Backend Worker Service     │  │
│  │  (Vite/TS)  │    │  Channels   │    │         (Node.js/TS)            │  │
│  └──────┬──────┘    └─────────────┘    └───────────────┬─────────────────┘  │
│         │                                              │                     │
│         │ REST/Realtime                                │ Process & Store     │
│         ▼                                              ▼                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         SUPABASE (PostgreSQL)                            ││
│  │  ┌─────────────┐  ┌──────────────────────┐  ┌─────────────────────────┐ ││
│  │  │notifications│  │notification_preferences│  │notification_deliveries│ ││
│  │  └─────────────┘  └──────────────────────┘  └─────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                              ▲                               │
│                                              │ Consume Events                │
│  ┌────────────────────────────────────────┐  │                              │
│  │              RabbitMQ                   │──┘                              │
│  │  (notification.events exchange)        │                                  │
│  └────────────────────────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript + Vite | UI Application |
| Styling | Tailwind CSS | Responsive, dark-mode UI |
| Real-time (Client) | Pusher-JS + Supabase Realtime | Live notification updates |
| Backend Worker | Node.js + Express + TypeScript | Notification processing |
| Message Queue | RabbitMQ | Async event processing |
| Database | Supabase (PostgreSQL) | Data persistence |
| Real-time (Server) | Pusher SDK | Server-side broadcasting |
| Auth | Supabase Auth | User authentication |

---

## What's Been Built

### Completed Features (Phase 1)

| Feature | Status | Files |
|---------|--------|-------|
| **Core Notification CRUD** | ✅ Complete | `src/services/NotificationService.ts` |
| **Notification States** | ✅ Complete | unread, read, actioned, archived, expired |
| **9 Event Types** | ✅ Complete | TASK_*, DELIVERABLE_*, COMMENT_*, REACTION_* |
| **User Preferences Management** | ✅ Complete | `src/services/NotificationPreferencesService.ts` |
| **Per-Event Channel Control** | ✅ Complete | in_app, email, push per event type |
| **Quiet Hours** | ✅ Complete | Time-based suppression with timezone |
| **Sound Settings** | ✅ Complete | Enable/disable + volume control |
| **Floating Notification Panel** | ✅ Complete | `src/components/NotificationPanel.tsx` |
| **Notification Bell with Badge** | ✅ Complete | Unread count, animations |
| **Time-grouped Notifications** | ✅ Complete | Today, Yesterday, This Week, Earlier |
| **Dark Mode Support** | ✅ Complete | Full theme support |
| **Pusher Real-time** | ✅ Complete | Private channels per user |
| **Supabase Realtime Backup** | ✅ Complete | PostgreSQL change subscriptions |
| **Backend Worker Service** | ✅ Complete | `server/` directory |
| **RabbitMQ Consumer** | ✅ Complete | Message queue processing |
| **HTTP API Endpoint** | ✅ Complete | `/api/v1/notifications` |
| **Batch Processing** | ✅ Complete | Up to 100 notifications per batch |
| **Delivery Tracking** | ✅ Complete | `notification_deliveries` table |
| **Demo Mode** | ✅ Complete | `?demo=true` for testing |
| **Settings UI** | ✅ Complete | `/settings/notifications` page |

### Database Migrations Applied

1. `20260126124737_notifications.sql` - Core notifications table
2. `20260126130000_notifications_sty001.sql` - Extended with metadata
3. `20260128000000_notification_preferences.sql` - Preferences + RLS

---

## Critical Issues to Address

### IMMEDIATE (Block deployment)

| Priority | Issue | Owner | Action |
|----------|-------|-------|--------|
| 🔴 P0 | **Secrets in .env committed to git** | DevOps | Remove from history, rotate all credentials |
| 🔴 P0 | **Service role key exposed to frontend** | BE | Remove VITE_SUPABASE_SERVICE_ROLE_KEY from frontend |
| 🔴 P0 | **Weak RLS INSERT policy** | BE | Restrict notification INSERT to service_role only |
| 🔴 P0 | **Test user ID hardcoded** | FE | Remove `?test=true` mode, use real auth only |
| 🟠 P1 | **npm audit vulnerabilities (14)** | Both | Run `npm audit fix`, update react-router-dom |

### SHORT-TERM (Before production)

| Priority | Issue | Owner | Action |
|----------|-------|-------|--------|
| 🟠 P1 | CORS wildcard in Pusher auth | BE | Implement origin allowlist |
| 🟠 P1 | No rate limiting on API | BE | Add express-rate-limit middleware |
| 🟡 P2 | Missing Error Boundary | FE | Add React Error Boundary component |
| 🟡 P2 | localStorage for sensitive data | FE | Switch to sessionStorage for demo mode |
| 🟡 P2 | No CSP headers | BE/DevOps | Add Content-Security-Policy |

---

## Remaining Work

### Backend - Incomplete Items

```typescript
// server/src/services/NotificationProcessor.ts - Lines 250-274
// TODO: Implement actual email sending via SendGrid/SES/SMTP
// TODO: Implement web push or mobile push
```

### Frontend - Incomplete Items

```typescript
// src/hooks/useNotificationPreferences.ts - Line 57
// TODO: Replace with actual auth hook when available
const userId = null; // Currently hardcoded
```

---

## Backend Team Tasks

### BE-001: Fix Security Issues (P0)

**Files to modify:**
- `supabase/migrations/` - New migration for RLS fix
- `server/.env` - Remove from git, use secrets manager
- `.env` - Remove from git history

**Actions:**
1. Create new migration to fix RLS:
```sql
-- Fix notification INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "Only service role can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Add validation trigger
CREATE OR REPLACE FUNCTION validate_notification_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.recipient_id) THEN
    RAISE EXCEPTION 'Invalid recipient_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_notification_insert
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION validate_notification_insert();
```

2. Remove secrets from git:
```bash
git rm --cached .env server/.env
echo ".env" >> .gitignore
echo "server/.env" >> .gitignore
```

---

### BE-002: Implement Email Delivery (P1)

**File:** `server/src/services/NotificationProcessor.ts`

**Current state:** Lines 240-259 log instead of sending

**Implementation:**
```typescript
// Add to server/src/services/EmailService.ts (new file)
import { Resend } from 'resend'; // or SendGrid, SES

export class EmailService {
  private client: Resend;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
  }

  async sendNotificationEmail(
    to: string,
    subject: string,
    notification: Notification
  ): Promise<boolean> {
    try {
      await this.client.emails.send({
        from: 'notifications@growerplatform.com',
        to,
        subject,
        html: this.renderEmailTemplate(notification),
      });
      return true;
    } catch (error) {
      logger.error('Email send failed', { error, to });
      return false;
    }
  }

  private renderEmailTemplate(notification: Notification): string {
    // Use template based on event_type
    return `...`;
  }
}
```

**Dependencies to add:**
```bash
cd server && npm install resend
# or: npm install @sendgrid/mail
```

---

### BE-003: Implement Push Notifications (P2)

**File:** `server/src/services/NotificationProcessor.ts`

**Options:**
1. **Web Push** (web-push library)
2. **Firebase Cloud Messaging** (mobile + web)
3. **OneSignal** (managed service)

**Recommended: Web Push for MVP**

```typescript
// server/src/services/PushService.ts (new file)
import webpush from 'web-push';

export class PushService {
  constructor() {
    webpush.setVapidDetails(
      'mailto:admin@growerplatform.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  }

  async sendPush(
    subscription: PushSubscription,
    notification: Notification
  ): Promise<boolean> {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: this.getTitle(notification),
          body: this.getBody(notification),
          icon: '/notification-icon.png',
          data: { url: this.getActionUrl(notification) },
        })
      );
      return true;
    } catch (error) {
      logger.error('Push send failed', { error });
      return false;
    }
  }
}
```

**Frontend requirements:**
- Service worker registration
- Push subscription management
- VAPID key generation

---

### BE-004: Add Rate Limiting (P1)

**File:** `server/src/api.ts`

```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Rate limit exceeded' },
});

// Apply to routes
app.post('/api/v1/notifications', strictLimiter, authenticate, ...);
app.post('/api/v1/notifications/batch', apiLimiter, authenticate, ...);
```

---

### BE-005: Fix CORS Configuration (P1)

**File:** `server/src/api.ts` and `supabase/functions/pusher-auth/index.ts`

```typescript
// server/src/api.ts
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS?.split(',') || [];

if (process.env.NODE_ENV === 'production' && ALLOWED_ORIGINS.length === 0) {
  throw new Error('CORS_ORIGINS must be configured in production');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

### BE-006: Add Input Validation (P2)

**File:** `server/src/services/NotificationProcessor.ts`

```typescript
import { z } from 'zod';

const NotificationEventSchema = z.object({
  event_type: z.enum([
    'TASK_ASSIGNED', 'TASK_OVERDUE', 'TASK_COMPLETED',
    'SUBMISSION_DUE', 'DELIVERABLE_SUBMITTED',
    'DELIVERABLE_APPROVED', 'DELIVERABLE_REJECTED',
    'COMMENT_ADDED', 'REACTION_ADDED'
  ]),
  recipient_id: z.string().uuid(),
  actor_id: z.string().uuid().optional(),
  resource_ref: z.string().max(255).optional(),
  metadata: z.record(z.unknown()).refine(
    (m) => JSON.stringify(m).length <= 10000,
    { message: 'Metadata too large (max 10KB)' }
  ),
  priority: z.enum(['normal', 'high']).default('normal'),
});

// Use in processor
private validateEvent(event: unknown): NotificationEvent {
  return NotificationEventSchema.parse(event);
}
```

---

## Frontend Team Tasks

### FE-001: Remove Test Mode & Integrate Auth (P0)

**Files to modify:**
- `src/hooks/useNotifications.ts`
- `src/hooks/useNotificationPreferences.ts`

**Current problem:**
```typescript
// src/hooks/useNotifications.ts - Line 7
const TEST_USER_ID = 'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03';
```

**Fix:**
```typescript
// src/hooks/useNotifications.ts
import { useAuth } from './useAuth'; // Your auth hook

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();

  // Remove demo/test mode logic
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch notifications for authenticated user only
    fetchNotifications(userId);
  }, [userId]);

  // ... rest of hook
}
```

```typescript
// src/hooks/useNotificationPreferences.ts - Line 57
// Replace:
const userId = null; // TODO

// With:
import { useAuth } from './useAuth';
const { user } = useAuth();
const userId = user?.id ?? null;
```

---

### FE-002: Add Error Boundary (P1)

**New file:** `src/components/ErrorBoundary.tsx`

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Usage in `src/App.tsx`:**
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <WebSocketProvider>
        {/* rest of app */}
      </WebSocketProvider>
    </ErrorBoundary>
  );
}
```

---

### FE-003: Optimize NotificationItem Performance (P2)

**File:** `src/components/NotificationItem.tsx`

```typescript
import { memo, useCallback } from 'react';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkAsRead,
  onArchive,
  onClick,
}: NotificationItemProps) {
  // Memoize handlers
  const handleMarkAsRead = useCallback(() => {
    onMarkAsRead(notification.id);
  }, [notification.id, onMarkAsRead]);

  const handleArchive = useCallback(() => {
    onArchive(notification.id);
  }, [notification.id, onArchive]);

  // ... rest of component
});
```

---

### FE-004: Add Push Notification Subscription (P2)

**New file:** `src/hooks/usePushSubscription.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function usePushSubscription(userId: string | null) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  const subscribe = useCallback(async () => {
    if (!userId || !isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      });

      // Store subscription in database
      await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          subscription: subscription.toJSON(),
        });

      setIsSubscribed(true);
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }, [userId, isSupported]);

  const unsubscribe = useCallback(async () => {
    // Implementation
  }, [userId]);

  return { isSubscribed, isSupported, subscribe, unsubscribe };
}
```

---

### FE-005: Fix localStorage Security (P2)

**File:** `src/services/NotificationPreferencesService.ts`

```typescript
// Replace localStorage with sessionStorage for demo mode
// and ensure data is cleared on logout

const STORAGE_KEY = 'notification_preferences_demo';

static getFromStorage(): NotificationPreferences {
  try {
    // Use sessionStorage (cleared on browser close)
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error reading preferences:', error);
  }
  return { ...DEFAULT_PREFERENCES };
}

static saveToStorage(preferences: NotificationPreferences): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

static clearStorage(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY); // Clear old data
}
```

---

### FE-006: Extract Shared Constants (P3)

**New file:** `src/lib/notificationConfig.ts`

```typescript
import {
  Bell, CheckCircle, Clock, AlertTriangle,
  FileCheck, FileX, MessageSquare, Heart
} from 'lucide-react';

export const EVENT_CONFIG = {
  TASK_ASSIGNED: {
    icon: Bell,
    label: 'Task Assigned',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    category: 'task_management',
  },
  TASK_OVERDUE: {
    icon: AlertTriangle,
    label: 'Task Overdue',
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    category: 'task_management',
  },
  TASK_COMPLETED: {
    icon: CheckCircle,
    label: 'Task Completed',
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    category: 'task_management',
  },
  // ... rest of events
} as const;

export type NotificationEventType = keyof typeof EVENT_CONFIG;

export const CATEGORIES = {
  task_management: {
    label: 'Task Management',
    events: ['TASK_ASSIGNED', 'TASK_OVERDUE', 'TASK_COMPLETED'],
  },
  deliverable_workflow: {
    label: 'Deliverable Workflow',
    events: ['SUBMISSION_DUE', 'DELIVERABLE_SUBMITTED', 'DELIVERABLE_APPROVED', 'DELIVERABLE_REJECTED'],
  },
  collaboration: {
    label: 'Collaboration',
    events: ['COMMENT_ADDED', 'REACTION_ADDED'],
  },
} as const;
```

---

## Database Schema Reference

### notifications

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| recipient_id | UUID | User receiving notification (FK → auth.users) |
| actor_id | UUID | User who triggered action (nullable) |
| event_type | TEXT | One of 9 event types |
| state | TEXT | unread, read, actioned, archived, expired |
| resource_ref | TEXT | Reference like "task:123" |
| metadata | JSONB | Event-specific data |
| priority | TEXT | normal or high |
| correlation_id | TEXT | For distributed tracing |
| expires_at | TIMESTAMPTZ | Auto-expiry (nullable) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### notification_preferences

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Unique, FK → auth.users |
| channels_enabled | JSONB | `{in_app, email, push}` booleans |
| event_preferences | JSONB | Per-event channel settings |
| category_enabled | JSONB | Per-category toggles |
| quiet_hours_enabled | BOOLEAN | Enable quiet hours |
| quiet_hours_start | TIME | Start time (e.g., "22:00") |
| quiet_hours_end | TIME | End time (e.g., "07:00") |
| quiet_hours_timezone | TEXT | IANA timezone |
| sound_enabled | BOOLEAN | Enable notification sounds |
| sound_volume | INTEGER | 0-100 volume level |

### notification_deliveries

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| notification_id | UUID | FK → notifications |
| channel | TEXT | in_app, email, push |
| success | BOOLEAN | Delivery success status |
| error_message | TEXT | Error details (nullable) |
| delivered_at | TIMESTAMPTZ | Delivery timestamp |
| created_at | TIMESTAMPTZ | Record creation |

---

## API Reference

### POST /api/v1/notifications

Create single notification.

**Headers:**
```
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

**Body:**
```json
{
  "event_type": "TASK_ASSIGNED",
  "recipient_id": "uuid",
  "actor_id": "uuid",
  "resource_ref": "task:123",
  "metadata": {
    "taskTitle": "Review Q4 Report",
    "dueDate": "2026-02-01T00:00:00Z"
  },
  "priority": "normal"
}
```

**Response (201):**
```json
{
  "id": "notification-uuid",
  "created_at": "2026-01-28T10:00:00Z"
}
```

### POST /api/v1/notifications/batch

Create up to 100 notifications.

**Body:**
```json
{
  "events": [
    { "event_type": "...", "recipient_id": "...", ... },
    { "event_type": "...", "recipient_id": "...", ... }
  ]
}
```

---

## Environment Setup

### Frontend (.env.local)

```bash
# Supabase (client-side only)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Pusher (client-side)
VITE_PUSHER_KEY=your-pusher-key
VITE_PUSHER_CLUSTER=us2

# Push notifications (optional)
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

### Backend (server/.env)

```bash
# Supabase (server-side with service role)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Pusher (server-side)
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=us2

# API Security
NOTIFICATION_API_KEY=generate-strong-random-key

# Email (when implemented)
RESEND_API_KEY=re_xxxx

# Push (when implemented)
VAPID_PUBLIC_KEY=your-vapid-public
VAPID_PRIVATE_KEY=your-vapid-private

# CORS
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Environment
NODE_ENV=production
```

---

## Testing Strategy

### Unit Tests (Target: 80% coverage)

| Area | Tool | Priority |
|------|------|----------|
| Services | Vitest | P1 |
| Hooks | @testing-library/react-hooks | P1 |
| Utils | Vitest | P1 |
| Components | @testing-library/react | P2 |

### Integration Tests

| Flow | Tool | Priority |
|------|------|----------|
| Notification delivery | Supertest | P1 |
| Pusher events | Pusher mock | P2 |
| Supabase realtime | Supabase test client | P2 |

### E2E Tests

| Scenario | Tool | Priority |
|----------|------|----------|
| Notification panel flow | Playwright | P2 |
| Settings page | Playwright | P3 |

---

## Sprint Recommendations

### Sprint 1 (Week 1-2): Security & Stability

**Backend:**
- [ ] BE-001: Fix RLS policies and secrets
- [ ] BE-004: Add rate limiting
- [ ] BE-005: Fix CORS configuration

**Frontend:**
- [ ] FE-001: Remove test mode, integrate auth
- [ ] FE-002: Add Error Boundary
- [ ] Fix npm audit vulnerabilities

### Sprint 2 (Week 3-4): Email Delivery

**Backend:**
- [ ] BE-002: Implement email delivery
- [ ] BE-006: Add input validation
- [ ] Add email templates

**Frontend:**
- [ ] FE-003: Performance optimization
- [ ] FE-005: Fix localStorage security
- [ ] Add unit tests for hooks

### Sprint 3 (Week 5-6): Push Notifications

**Backend:**
- [ ] BE-003: Implement push delivery
- [ ] Add push subscription storage

**Frontend:**
- [ ] FE-004: Push subscription hook
- [ ] Service worker setup
- [ ] Push permission UI

### Sprint 4 (Week 7-8): Polish & Testing

**Both teams:**
- [ ] Comprehensive test coverage
- [ ] Documentation updates
- [ ] Performance profiling
- [ ] Security audit review

---

## Questions & Contact

For questions about this implementation plan:
- **Architecture questions:** Review `server/` code structure
- **UI/UX questions:** See `src/components/` and `src/pages/`
- **Database questions:** Review `supabase/migrations/`

---

*This document should be kept updated as implementation progresses.*
