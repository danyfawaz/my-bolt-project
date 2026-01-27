# STY-003: Floating Notification Panel & Real-Time UI

## 1. User Problem & Intent

**As a** Grower Platform User, I want to view and manage my notifications in an elegant floating panel
**So that** I can stay informed about platform events, take immediate action, and maintain focus without navigating away from my current task

### Context:

With STY-001 (Backend Service & Schema) and STY-002 (Pusher Integration & Auth) complete, we now have notifications persisted in the database and real-time delivery via Pusher Channels. This story adds the **frontend notification UI** - a floating panel that displays notifications, supports real-time updates, and provides an elegant dark-mode experience.

The panel groups notifications by time period, shows visual indicators for unread items, and allows users to mark as read, archive, and navigate to related resources - all without page refresh.

**Technology Stack:**
- React 18 with TypeScript
- Tailwind CSS with custom design tokens
- Pusher JS client for real-time subscription
- Supabase for data persistence

This story covers:
- NotificationBell component (trigger)
- NotificationPanel component (main UI)
- NotificationItem component (individual rows)
- ThemeToggle component (dark mode)
- useNotifications hook (state management)
- useTheme hook (theme persistence)

---

## 2. Acceptance Criteria

### Success

#### Notification Bell
- [ ] Bell icon visible in application header/navbar
- [ ] Unread count badge displayed when unread > 0
- [ ] Badge shows "99+" when unread exceeds 99
- [ ] Bell animates (ring effect) when new notification arrives
- [ ] Pulse effect on badge indicates unread notifications
- [ ] Clicking bell toggles notification panel open/closed
- [ ] Badge updates in real-time without page refresh

#### Notification Panel
- [ ] Panel appears as floating overlay anchored to bottom-right
- [ ] Panel width: 400px, max-height: calc(100vh - 8rem)
- [ ] Glassmorphism design with backdrop blur effect
- [ ] Smooth slide-up animation on open
- [ ] Backdrop overlay dims background and closes panel on click
- [ ] Escape key closes panel
- [ ] Header shows "Notifications" title with bell icon
- [ ] Header shows unread count below title
- [ ] "Mark all as read" button in header (visible when unread > 0)
- [ ] Close (X) button in header
- [ ] Footer shows total notification count
- [ ] Footer includes "Preferences" button

#### Notification Grouping
- [ ] Notifications grouped by time period: Today, Yesterday, This Week, Earlier
- [ ] Group headers are sticky during scroll
- [ ] Groups only appear if they contain notifications
- [ ] Notifications sorted by created_at descending within each group

#### Notification Items
- [ ] Each item displays: icon, title, type label, relative timestamp
- [ ] Icon and color determined by event type (see Event Type Styling)
- [ ] Unread items have accent line on left edge
- [ ] Unread items have pulsing blue dot indicator
- [ ] Unread items have bolder text weight
- [ ] Read items have muted styling
- [ ] Hover reveals action buttons (mark as read, archive)
- [ ] Mouse-tracking glow effect on hover
- [ ] Clicking item marks as read and navigates to resource
- [ ] Rounded card design with subtle background per event type

#### Event Type Styling

| Event Type | Icon | Color (Light) | Color (Dark) |
|------------|------|---------------|--------------|
| TASK_OVERDUE | AlertCircle | Red-500 | Red-400 |
| SUBMISSION_DUE | Clock | Amber-500 | Amber-400 |
| DELIVERABLE_SUBMITTED | FileText | Blue-500 | Blue-400 |
| DELIVERABLE_APPROVED | CheckCircle | Emerald-500 | Emerald-400 |
| DELIVERABLE_REJECTED | XCircle | Red-500 | Red-400 |
| TASK_ASSIGNED | User | Violet-500 | Violet-400 |
| TASK_COMPLETED | CheckCircle | Emerald-500 | Emerald-400 |
| COMMENT_ADDED | MessageSquare | Surface-500 | Surface-400 |
| REACTION_ADDED | ThumbsUp | Yellow-500 | Yellow-400 |

