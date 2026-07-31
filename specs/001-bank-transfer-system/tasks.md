---

description: "Task list for Bank Transfer Management System implementation"
---

# Tasks: Bank Transfer Management System

**Input**: Design documents from `/specs/001-bank-transfer-system/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Tests are NOT included in this task list (not explicitly requested in specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `apps/web/src/`
- **Backend**: `apps/api/src/`
- **Shared**: `packages/shared/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Configure Prisma ORM in apps/api with PostgreSQL connection in apps/api/prisma/schema.prisma
- [ ] T002 [P] Install Next.js dependencies for apps/web in apps/web/package.json
- [ ] T003 [P] Install Next.js API dependencies for apps/api in apps/api/package.json
- [ ] T004 [P] Install shadcn/ui and TailwindCSS in apps/web
- [ ] T005 [P] Configure shared TypeScript types in packages/shared/types/index.ts
- [ ] T006 [P] Setup environment configuration in apps/api/.env.example
- [ ] T007 [P] Setup environment configuration in apps/web/.env.example
- [ ] T008 Configure turbo.json for monorepo build pipeline in turbo.json
- [ ] T009 [P] Configure Biome for linting in biome.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create Prisma schema with User, Transfer, Bank, Currency models in apps/api/prisma/schema.prisma
- [ ] T011 Generate and run initial Prisma migration in apps/api/prisma/migrations/
- [ ] T012 [P] Implement JWT authentication middleware in apps/api/src/middleware/auth.ts
- [ ] T013 [P] Implement bcrypt password hashing utility in apps/api/src/lib/password.ts
- [ ] T014 [P] Setup API route structure in apps/api/src/routes/
- [ ] T015 [P] Configure error handling middleware in apps/api/src/middleware/error.ts
- [ ] T016 [P] Implement rate limiting middleware in apps/api/src/middleware/rate-limit.ts
- [ ] T017 [P] Create shared TypeScript types for API requests/responses in packages/shared/types/api.ts
- [ ] T018 [P] Implement IBAN validation utility in apps/api/src/lib/iban.ts
- [ ] T019 Seed Bank and Currency reference data in apps/api/prisma/seed.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Authentication and Account Management (Priority: P1) 🎯 MVP

**Goal**: Users can register, login, and manage their personal accounts securely

**Independent Test**: Register a new user, login with credentials, update profile, and logout - all authentication flows work end-to-end

### Implementation for User Story 1

- [ ] T020 [P] [US1] Create User Prisma model in apps/api/prisma/schema.prisma
- [ ] T021 [US1] Implement AuthService with registration and login logic in apps/api/src/services/auth.service.ts
- [ ] T022 [US1] Implement JWT token generation and validation in apps/api/src/services/token.service.ts
- [ ] T023 [P] [US1] Create POST /api/v1/auth/register endpoint in apps/api/src/routes/auth/register.ts
- [ ] T024 [P] [US1] Create POST /api/v1/auth/login endpoint in apps/api/src/routes/auth/login.ts
- [ ] T025 [P] [US1] Create POST /api/v1/auth/refresh endpoint in apps/api/src/routes/auth/refresh.ts
- [ ] T026 [P] [US1] Create POST /api/v1/auth/logout endpoint in apps/api/src/routes/auth/logout.ts
- [ ] T027 [P] [US1] Create POST /api/v1/auth/reset-password endpoint in apps/api/src/routes/auth/reset-password.ts
- [ ] T028 [P] [US1] Create POST /api/v1/auth/confirm-reset endpoint in apps/api/src/routes/auth/confirm-reset.ts
- [ ] T029 [US1] Create GET /api/v1/users/me endpoint in apps/api/src/routes/users/me.ts
- [ ] T030 [US1] Create PUT /api/v1/users/me endpoint in apps/api/src/routes/users/update.ts
- [ ] T031 [US1] Create PUT /api/v1/users/me/password endpoint in apps/api/src/routes/users/password.ts
- [ ] T032 [P] [US1] Create registration form component in apps/web/src/components/auth/register-form.tsx
- [ ] T033 [P] [US1] Create login form component in apps/web/src/components/auth/login-form.tsx
- [ ] T034 [P] [US1] Create profile page in apps/web/src/pages/profile.tsx
- [ ] T035 [US1] Implement authentication context in apps/web/src/contexts/auth-context.tsx
- [ ] T036 [US1] Create auth API client service in apps/web/src/services/auth.service.ts
- [ ] T037 [US1] Add authentication middleware to frontend in apps/web/src/middleware/auth.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Create and Initiate Bank Transfers (Priority: P1) 🎯 MVP

