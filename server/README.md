# Notification Worker Service

A Node.js service that processes notification events from RabbitMQ and delivers them via multiple channels (in-app, email, push).

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Your Platform  │────▶│    RabbitMQ     │────▶│   Worker        │
│  (Events)       │     │   Exchange      │     │   (This Service)│
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
       ┌───────────────────────────────┬─────────────────┼─────────────────┐
       ▼                               ▼                 ▼                 ▼
┌─────────────────┐         ┌─────────────────┐  ┌─────────────────┐ ┌──────────┐
│   Supabase DB   │────────▶│   Supabase      │  │     Pusher      │ │  Email   │
│  (Storage)      │         │   Realtime      │  │   (Broadcast)   │ │  (SMTP)  │
└─────────────────┘         └────────┬────────┘  └────────┬────────┘ └──────────┘
                                     │                    │
                                     └────────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │    Browser      │
                                     │    (React App)  │
                                     └─────────────────┘
```

## Quick Start

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start RabbitMQ (using Docker)

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### 4. Run the worker

```bash
# Development with hot reload
npm run dev

# Or run the HTTP API server (alternative to RabbitMQ)
npm run start:api
```

## Message Format

Publish messages to RabbitMQ with this format:

```json
{
  "type": "notification",
  "version": "1.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "payload": {
    "event_type": "TASK_ASSIGNED",
    "recipient_id": "user-uuid",
    "actor_id": "actor-uuid",
    "resource_ref": "task:task-uuid",
    "metadata": {
      "taskId": "task-uuid",
      "taskTitle": "Review quarterly report"
    },
    "priority": "normal",
    "correlation_id": "trace-uuid"
  }
}
```

### Event Types

| Event | Description |
|-------|-------------|
| `TASK_ASSIGNED` | User was assigned to a task |
| `TASK_OVERDUE` | Task is past due date |
| `TASK_COMPLETED` | Task was marked complete |
| `SUBMISSION_DUE` | Deliverable submission deadline approaching |
| `DELIVERABLE_SUBMITTED` | Deliverable was submitted |
| `DELIVERABLE_APPROVED` | Deliverable was approved |
| `DELIVERABLE_REJECTED` | Deliverable was rejected |
| `COMMENT_ADDED` | New comment on a resource |
| `REACTION_ADDED` | New reaction on a resource |

## HTTP API (Alternative to RabbitMQ)

For simpler integrations, use the HTTP API:

### Create a notification

```bash
curl -X POST http://localhost:3002/api/v1/notifications \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "TASK_ASSIGNED",
    "recipient_id": "user-uuid",
    "metadata": {"taskTitle": "Review report"}
  }'
```

### Batch create

```bash
curl -X POST http://localhost:3002/api/v1/notifications/batch \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": [
      {"event_type": "TASK_ASSIGNED", "recipient_id": "user-1"},
      {"event_type": "TASK_ASSIGNED", "recipient_id": "user-2"}
    ]
  }'
```

### Broadcast to multiple users

```bash
curl -X POST http://localhost:3002/api/v1/notifications/broadcast \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_ids": ["user-1", "user-2", "user-3"],
    "event_type": "TASK_COMPLETED",
    "metadata": {"taskTitle": "Sprint completed"}
  }'
```

## Health Check

```bash
curl http://localhost:3001/health
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/src/index.js"]
```

### Environment Variables

See `.env.example` for all configuration options.

## How It Works

1. **Event Ingestion**: Worker consumes from RabbitMQ queue (or receives via HTTP API)
2. **Preference Check**: Loads user's notification preferences from Supabase
3. **Channel Selection**: Determines which channels to deliver to based on preferences
4. **Quiet Hours**: Respects user's quiet hours for push/sound notifications
5. **Storage**: Writes notification to Supabase `notifications` table
6. **Realtime Push**: Supabase Realtime automatically pushes to connected browsers
7. **Pusher Broadcast**: Redundant push via Pusher for reliability
8. **Email/Push**: Sends to additional channels as configured

## Scaling

- Horizontal scaling: Run multiple worker instances (RabbitMQ handles distribution)
- Prefetch tuning: Adjust `RABBITMQ_PREFETCH` for throughput vs memory
- Batch processing: Use HTTP batch API for bulk notifications