#### Dark Mode Support
- [ ] All components fully support dark mode
- [ ] Theme toggle button in header (sun/moon icons)
- [ ] Animated icon transition between themes
- [ ] Theme preference persisted to localStorage
- [ ] System preference (prefers-color-scheme) respected as default
- [ ] Smooth color transition (200ms duration)
- [ ] Dark mode uses surface color palette (not pure black)

#### Loading & Empty States
- [ ] Loading state shows branded spinner with "Loading notifications..." text
- [ ] Empty state shows inbox icon with "All caught up!" message
- [ ] Empty state includes secondary text: "No new notifications at the moment."

#### Real-Time Updates
- [ ] New notifications appear instantly without refresh
- [ ] Notification state changes (read, archived) reflect immediately
- [ ] Unread count updates in real-time across all tabs
- [ ] Bell animation triggers on new notification

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User has 0 notifications | Empty state displayed, no badge on bell |
| User has 100+ notifications | Panel scrollable, footer shows count |
| Notification title very long | Text truncates with ellipsis |
| User clicks notification without resource_ref | Mark as read only, no navigation |
| User opens panel while loading | Spinner displayed until data arrives |
| User archives unread notification | Unread count decrements, item hidden |
| User marks all as read with 0 unread | Button not visible (conditional render) |
| Multiple tabs open | State syncs across all tabs via Pusher |
| User rapidly clicks mark as read | Debounce prevents duplicate API calls |
| Notification created before subscription | Fetched via initial API call |
| Dark mode toggled mid-session | All components transition smoothly |
| System theme changes | Respects change if no localStorage preference |

### Errors

| Error Scenario | Expected Behavior |
|----------------|-------------------|
| API fetch fails | Console error logged, empty state shown |
| Mark as read API fails | Console error logged, UI unchanged |
| Archive API fails | Console error logged, item remains visible |
| Pusher connection fails | Falls back to REST polling on refresh |
| Invalid notification data | Gracefully ignored, console warning |
| Navigation route invalid | Standard 404 handling by router |

---

## 3. UX Behaviors

### Flows

#### Open Notification Panel Flow
1. User sees bell icon in header with unread badge (if applicable)
2. User clicks bell icon
3. Backdrop fades in (200ms)
4. Panel slides up from bottom-right (300ms)
5. Loading spinner shown if data not cached
6. Notifications render grouped by time period
7. User can scroll, interact, or close

#### Mark as Read Flow (Click)
1. User clicks on notification item
2. Item visual state updates immediately (optimistic)
3. API call sent to update notification state
4. Unread count decremented in header and badge
5. If resource_ref exists, navigate to resource URL
6. Panel closes after navigation

#### Mark as Read Flow (Button)
1. User hovers over notification item
2. Action buttons fade in (200ms)
3. User clicks checkmark (mark as read) button
4. Item visual state updates immediately
5. API call sent to update notification state
6. Unread count decremented
7. Panel remains open

#### Archive Flow
1. User hovers over notification item
2. Action buttons fade in
3. User clicks archive button
4. Item fades out and is removed from list
5. API call sent to update notification state
6. If item was unread, unread count decremented
7. Group header hidden if group becomes empty

#### Mark All as Read Flow
1. User clicks "Mark all as read" button in header
2. All unread items update visual state immediately
3. API call sent to bulk update
4. Badge clears (count = 0)
5. Button hides (no unread remaining)

#### Theme Toggle Flow
1. User clicks sun/moon icon in header
2. Icon animates (rotate + scale transition)
3. `dark` class added/removed from document root
4. All components transition colors (200ms)
5. Preference saved to localStorage
6. Persists across page refreshes and sessions

#### New Notification Flow (Real-Time)
1. Backend triggers Pusher `notification:new` event
2. Pusher client receives event on `private-user-{userId}` channel
3. useNotifications hook adds notification to state
4. Unread count incremented
5. Bell icon animates (ring effect)
6. Badge scales in with animation
7. If panel open, new notification appears at top of "Today" group

