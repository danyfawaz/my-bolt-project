# Notifications Module - Complete Implementation Plan

**Project:** Grower Platform
**Module:** Notifications System
**Last Updated:** 2026-01-28
**Status:** Core Implementation Complete - Ready for Production Hardening

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [What's Already Built](#whats-already-built)
4. [Backend (BE) Implementation Plan](#backend-be-implementation-plan)
5. [Frontend (FE) Implementation Plan](#frontend-fe-implementation-plan)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Environment Configuration](#environment-configuration)
9. [Testing Guide](#testing-guide)
10. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

The Notifications Module provides a complete notification system for the Grower Platform with:
- **9 notification event types** covering tasks, deliverables, and collaboration
- **3 delivery channels**: In-app, Email, Push
- **User preferences** with per-event and per-channel control
- **Real-time delivery** via Supabase Realtime
- **Backend processing** with RabbitMQ support and HTTP API

### Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | All tables, RLS, triggers |
| Frontend UI | ✅ Complete | Panel, settings, bell icon |
| Backend API | ✅ Complete | HTTP endpoint working |
| Real-time | ✅ Complete | Supabase Realtime enabled |
| User Preferences | ✅ Complete | Full CRUD with UI |
| Email Delivery | ⚠️ TODO | Placeholder - needs provider |
| Push Notifications | ⚠️ TODO | Placeholder - needs setup |
| RabbitMQ Consumer | ✅ Complete | Optional - for high volume |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            NOTIFICATION FLOW                                      │
│                                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────────┐ │
│  │   External   │     │   Backend    │     │         Supabase                 │ │
│  │   Service    │────▶│   API        │────▶│  ┌────────────────────────────┐  │ │
│  │  (Triggers)  │     │  :3002       │     │  │      notifications         │  │ │
│  └──────────────┘     └──────────────┘     │  │      (PostgreSQL)          │  │ │
│                              │              │  └────────────┬───────────────┘  │ │
│                              │              │               │                   │ │
│                              ▼              │               │ Realtime          │ │
│                       ┌──────────────┐     │               ▼                   │ │
│                       │   Optional   │     │  ┌────────────────────────────┐  │ │
│                       │   RabbitMQ   │     │  │   supabase_realtime        │  │ │
│                       │   Queue      │     │  │   (WebSocket)              │  │ │
│                       └──────────────┘     │  └────────────┬───────────────┘  │ │
│                                            └───────────────┼───────────────────┘ │
│                                                            │                     │
│  ┌─────────────────────────────────────────────────────────┼─────────────────┐  │
│  │                         FRONTEND (React)                │                 │  │
│  │                                                         ▼                 │  │
│  │  ┌────────────────┐    ┌────────────────┐    ┌──────────────────────┐    │  │
│  │  │ NotificationBell│◀───│useNotifications│◀───│  Supabase Client     │    │  │
│  │  │    Component    │    │     Hook       │    │  (Realtime Sub)      │    │  │
│  │  └────────────────┘    └────────────────┘    └──────────────────────┘    │  │
│  │           │                                                               │  │
│  │           ▼                                                               │  │
│  │  ┌────────────────┐    ┌────────────────┐                                │  │
│  │  │NotificationPanel│    │ NotificationItem│                               │  │
│  │  │   Component     │───▶│   Component    │                               │  │
│  │  └────────────────┘    └────────────────┘                                │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript | UI Components |
| State | React Hooks + Context | State Management |
| Styling | Tailwind CSS | Responsive UI + Dark Mode |
| Real-time | Supabase Realtime | Live Notification Updates |
| Backend | Node.js + Express | Notification Processing |
| Queue | RabbitMQ (optional) | High-volume Processing |
| Database | PostgreSQL (Supabase) | Data Persistence |
| Auth | Supabase Auth | User Authentication |

---

## What's Already Built

### Frontend Components

| Component | File | Description |
|-----------|------|-------------|
| NotificationBell | `src/components/NotificationBell.tsx` | Header bell icon with unread badge |
| NotificationPanel | `src/components/NotificationPanel.tsx` | Slide-out notification list |
| NotificationItem | `src/components/NotificationItem.tsx` | Individual notification display |
| NotificationSettings | `src/pages/settings/NotificationSettings.tsx` | Preferences UI |
| AuthPanel | `src/components/AuthPanel.tsx` | Login/signup form |
| ErrorBoundary | `src/components/ErrorBoundary.tsx` | Error handling wrapper |

### Frontend Hooks

| Hook | File | Description |
|------|------|-------------|
| useNotifications | `src/hooks/useNotifications.ts` | Notification CRUD + realtime |
| useNotificationPreferences | `src/hooks/useNotificationPreferences.ts` | Preferences management |
| useAuth | `src/hooks/useAuth.ts` | Authentication state |
| useWebSocket | `src/hooks/useWebSocket.ts` | WebSocket/auth context |

### Frontend Services

| Service | File | Description |
|---------|------|-------------|
| NotificationService | `src/services/NotificationService.ts` | Notification API calls |
| NotificationPreferencesService | `src/services/NotificationPreferencesService.ts` | Preferences API |

### Backend Services

| Service | File | Description |
|---------|------|-------------|
| NotificationProcessor | `server/src/services/NotificationProcessor.ts` | Core processing logic |
| SupabaseService | `server/src/services/SupabaseService.ts` | Database operations |
| PusherBroadcaster | `server/src/services/PusherBroadcaster.ts` | Optional Pusher integration |
| RabbitMQConsumer | `server/src/consumers/RabbitMQConsumer.ts` | Queue consumer |

### Database Tables

| Table | Description |
|-------|-------------|
| notifications | Core notification records |
| notification_preferences | User preferences |
| notification_deliveries | Delivery tracking |

---

## Backend (BE) Implementation Plan

### BE-001: Email Delivery Integration (Priority: HIGH)

**Goal:** Implement actual email sending for notifications

**File:** `server/src/services/EmailService.ts` (new file)

**Steps:**
1. Choose email provider (Resend, SendGrid, or AWS SES)
2. Create EmailService class
3. Implement email templates per event type
4. Update NotificationProcessor to use EmailService
5. Add email queue for retry logic

**Code Structure:**
```typescript
// server/src/services/EmailService.ts
import { Resend } from 'resend';

export class EmailService {
  private client: Resend;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
  }

  async sendNotificationEmail(
    to: string,
    notification: StoredNotification
  ): Promise<boolean> {
    const template = this.getTemplate(notification.event_type);

    await this.client.emails.send({
      from: 'Grower Platform <notifications@growerplatform.com>',
      to,
      subject: template.subject(notification),
      html: template.html(notification),
    });

    return true;
  }

  private getTemplate(eventType: string): EmailTemplate {
    // Return template based on event type
  }
}
```

**Environment Variables:**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM_ADDRESS=notifications@growerplatform.com
```

**Acceptance Criteria:**
- [ ] Emails sent for enabled channels
- [ ] Templates render correctly
- [ ] Unsubscribe link included
- [ ] Rate limiting in place

---

### BE-002: Push Notification Integration (Priority: MEDIUM)

**Goal:** Implement web push notifications

**Files:**
- `server/src/services/PushService.ts` (new)
- `src/hooks/usePushSubscription.ts` (new)
- `public/sw.js` (service worker)

**Steps:**
1. Generate VAPID keys
2. Create PushService with web-push library
3. Create service worker for push handling
4. Add subscription management in frontend
5. Store subscriptions in database

**Database Migration:**
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
```

**Environment Variables:**
```bash
VAPID_PUBLIC_KEY=BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxK
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_SUBJECT=mailto:admin@growerplatform.com
```

---

### BE-003: Rate Limiting (Priority: HIGH)

**Goal:** Add rate limiting to prevent abuse

**File:** `server/src/middleware/rateLimiter.ts`

**Implementation:**
```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests' },
  standardHeaders: true,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Rate limit exceeded' },
});
```

**Apply to routes:**
```typescript
app.post('/api/v1/notifications', strictLimiter, authenticate, ...);
app.post('/api/v1/notifications/batch', apiLimiter, authenticate, ...);
```

---

### BE-004: Input Validation with Zod (Priority: HIGH)

**Goal:** Validate all API inputs

**File:** `server/src/validation/schemas.ts`

**Implementation:**
```typescript
import { z } from 'zod';

export const NotificationEventSchema = z.object({
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
  ).optional(),
  priority: z.enum(['normal', 'high']).default('normal'),
});

export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
```

---

### BE-005: Webhook Support (Priority: LOW)

**Goal:** Allow external services to trigger notifications

**Endpoint:** `POST /api/v1/webhooks/notifications`

**Features:**
- Webhook signature verification
- Payload transformation
- Source tracking

---

### BE-006: Notification Analytics (Priority: LOW)

**Goal:** Track notification metrics

**Metrics to track:**
- Delivery rate per channel
- Read rate
- Click-through rate
- Time to read

**Database:**
```sql
CREATE TABLE notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id),
  event TEXT NOT NULL, -- 'delivered', 'read', 'clicked'
  channel TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

---

## Frontend (FE) Implementation Plan

### FE-001: Performance Optimization (Priority: HIGH)

**Goal:** Optimize NotificationItem rendering

**File:** `src/components/NotificationItem.tsx`

**Changes:**
```typescript
import { memo, useCallback } from 'react';

export const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkAsRead,
  onArchive,
  onClick,
}: NotificationItemProps) {
  const handleMarkAsRead = useCallback(() => {
    onMarkAsRead(notification.id);
  }, [notification.id, onMarkAsRead]);

  // ... rest of component
});
```

---

### FE-002: Notification Grouping Enhancement (Priority: MEDIUM)

**Goal:** Group notifications by type/source

**File:** `src/components/NotificationPanel.tsx`

**Features:**
- Group by event type
- Collapse/expand groups
- "View all" for each group

---

### FE-003: Notification Search & Filter (Priority: MEDIUM)

**Goal:** Allow users to search/filter notifications

**Features:**
- Search by title/content
- Filter by type
- Filter by read/unread
- Date range filter

---

### FE-004: Push Subscription UI (Priority: MEDIUM)

**Goal:** UI for managing push notification subscription

**File:** `src/components/PushSubscriptionToggle.tsx`

**Features:**
- Request permission
- Subscribe/unsubscribe
- Test push button

---

### FE-005: Notification Sounds (Priority: LOW)

**Goal:** Play sounds for new notifications

**File:** `src/hooks/useNotificationSound.ts`

**Features:**
- Configurable sound
- Volume control (already in preferences)
- Respect quiet hours

---

### FE-006: Empty States & Loading (Priority: LOW)

**Goal:** Better UX for empty/loading states

**Files:**
- `src/components/NotificationSkeleton.tsx`
- `src/components/EmptyNotifications.tsx`

---

## Database Schema

### notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'unread'
    CHECK (state IN ('unread', 'read', 'actioned', 'archived', 'expired')),
  resource_ref TEXT,
  metadata JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'normal',
  correlation_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_state ON notifications(state);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Only service role can insert" ON notifications
  FOR INSERT WITH CHECK (
    current_setting('role') = 'service_role' OR
    auth.uid() = recipient_id
  );

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);
```

### notification_preferences

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  channels_enabled JSONB DEFAULT '{"in_app": true, "email": true, "push": false}',
  event_preferences JSONB DEFAULT '{}',
  category_enabled JSONB DEFAULT '{"task_management": true, "deliverable_workflow": true, "collaboration": true}',
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  quiet_hours_timezone TEXT DEFAULT 'UTC',
  sound_enabled BOOLEAN DEFAULT true,
  sound_volume INTEGER DEFAULT 50 CHECK (sound_volume >= 0 AND sound_volume <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### notification_deliveries

```sql
CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'push')),
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(notification_id, channel)
);
```

---

## API Reference

### Create Notification

```http
POST /api/v1/notifications
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "event_type": "TASK_ASSIGNED",
  "recipient_id": "uuid",
  "actor_id": "uuid",
  "resource_ref": "task:123",
  "metadata": {
    "taskTitle": "Review Q4 Report",
    "assignedBy": "John Doe"
  },
  "priority": "normal"
}
```

**Response (201):**
```json
{
  "success": true,
  "notification_id": "uuid",
  "deliveries": [
    { "channel": "in_app", "success": true },
    { "channel": "email", "success": true }
  ]
}
```

### Create Batch Notifications

```http
POST /api/v1/notifications/batch
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "notifications": [
    { "event_type": "...", "recipient_id": "...", ... },
    { "event_type": "...", "recipient_id": "...", ... }
  ]
}
```

### Broadcast to Multiple Users

```http
POST /api/v1/notifications/broadcast
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "recipient_ids": ["uuid1", "uuid2", "uuid3"],
  "event_type": "TASK_COMPLETED",
  "resource_ref": "task:456",
  "metadata": { "taskTitle": "Sprint Planning" }
}
```

### Event Types

| Event Type | Category | Description |
|------------|----------|-------------|
| TASK_ASSIGNED | task_management | User assigned to a task |
| TASK_OVERDUE | task_management | Task past due date |
| TASK_COMPLETED | task_management | Task marked complete |
| SUBMISSION_DUE | deliverable_workflow | Deliverable submission deadline |
| DELIVERABLE_SUBMITTED | deliverable_workflow | Deliverable was submitted |
| DELIVERABLE_APPROVED | deliverable_workflow | Deliverable approved |
| DELIVERABLE_REJECTED | deliverable_workflow | Deliverable rejected |
| COMMENT_ADDED | collaboration | New comment on item |
| REACTION_ADDED | collaboration | Reaction added to item |

---

## Environment Configuration

### Frontend (.env.local)

```bash
# Supabase
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbG...

# Push Notifications (optional)
VITE_VAPID_PUBLIC_KEY=Bxxxx...
```

### Backend (server/.env)

```bash
# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# API
API_PORT=3002
NOTIFICATION_API_KEY=your-secure-api-key

# RabbitMQ (optional)
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=notifications
RABBITMQ_QUEUE=notification-worker

# Email (when implemented)
RESEND_API_KEY=re_xxxx
EMAIL_FROM_ADDRESS=notifications@growerplatform.com

# Push (when implemented)
VAPID_PUBLIC_KEY=Bxxxx...
VAPID_PRIVATE_KEY=xxxx...
VAPID_SUBJECT=mailto:admin@growerplatform.com

# Feature Flags
ENABLE_EMAIL=false
ENABLE_PUSH=false
```

---

## Testing Guide

### Local Testing

1. **Start Supabase:**
   ```bash
   supabase start
   ```

2. **Start Backend:**
   ```bash
   cd server && npm run start:api
   ```

3. **Start Frontend:**
   ```bash
   npm run dev
   ```

4. **Open Test Page:**
   ```
   http://localhost:5173/test-notifications
   ```

5. **Test Flow:**
   - Sign up with email/password
   - Click "Direct to DB" to create notification
   - Click bell icon to see notification
   - Test mark as read, archive, etc.

### API Testing with curl

```bash
# Create notification
curl -X POST http://localhost:3002/api/v1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-notification-api-key-2024" \
  -d '{
    "event_type": "TASK_ASSIGNED",
    "recipient_id": "USER_UUID_HERE",
    "metadata": { "taskTitle": "Test Task" }
  }'
```

### Demo Mode

For UI testing without backend:
```
http://localhost:5173/?demo=true
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run `npm audit fix` on both frontend and backend
- [ ] Update all environment variables for production
- [ ] Generate strong API keys
- [ ] Configure CORS for production domains
- [ ] Enable SSL/TLS
- [ ] Set up monitoring (Sentry, etc.)

### Database

- [ ] Run migrations on production Supabase
- [ ] Verify RLS policies are active
- [ ] Set up database backups
- [ ] Configure connection pooling

### Backend

- [ ] Deploy to hosting (Railway, Render, AWS, etc.)
- [ ] Configure environment variables
- [ ] Set up health checks
- [ ] Configure auto-scaling if needed
- [ ] Set up logging aggregation

### Frontend

- [ ] Build production bundle: `npm run build`
- [ ] Deploy to CDN (Vercel, Netlify, Cloudflare)
- [ ] Configure environment variables
- [ ] Set up error tracking

### Post-Deployment

- [ ] Verify notifications flow end-to-end
- [ ] Test real-time updates
- [ ] Monitor error rates
- [ ] Check performance metrics

---

## Sprint Recommendations

### Sprint 1: Production Hardening (Week 1-2)

**Backend:**
- [ ] BE-003: Add rate limiting
- [ ] BE-004: Add input validation with Zod
- [ ] Security audit fixes

**Frontend:**
- [ ] FE-001: Performance optimization
- [ ] FE-006: Empty states & loading

**Both:**
- [ ] Unit test coverage (target: 70%)
- [ ] Integration tests

### Sprint 2: Email Integration (Week 3-4)

**Backend:**
- [ ] BE-001: Email delivery integration
- [ ] Email templates for all event types
- [ ] Unsubscribe flow

**Frontend:**
- [ ] Email preference toggles (already done)
- [ ] Email preview in settings

### Sprint 3: Push Notifications (Week 5-6)

**Backend:**
- [ ] BE-002: Push notification integration
- [ ] Push subscription storage

**Frontend:**
- [ ] FE-004: Push subscription UI
- [ ] Service worker setup
- [ ] Permission request flow

### Sprint 4: Enhancements (Week 7-8)

**Backend:**
- [ ] BE-005: Webhook support
- [ ] BE-006: Analytics

**Frontend:**
- [ ] FE-002: Notification grouping
- [ ] FE-003: Search & filter
- [ ] FE-005: Notification sounds

---

## Support & Resources

### Key Files

| Purpose | File |
|---------|------|
| Notification Hook | `src/hooks/useNotifications.ts` |
| Preferences Hook | `src/hooks/useNotificationPreferences.ts` |
| Bell Component | `src/components/NotificationBell.tsx` |
| Panel Component | `src/components/NotificationPanel.tsx` |
| Backend API | `server/src/api.ts` |
| Processor | `server/src/services/NotificationProcessor.ts` |
| DB Service | `server/src/services/SupabaseService.ts` |

### Useful Commands

```bash
# Reset database
supabase db reset

# View Supabase Studio
open http://127.0.0.1:54323

# View email inbox (local)
open http://127.0.0.1:54324

# Check backend health
curl http://localhost:3002/health
```

---

*Document maintained by the development team. Last review: 2026-01-28*