**Goal**: Users can create new bank transfer requests with validation

**Independent Test**: Create a transfer with valid data, verify validation errors for invalid data, confirm transfer appears in history with "Initiated" status

### Implementation for User Story 2

- [ ] T038 [P] [US2] Create Transfer Prisma model in apps/api/prisma/schema.prisma
- [ ] T039 [US2] Implement TransferService with creation logic in apps/api/src/services/transfer.service.ts
- [ ] T040 [US2] Create POST /api/v1/transfers endpoint in apps/api/src/routes/transfers/create.ts
- [ ] T041 [US2] Create GET /api/v1/transfers/:id endpoint in apps/api/src/routes/transfers/get.ts
- [ ] T042 [P] [US2] Create transfer form component in apps/web/src/components/transfers/transfer-form.tsx
- [ ] T043 [P] [US2] Create beneficiary input component in apps/web/src/components/transfers/beneficiary-input.tsx
- [ ] T044 [P] [US2] Create IBAN input with validation in apps/web/src/components/transfers/iban-input.tsx
- [ ] T045 [P] [US2] Create amount input component in apps/web/src/components/transfers/amount-input.tsx
- [ ] T046 [US2] Create new transfer page in apps/web/src/pages/transfers/new.tsx
- [ ] T047 [US2] Implement transfer API client service in apps/web/src/services/transfer.service.ts
- [ ] T048 [US2] Add real-time validation to transfer form in apps/web/src/components/transfers/transfer-form.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - View Transfer History with Filtering (Priority: P1) 🎯 MVP

**Goal**: Users can view and filter their complete transfer history

**Independent Test**: Create multiple transfers, then search/filter by various criteria (date, status, bank, amount) - all filters work correctly

### Implementation for User Story 3

- [ ] T049 [US3] Implement filtering logic in TransferService in apps/api/src/services/transfer.service.ts
- [ ] T050 [US3] Create GET /api/v1/transfers endpoint with filters in apps/api/src/routes/transfers/list.ts
- [ ] T051 [P] [US3] Create transfer list component in apps/web/src/components/transfers/transfer-list.tsx
- [ ] T052 [P] [US3] Create transfer card component in apps/web/src/components/transfers/transfer-card.tsx
- [ ] T053 [P] [US3] Create filter panel component in apps/web/src/components/transfers/filter-panel.tsx
- [ ] T054 [P] [US3] Create status filter component in apps/web/src/components/transfers/status-filter.tsx
- [ ] T055 [P] [US3] Create date range filter component in apps/web/src/components/transfers/date-filter.tsx
- [ ] T056 [P] [US3] Create bank filter component in apps/web/src/components/transfers/bank-filter.tsx
- [ ] T057 [P] [US3] Create currency filter component in apps/web/src/components/transfers/currency-filter.tsx
- [ ] T058 [P] [US3] Create search input component in apps/web/src/components/transfers/search-input.tsx
- [ ] T059 [US3] Create pagination component in apps/web/src/components/transfers/pagination.tsx
- [ ] T060 [US3] Create transfer history page in apps/web/src/pages/transfers/history.tsx
- [ ] T061 [US3] Implement IBAN masking utility in apps/api/src/lib/iban.ts
- [ ] T062 [US3] Add IBAN masking to transfer list responses in apps/api/src/services/transfer.service.ts

**Checkpoint**: All P1 user stories should now be independently functional

---

## Phase 6: User Story 4 - Generate PDF Documents (Priority: P2)

**Goal**: Users can generate and download PDF documents for transfers

**Independent Test**: Generate PDFs for initiated and rejected transfers, verify they contain correct information and are downloadable