#### Cross-Tab Sync Flow
1. User has multiple tabs open
2. User marks notification as read in Tab A
3. Backend triggers Pusher `notification:updated` event
4. All tabs receive event via Pusher
5. All tabs update UI state simultaneously
6. Badge count synced across all tabs

### Interactions

| Element | Action | Result |
|---------|--------|--------|
| Bell Icon | Click | Toggle panel open/closed |
| Bell Icon | New notification | Ring animation (500ms) |
| Backdrop | Click | Close panel |
| Panel | Escape key | Close panel |
| Close Button | Click | Close panel |
| Mark All as Read | Click | Update all unread to read state |
| Preferences | Click | (Future: open preferences modal) |
| Notification Item | Click | Mark as read + navigate |
| Notification Item | Hover | Reveal action buttons |
| Mark as Read Button | Click | Update item to read state |
| Archive Button | Click | Hide item, update to archived state |
| Theme Toggle | Click | Switch light/dark mode |
| Group Header | Scroll | Sticky positioning at top |

### States

#### Panel States

| State | Trigger | Visual |
|-------|---------|--------|
| Closed | Default, backdrop click, escape, close button | Panel not rendered |
| Loading | Panel opened, data fetching | Spinner centered in panel |
| Empty | Data loaded, 0 visible notifications | Empty state illustration |
| Populated | Data loaded, 1+ visible notifications | Grouped notification list |

#### Notification Item States

| State | Visual Indicators |
|-------|-------------------|
| Unread | Bold title, accent line, pulsing dot, colored background |
| Read | Normal weight, muted colors, no indicators |
| Hovered | Glow effect, action buttons visible |
| Archived | Hidden from panel (filtered out) |
| Expired | Hidden from panel (filtered out) |

#### Theme States

| State | Visual |
|-------|--------|
| Light | White backgrounds, dark text, sun icon |
| Dark | Surface-900 backgrounds, light text, moon icon |
| Transitioning | 200ms color transition on all elements |

#### Pusher Connection States
(Handled by Pusher client, exposed via usePusherNotifications hook)

| State | Badge Behavior | Panel Behavior |
|-------|----------------|----------------|
| connected | Real-time updates | Live updates |
| connecting | Last known count | Last known data |
| disconnected | Last known count | Fetch on reopen |
| unavailable | Last known count | Fetch on reopen |

### Global Behaviors

- **Privacy:** Users only see their own notifications (enforced by RLS + Pusher auth)
- **Persistence:** All state changes persisted to database immediately
- **Optimistic Updates:** UI updates before API confirmation for responsiveness
- **Graceful Degradation:** Panel works without Pusher (REST fallback on refresh)
- **Accessibility:** Keyboard navigation, focus management, ARIA labels
- **Performance:** Notifications limited to 50 most recent, virtualization future enhancement

---

## 4. UI Configuration Reference

### Design Tokens

#### Brand Colors (Green - Grower Platform)

| Token | Value | Usage |
|-------|-------|-------|
| brand-50 | #f0fdf4 | Subtle backgrounds |
| brand-100 | #dcfce7 | Hover states |
| brand-400 | #4ade80 | Dark mode accents |
| brand-500 | #22c55e | Primary actions, unread indicator |
| brand-600 | #16a34a | Light mode accents |

#### Surface Colors (Neutral)

| Token | Value | Usage |
|-------|-------|-------|
| surface-50 | #fafafa | Light mode background |
| surface-100 | #f4f4f5 | Light mode hover |
| surface-200 | #e4e4e7 | Light mode borders |
| surface-700 | #3f3f46 | Dark mode borders |
| surface-800 | #27272a | Dark mode hover |
| surface-850 | #1f1f23 | Dark mode elevated |
| surface-900 | #18181b | Dark mode background |
| surface-950 | #09090b | Dark mode deep background |

### Animation Specifications

| Animation | Duration | Easing | Keyframes |
|-----------|----------|--------|-----------|
| slide-up | 300ms | ease-out | translateY(16px) → translateY(0) |
| fade-in | 200ms | ease-out | opacity(0) → opacity(1) |
| scale-in | 200ms | ease-out | scale(0.95) → scale(1) |
| pulse-soft | 2000ms | ease-in-out | opacity(1) → opacity(0.6) → opacity(1) |
| bell-ring | 500ms | ease-in-out | rotate(0°→15°→-15°→10°→-10°→0°) |

