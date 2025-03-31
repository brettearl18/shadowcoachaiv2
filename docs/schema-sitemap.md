# Shadow Coach AI - Database Schema Sitemap

```
Organizations
├── id, name
├── adminIds[]
├── coachIds[]
└── settings
    ├── allowClientReassignment
    ├── maxClientsPerCoach
    └── defaultTemplates[]
            │
            ▼
┌─────────────────────────────────────────────┐
│                    Users                     │
├─────────────────────────────────────────────┤
│ Role: Admin                                 │
├─────────────────────────────────────────────┤
│ Role: Coach                                 │
│ ├── coachProfile                           │
│ │   ├── bio                               │
│ │   ├── specialties[]                     │
│ │   └── clientIds[] ──────────────┐       │
│ │                                 │       │
├─────────────────────────────────────────────┤
│ Role: Client                     │         │
│ └── clientProfile                │         │
│     ├── coachId ◄───────────────┘         │
│     ├── goals[]                           │
│     └── checkInSchedule                   │
│         ├── frequency                     │
│         └── nextCheckIn                   │
└─────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────┐
│                  Templates                   │
├─────────────────────────────────────────────┤
│ ├── categories[]                           │
│ │   ├── id                                │
│ │   ├── name                              │
│ │   └── order                             │
│ │                                         │
│ └── questions[]                           │
│     ├── id                                │
│     ├── categoryId                        │
│     ├── type                              │
│     └── metadata                          │
└─────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────┐
│                  Check-ins                   │
├─────────────────────────────────────────────┤
│ ├── clientId                               │
│ ├── coachId                                │
│ ├── templateId                             │
│ ├── status                                 │
│ ├── responses[]                            │
│ │   ├── questionId                        │
│ │   └── answer                            │
│ │                                         │
│ └── progressPhotos[]                      │
└─────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────┐     ┌─────────────────────┐
│    AI Summaries     │     │      Feedback       │
├─────────────────────┤     ├─────────────────────┤
│ ├── checkInId       │     │ ├── checkInId       │
│ ├── content         │     │ ├── content         │
│ │  ├── overview     │     │ ├── privateNotes    │
│ │  └── analysis     │     │ └── rating          │
│ └── adherenceScore  │     │                     │
└─────────────────────┘     └─────────────────────┘
            │                         │
            │                         │
            ▼                         ▼
┌─────────────────────────────────────────────┐
│               Notifications                  │
├─────────────────────────────────────────────┤
│ ├── userId                                  │
│ ├── type                                    │
│ ├── data                                    │
│ │   ├── checkInId                          │
│ │   ├── templateId                         │
│ │   └── achievementId                      │
│ └── read                                    │
└─────────────────────────────────────────────┘

Subcollections:
Users/{userId}/progress/
└── achievements and milestones

Key Relationships:
1. Organization ──┬── Admins
                 ├── Coaches
                 └── Clients

2. Coach ────────┬── Clients
                 └── Templates

3. Client ───────┬── Check-ins
                 ├── Progress
                 └── Notifications

4. Check-in ─────┬── AI Summary
                 ├── Feedback
                 └── Notifications
```

## Data Flow

1. **Organization Level**
   - Organizations contain Admins, Coaches, and default Templates
   - Admins manage Coaches and Templates
   - Coaches manage Clients and custom Templates

2. **Coach-Client Relationship**
   - Coaches are linked to multiple Clients
   - Clients are linked to one Coach
   - Both have access to relevant Templates

3. **Check-in Process**
   ```
   Template → Check-in → Responses → AI Summary
                     └─→ Feedback
                     └─→ Notifications
   ```

4. **Progress Tracking**
   ```
   Check-in → AI Summary → Progress Updates
          └─→ Achievements
          └─→ Notifications
   ```

## Query Patterns

1. **Coach Views**
   - List all clients
   - Filter check-ins by status
   - View AI summaries by client
   - Track client progress

2. **Client Views**
   - View assigned templates
   - Submit check-ins
   - Track personal progress
   - View coach feedback

3. **Admin Views**
   - Manage organization settings
   - Monitor coach performance
   - Track overall engagement
   - Manage templates 