### Implementation for User Story 4

- [ ] T063 [P] [US4] Install PDF generation library (jsPDF or Puppeteer) in apps/api/package.json
- [ ] T064 [US4] Implement PDF generation service in apps/api/src/lib/pdf.service.ts
- [ ] T065 [US4] Create PDF template for initiation in apps/api/src/lib/templates/initiation-pdf.ts
- [ ] T066 [US4] Create PDF template for rejection in apps/api/src/lib/templates/rejection-pdf.ts
- [ ] T067 [P] [US4] Create GET /api/v1/transfers/:id/pdf/initiation endpoint in apps/api/src/routes/transfers/pdf-initiation.ts
- [ ] T068 [P] [US4] Create GET /api/v1/transfers/:id/pdf/rejection endpoint in apps/api/src/routes/transfers/pdf-rejection.ts
- [ ] T069 [P] [US4] Add PDF download button to transfer card in apps/web/src/components/transfers/transfer-card.tsx
- [ ] T070 [US4] Implement PDF download handling in frontend in apps/web/src/services/transfer.service.ts

**Checkpoint**: User Story 4 should be independently functional

---

## Phase 7: User Story 5 - Transfer Status Management (Priority: P2)

**Goal**: Users can reject initiated transfers and reset rejected transfers

**Independent Test**: Reject an initiated transfer, verify status change, optionally reset it back - status management works correctly

### Implementation for User Story 5

- [ ] T071 [US5] Implement status update logic in TransferService in apps/api/src/services/transfer.service.ts
- [ ] T072 [P] [US5] Create PUT /api/v1/transfers/:id/reject endpoint in apps/api/src/routes/transfers/reject.ts
- [ ] T073 [P] [US5] Create PUT /api/v1/transfers/:id/reset endpoint in apps/api/src/routes/transfers/reset.ts
- [ ] T074 [P] [US5] Add reject button to transfer card in apps/web/src/components/transfers/transfer-card.tsx
- [ ] T075 [P] [US5] Add reset button to transfer card in apps/web/src/components/transfers/transfer-card.tsx
- [ ] T076 [P] [US5] Create rejection reason dialog in apps/web/src/components/transfers/rejection-dialog.tsx
- [ ] T077 [US5] Implement status update handling in frontend in apps/web/src/services/transfer.service.ts

**Checkpoint**: User Story 5 should be independently functional

---

## Phase 8: User Story 6 - Statistics and Analytics Dashboard (Priority: P3)

**Goal**: Users can view visual statistics and analytics about their transfers

**Independent Test**: Create transfers with various attributes, view statistics to verify charts and data accuracy

### Implementation for User Story 6