### Component Dimensions

| Component | Property | Value |
|-----------|----------|-------|
| Panel | Width | 400px |
| Panel | Max Height | calc(100vh - 8rem) |
| Panel | Border Radius | 16px (rounded-2xl) |
| Panel | Position | fixed bottom-4 right-4 |
| Item | Padding | 12px |
| Item | Border Radius | 12px (rounded-xl) |
| Item | Margin | 4px 8px |
| Icon Container | Size | 32px (p-2 + 16px icon) |
| Badge | Min Width | 20px |
| Badge | Height | 20px |
| Badge | Font Size | 11px |
| Accent Line | Width | 2px |

### CSS Classes

```css
/* Glassmorphism panel */
.glass-panel {
  @apply bg-white/95 dark:bg-surface-900/90 backdrop-blur-xl;
  @apply border border-surface-200/50 dark:border-surface-700/50;
  @apply shadow-xl dark:shadow-2xl dark:shadow-black/20;
}

/* Scrollbar styling */
.notification-scrollbar::-webkit-scrollbar { width: 6px; }
.notification-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(113, 113, 122, 0.3);
  border-radius: 3px;
}

/* Mouse-tracking glow */
.notification-glow::before {
  background: radial-gradient(
    600px circle at var(--mouse-x) var(--mouse-y),
    rgba(34, 197, 94, 0.06),
    transparent 40%
  );
}
```

---

## 5. Dependencies & Constraints

### Story Dependencies

| Dependency | Status | Details |
|------------|--------|---------|
| STY-001 (BLOCKER) | ✅ Complete | NotificationService, DB schema, RLS policies |
| STY-002 (BLOCKER) | ✅ Complete | Pusher integration, auth endpoint, event triggering |

### This Story BLOCKS:

| Story | Reason |
|-------|--------|
| STY-004 | Toast notifications need panel infrastructure |
| STY-005 | Notification preferences UI needs panel |

### Technical Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| React | ^18.3.1 | Component framework |
| react-router-dom | ^6.22.2 | Navigation on click |
| @supabase/supabase-js | ^2.49.1 | Data fetching, real-time |
| pusher-js | ^8.4.0 | Real-time event subscription |
| lucide-react | ^0.344.0 | Icon library |
| date-fns | ^3.3.1 | Relative time formatting |
| tailwindcss | ^3.x | Styling system |

### Design Dependencies

| Asset | Status | Details |
|-------|--------|---------|
| Icon set | ✅ Complete | Using lucide-react |
| Color palette | ✅ Complete | Brand (green) + Surface (neutral) |
| Typography | ✅ Complete | System font stack via Tailwind |
| Animations | ✅ Complete | Defined in tailwind.config.js |

### Constraints