- [ ] T078 [P] [US6] Install charting library (Recharts or Chart.js) in apps/web/package.json
- [ ] T079 [US6] Implement StatisticsService with aggregation logic in apps/api/src/services/statistics.service.ts
- [ ] T080 [US6] Create GET /api/v1/dashboard endpoint in apps/api/src/routes/dashboard/index.ts
- [ ] T081 [US6] Create GET /api/v1/statistics endpoint in apps/api/src/routes/statistics/index.ts
- [ ] T082 [P] [US6] Create dashboard page in apps/web/src/pages/dashboard.tsx
- [ ] T083 [P] [US6] Create statistics cards component in apps/web/src/components/dashboard/statistics-cards.tsx
- [ ] T084 [P] [US6] Create recent transfers component in apps/web/src/components/dashboard/dashboard-recent.tsx
- [ T085 [P] [US6] Create statistics page in apps/web/src/pages/statistics.tsx
- [ ] T086 [P] [US6] Create monthly chart component in apps/web/src/components/statistics/monthly-chart.tsx
- [ ] T087 [P] [US6] Create status distribution chart in apps/web/src/components/statistics/status-chart.tsx
- [ ] T088 [P] [US6] Create bank distribution chart in apps/web/src/components/statistics/bank-chart.tsx
- [ ] T089 [P] [US6] Create currency distribution chart in apps/web/src/components/statistics/currency-chart.tsx
- [ ] T090 [US6] Create top beneficiaries table in apps/web/src/components/statistics/top-beneficiaries.tsx
- [ ] T091 [US6] Implement statistics API client service in apps/web/src/services/statistics.service.ts

**Checkpoint**: User Story 6 should be independently functional

---

## Phase 9: User Story 7 - Export Transfer Data (Priority: P3)

**Goal**: Users can export their transfer history in CSV, Excel, or PDF formats

**Independent Test**: Apply filters and export to each format, verify exported files contain correct data

### Implementation for User Story 7

- [ ] T092 [P] [US7] Install CSV generation library in apps/api/package.json
- [ ] T093 [P] [US7] Install Excel generation library in apps/api/package.json
- [ ] T094 [US7] Implement ExportService with CSV/Excel/PDF generation in apps/api/src/services/export.service.ts
- [ ] T095 [P] [US7] Create GET /api/v1/transfers/export/csv endpoint in apps/api/src/routes/transfers/export-csv.ts
- [ ] T096 [P] [US7] Create GET /api/v1/transfers/export/excel endpoint in apps/api/src/routes/transfers/export-excel.ts
- [ ] T097 [P] [US7] Create GET /api/v1/transfers/export/pdf endpoint in apps/api/src/routes/transfers/export-pdf.ts
- [ ] T098 [P] [US7] Add export buttons to filter panel in apps/web/src/components/transfers/filter-panel.tsx
- [ ] T099 [US7] Implement export handling in frontend in apps/web/src/services/transfer.service.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T100 [P] Create navigation component in apps/web/src/components/layout/navigation.tsx
- [ ] T101 [P] Create layout wrapper in apps/web/src/components/layout/layout.tsx
- [ ] T102 [P] Create quick action buttons component in apps/web/src/components/dashboard/quick-actions.tsx
- [ ] T103 [P] Implement loading states across all pages in apps/web/src/components/ui/loading.tsx
- [ ] T104 [P] Implement error boundaries in apps/web/src/components/error-boundary.tsx
- [ ] T105 [P] Add toast notifications in apps/web/src/components/ui/toast.tsx
- [ ] T106 [P] Implement responsive design for all components in apps/web/src/
- [ ] T107 Add French language support to UI in apps/web/src/
- [ ] T108 Implement dark mode toggle in apps/web/src/components/theme/theme-toggle.tsx
- [ ] T109 Create GET /api/v1/banks endpoint in apps/api/src/routes/banks/list.ts
- [ ] T110 Create GET /api/v1/currencies endpoint in apps/api/src/routes/currencies/list.ts
- [ ] T111 Run quickstart.md validation scenarios
- [ ] T112 Performance optimization for database queries
- [ ] T113 Security hardening and audit
- [ ] T114 Update README.md with setup and usage instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for authentication
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for authentication, US2 for transfer data
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US2 for transfer data
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on US2 for transfer data
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Depends on US2 and US3 for transfer data
- **User Story 7 (P3)**: Can start after Foundational (Phase 2) - Depends on US3 for transfer data and filters

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before UI components
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- Components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 2

```bash
# Launch all model creation together:
Task: "Create Transfer Prisma model in apps/api/prisma/schema.prisma"

# Launch all form components together:
Task: "Create transfer form component in apps/web/src/components/transfers/transfer-form.tsx"
Task: "Create beneficiary input component in apps/web/src/components/transfers/beneficiary-input.tsx"
Task: "Create IBAN input with validation in apps/web/src/components/transfers/iban-input.tsx"
Task: "Create amount input component in apps/web/src/components/transfers/amount-input.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (Create Transfers)
5. Complete Phase 5: User Story 3 (History with Filtering)
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP core!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo (Full MVP!)
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Add User Story 7 → Test independently → Deploy/Demo
9. Complete Polish phase → Final deployment

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Authentication)
   - Developer B: User Story 2 (Create Transfers)
   - Developer C: User Story 3 (History)
3. After P1 stories complete:
   - Developer A: User Story 4 (PDF)
   - Developer B: User Story 5 (Status Management)
   - Developer C: User Story 6 (Statistics)
4. Final phase: Polish together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP = User Stories 1-3 (Authentication, Create Transfers, History)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