| Constraint | Details |
|------------|---------|
| **Privacy** | Users must NOT see other users' notifications |
| **Performance** | Panel must open in < 300ms, no jank during scroll |
| **Accessibility** | Must support keyboard navigation, screen readers |
| **Browser Support** | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| **Mobile** | Panel responsive, but optimized for desktop (Phase 2 for mobile) |
| **Notification Limit** | Display max 50 notifications (pagination future enhancement) |
| **Dark Mode** | Must not use pure black (#000), use surface palette |
| **Animations** | Respect prefers-reduced-motion media query |

---

## 6. Test Scenarios

### Happy Path

#### View Notifications
1. User logs in and navigates to dashboard
2. Bell icon visible with badge showing "3" (unread count)
3. User clicks bell icon
4. Panel slides up with smooth animation
5. Notifications displayed in groups: "Today" (2), "Yesterday" (1)
6. Unread notifications show accent line and bold text
7. User can scroll through notifications
8. Footer shows "3 notifications"

#### Mark Single as Read
1. User hovers over unread notification
2. Action buttons fade in
3. User clicks checkmark button
4. Notification visual updates (no more accent line, lighter text)
5. Badge decrements from "3" to "2"
6. Notification remains in list

#### Navigate from Notification
1. User clicks on "Review Q4 harvest projections" notification
2. Notification marked as read
3. Panel closes
4. User navigated to `/task/task-123`
5. Task detail page displays

#### Mark All as Read
1. User has 5 unread notifications
2. User clicks "Mark all as read" button (double-check icon)
3. All notifications update to read styling
4. Badge clears (hidden)
5. "Mark all as read" button hidden

#### Archive Notification
1. User hovers over notification
2. User clicks archive button
3. Notification fades out and is removed from list
4. If it was unread, badge decrements
5. Notification no longer appears in panel

#### Toggle Dark Mode
1. User clicks sun icon in header
2. Icon animates to moon
3. Entire UI transitions to dark colors
4. Panel glassmorphism effect adapts
5. User refreshes page
6. Dark mode persists (localStorage)

#### Receive Real-Time Notification
1. User has panel open with 2 notifications
2. Another user submits deliverable for approval
3. Bell icon rings animation triggers
4. New notification appears at top of "Today" group
5. Badge increments
6. No page refresh occurred

### Edge Cases

#### Empty State
1. New user with 0 notifications
2. Clicks bell icon
3. Panel opens with empty state illustration
4. Message: "All caught up!"
5. No badge on bell icon

#### Large Unread Count
1. User has 150 unread notifications
2. Badge shows "99+"
3. Panel shows 50 most recent (limit)
4. Scroll to view all 50

#### Offline/Reconnect
1. User loses internet connection
2. User clicks notification (mark as read)
3. API call fails, error logged
4. UI state unchanged (no optimistic update without network)
5. User reconnects
6. Pusher reconnects automatically
7. User retries action, succeeds

#### System Theme Change
1. User has no localStorage preference
2. System is in light mode, app shows light
3. User changes system to dark mode
4. App detects change, switches to dark mode
5. User manually toggles to light
6. Preference saved to localStorage
7. System changes no longer affect app

### Errors

#### API Fetch Failure
1. User opens panel
2. Supabase returns error
3. Console logs error with details
4. Panel shows empty state (graceful degradation)
5. User can retry by closing and reopening

#### Pusher Auth Failure
1. User's session expires
2. Pusher tries to resubscribe
3. Auth endpoint returns 401
4. Console logs auth failure
5. Real-time updates stop
6. User can still fetch via API on panel open
7. User prompted to re-login on next action

#### Mark as Read Failure
1. User clicks mark as read
2. API returns 500 error
3. Console logs error
4. UI does NOT update (no false positives)
5. User can retry

---

## Appendix

### File Reference

| File | Purpose |
|------|---------|
| `src/components/NotificationBell.tsx` | Bell icon trigger with badge |
| `src/components/NotificationPanel.tsx` | Main panel container |
| `src/components/NotificationItem.tsx` | Individual notification row |
| `src/components/ThemeToggle.tsx` | Dark mode toggle button |
| `src/hooks/useNotifications.ts` | Notification state management |
| `src/hooks/usePusherNotifications.ts` | Pusher subscription hook |
| `src/hooks/useTheme.ts` | Theme state with localStorage |
| `src/mocks/notifications.ts` | Mock data for demo mode |
| `src/types/notification.ts` | TypeScript type definitions |
| `src/index.css` | Global styles, scrollbar, glassmorphism |
| `tailwind.config.js` | Design tokens, animations |

### Demo Mode

Access demo mode for testing without database:

```
http://localhost:5173/?demo=true
```

Loads 11 mock notifications across all time groups with various event types and states.

### Quick Code Reference

```typescript
// Using the notification hook
const {
  notifications,    // Notification[]
  unreadCount,      // number
  loading,          // boolean
  markAsRead,       // (id: string) => Promise<void>
  archive,          // (id: string) => Promise<void>
  markAllAsRead,    // () => Promise<void>
} = useNotifications();

// Using the theme hook
const {
  theme,        // 'light' | 'dark'
  isDark,       // boolean
  toggleTheme,  // () => void
} = useTheme();
```
