# Works Management Module - Deployment & Testing Guide

## Deployment Checklist

### Pre-Deployment (Dev Environment)

#### 1. Code Quality
- [ ] Run TypeScript compiler: `pnpm exec tsc --noEmit`
- [ ] Run ESLint: `pnpm exec eslint actions/ app/ schema/`
- [ ] Run tests: `pnpm test`
- [ ] Check test coverage meets targets (70%+)
- [ ] Review commit history and PR for code quality

#### 2. Database
- [ ] Verify Prisma schema is up to date: `pnpm exec prisma validate`
- [ ] Generate Prisma client: `pnpm exec prisma generate`
- [ ] Run migrations: `pnpm exec prisma migrate dev`
- [ ] Verify all models are in database: `pnpm exec prisma db push`
- [ ] Check database indexes are created
- [ ] Verify foreign key relationships

#### 3. Configuration
- [ ] Verify environment variables are set (.env.local)
- [ ] Verify database connection string points to test DB
- [ ] Verify authentication service is accessible
- [ ] Verify S3/media storage is configured
- [ ] Verify API endpoints are accessible

#### 4. Documentation
- [ ] Update README with new features
- [ ] Document API changes
- [ ] Update deployment procedures
- [ ] Document configuration requirements

### Deployment (Staging/Production)

#### 1. Pre-Deployment Backup
```bash
# Backup current database
mysqldump -u root -p jansetu > backup_$(date +%Y%m%d_%H%M%S).sql

# Tag current version
git tag -a v1.1.0 -m "Works Management Module Release"
```

#### 2. Deploy Code
```bash
# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Build Next.js application
pnpm build

# Check for build errors
pnpm next lint
```

#### 3. Database Migration
```bash
# Run Prisma migrations
pnpm exec prisma migrate deploy

# If using manual SQL migrations:
mysql -u root -p jansetu < migrations/001_create_works_models.sql

# Verify schema
pnpm exec prisma db push --skip-generate
```

#### 4. Generate Client
```bash
# Generate updated Prisma client
pnpm exec prisma generate

# Verify types are generated
ls -la node_modules/.prisma/client/
```

#### 5. Start Application
```bash
# For development
pnpm dev

# For production
pnpm build
pnpm start
```

#### 6. Smoke Tests
- [ ] Application starts without errors
- [ ] MLA login page loads
- [ ] Works listing page loads (empty or with existing works)
- [ ] Create work form loads
- [ ] Dashboard loads with no errors
- [ ] Check browser console for JavaScript errors
- [ ] Check server logs for errors: `tail -f .next/logs/*`

#### 7. Database Verification
```bash
# Verify tables exist
mysql -u root -p jansetu -e "SHOW TABLES LIKE 'work%';"

# Expected output:
# work, work_task, work_media, work_update, ward

# Verify indexes
mysql -u root -p jansetu -e "SHOW INDEXES FROM work;"

# Verify row counts
mysql -u root -p jansetu -e "SELECT COUNT(*) FROM work;"
```

---

## End-to-End Testing Checklist

### Test Environment Setup
- [ ] Test database is running (MySQL)
- [ ] Application is deployed and running
- [ ] Test user account exists with MLA role
- [ ] Test departments exist in database
- [ ] Test wards exist in database
- [ ] Test officers exist in database

### 1. Authentication & Authorization

#### Test: Login and Access Control
```
Steps:
1. Open application
2. Login as MLA user
3. Navigate to /mla/works
Expected:
- Page loads successfully
- User can see works management interface
- Non-MLA users receive access denied message
```

#### Test: Role-Based Access
```
Steps:
1. Login as MLA user A
2. Create a work
3. Logout
4. Login as MLA user B
5. Navigate to works listing
Expected:
- MLA user B cannot see works created by MLA user A
- Works are filtered by current user
```

---

### 2. Create Work Workflow

#### Test: Create Work with All Fields
```
Steps:
1. Navigate to /mla/works/create
2. Fill in all required fields:
   - Title: "Build Community Center"
   - Description: "Construct a community center with multiple facilities"
   - Department: Select from dropdown
   - Ward: Select from dropdown
   - Priority: Set to 75
   - Estimated Budget: ₹500000
   - Start Date: Today
   - Target Completion: 30 days from today
   - Remarks: "This is a high priority community development project"
3. Submit form

Expected Results:
✓ Form validates all required fields
✓ Work is created with PROPOSED status
✓ User is redirected to work detail page
✓ All entered data is displayed correctly
✓ Audit log entry is created
✓ No errors in browser console
```

#### Test: Create Work with Minimal Fields
```
Steps:
1. Navigate to /mla/works/create
2. Fill in only required fields:
   - Title: "Pothole Repair"
   - Description: "Repair potholes on Main Street and surrounding areas"
   - Department: Select from dropdown
3. Submit form

Expected Results:
✓ Work is created successfully
✓ Optional fields have sensible defaults
✓ Priority defaults to 50
✓ Status is PROPOSED
```

#### Test: Create Work Validation
```
Steps:
1. Navigate to /mla/works/create
2. Try to submit with Title less than 5 characters
   Expected: Error message: "Title must be at least 5 characters"
3. Try to submit with Description less than 20 characters
   Expected: Error message: "Description must be at least 20 characters"
4. Try to submit without Department
   Expected: Error message: "Please select a department"
5. Try to submit with Priority > 100
   Expected: Error message or input rejected
```

---

### 3. List & Filter Works

#### Test: View Works List
```
Steps:
1. Navigate to /mla/works
2. Verify page loads with works table

Expected Results:
✓ Works are displayed in table format
✓ Table shows: Title, Department, Status, Priority, Progress, Actions
✓ Pagination controls are visible
✓ Create New Work button is visible
```

#### Test: Search Works
```
Steps:
1. On works listing page
2. Enter search text: "pothole"
3. Click Search button

Expected Results:
✓ Only works containing "pothole" are displayed
✓ Results update immediately
✓ Total count is updated
✓ Pagination resets to page 1
```

#### Test: Filter by Status
```
Steps:
1. On works listing page
2. Select Status filter: "IN_PROGRESS"
3. Click Apply Filters

Expected Results:
✓ Only IN_PROGRESS works are displayed
✓ Status tags show "In Progress"
✓ Total count reflects filtered results
```

#### Test: Filter by Department
```
Steps:
1. On works listing page
2. Select Department filter: "Public Works"
3. Click Apply Filters

Expected Results:
✓ Only works from Public Works department are displayed
✓ Department column shows "Public Works"
```

#### Test: Pagination
```
Steps:
1. On works listing page with > 20 works
2. Verify 20 items per page are shown
3. Click Next page button

Expected Results:
✓ Next 20 items are displayed
✓ Page number is updated
✓ Previous button is enabled
✓ Go to specific page input works
```

---

### 4. View Work Details

#### Test: Open Work Detail
```
Steps:
1. On works listing page
2. Click "View" button for a work
3. Work detail page opens

Expected Results:
✓ Work title is displayed at top
✓ Status tag is visible
✓ Work description is shown
✓ Department, Ward, Priority are displayed
✓ Budget information is shown
✓ Progress bar shows completion percentage
✓ Tabs for Tasks, Media, Activity Feed are visible
```

#### Test: View Work Tasks
```
Steps:
1. On work detail page
2. Click "Tasks" tab

Expected Results:
✓ Tasks are displayed in table
✓ Table shows: Sequence, Title, Officer, Status, Progress
✓ Each task has an action button
✓ Empty state message if no tasks
```

#### Test: View Work Media
```
Steps:
1. On work detail page with uploaded media
2. Click "Media & Evidence" tab

Expected Results:
✓ Media is organized by type (Before, Progress, After, Document)
✓ File names and upload information are visible
✓ Media dates are displayed
✓ Empty state message if no media
```

#### Test: View Activity Feed
```
Steps:
1. On work detail page
2. Click "Activity Feed" tab

Expected Results:
✓ Timeline shows all work changes
✓ Most recent activity is first
✓ Shows who made change and when
✓ Messages are clear and descriptive
```

---

### 5. Update Work Status

#### Test: Change Status from PROPOSED to APPROVED
```
Steps:
1. Create a new work (status = PROPOSED)
2. Open work detail page
3. Use status dropdown or button to select APPROVED
4. Confirm change

Expected Results:
✓ Status is updated to APPROVED
✓ Status tag color changes (processing → blue)
✓ Activity feed shows status change
✓ Audit log records the change
✓ No JavaScript errors
```

#### Test: Change Status from APPROVED to IN_PROGRESS
```
Steps:
1. Open a work with APPROVED status
2. Change status to IN_PROGRESS
3. Confirm change

Expected Results:
✓ Status is updated
✓ Activity feed shows the change
✓ Progress can now be updated
```

#### Test: Status Transition Validation
```
Steps:
1. Create work (status = PROPOSED)
2. Try to change directly to COMPLETED
Expected: Should be allowed or show appropriate error

3. Close the work completely
4. Try to change status back to PROPOSED
Expected: Error - Cannot transition from COMPLETED to PROPOSED
```

---

### 6. Update Work Progress

#### Test: Update Completion Percentage
```
Steps:
1. Open a work in progress
2. Update completion_percentage to 50%
3. Save changes

Expected Results:
✓ Progress bar updates to 50%
✓ Percentage is displayed correctly
✓ Activity feed shows update
```

#### Test: Update Work Budget
```
Steps:
1. Open a work with PROPOSED status
2. Update approved_budget to ₹600000
3. Save changes as budget approver

Expected Results:
✓ Budget is updated
✓ approved_by_user is set to current user
✓ approved_at timestamp is recorded
✓ Activity feed shows budget approval
```

---

### 7. Close Work

#### Test: Close Work Successfully
```
Steps:
1. Open a work with IN_PROGRESS status
2. Click "Close Work" button
3. Confirm in modal dialog

Expected Results:
✓ Confirmation dialog appears
✓ Work status changes to COMPLETED
✓ completion_percentage is set to 100%
✓ Activity feed shows closure
✓ If linked to complaint cluster, check complaint status updates
```

#### Test: Close Work Restriction
```
Steps:
1. Open a COMPLETED work
2. Try to close again

Expected Results:
✓ "Close Work" button is disabled or hidden
✓ Error message if attempted
```

---

### 8. Dashboard

#### Test: Load Dashboard
```
Steps:
1. Navigate to /mla/works/dashboard

Expected Results:
✓ Dashboard loads without errors
✓ Summary cards are visible with metrics
✓ All 4 charts render correctly
✓ Tables have data (if works exist)
```

#### Test: Dashboard Metrics
```
Steps:
1. Create several works with different statuses
2. View dashboard

Expected Results:
✓ Total Works count is correct
✓ In Progress count matches filtered works
✓ Completed count matches completed works
✓ Budget percentages are calculated correctly
✓ Department metrics show correct data
✓ Priority works show highest priority first
✓ Works due soon show correct dates
```

#### Test: Dashboard Performance
```
Steps:
1. Navigate to /mla/works/dashboard
2. Check browser Network tab
3. Check page load time

Expected Results:
✓ Dashboard loads within 2 seconds
✓ All dashboard queries complete < 500ms
✓ No N+1 query problems
✓ Charts render smoothly
```

---

### 9. Error Handling

#### Test: Handle Database Errors
```
Steps:
1. Stop database service
2. Try to create a work
3. Try to list works
4. Try to view work details

Expected Results:
✓ User-friendly error messages displayed
✓ No database error details exposed
✓ Logs show error details for debugging
```

#### Test: Handle Authorization Errors
```
Steps:
1. Login as user without Works Manager role
2. Try to navigate to /mla/works

Expected Results:
✓ Redirected to appropriate page (user dashboard)
✓ No blank or error page
✓ Error message is clear
```

#### Test: Handle Invalid Data
```
Steps:
1. Try to access non-existent work ID
   Path: /mla/works/99999

Expected Results:
✓ Clear error message displayed
✓ Link to return to works list
✓ No server errors
```

---

### 10. Cross-Browser Testing

Test on the following browsers:

#### Chrome/Chromium
```
Steps:
1. Open https://localhost:3000/mla/works
2. Perform key workflows: Create, Update, List, View

Expected Results:
✓ All layouts render correctly
✓ Forms work properly
✓ Tables display well
✓ Charts render
```

#### Firefox
```
- Same testing as Chrome
```

#### Safari
```
- Same testing as Chrome
```

#### Mobile Browser (Chrome on Android/Safari on iOS)
```
Steps:
1. Open application on mobile device
2. Test responsive layouts
3. Test form input on mobile keyboard
4. Test table scrolling

Expected Results:
✓ Layout is responsive
✓ Forms are mobile-friendly
✓ Tables are scrollable
✓ Buttons are easily tappable
```

---

### 11. Performance Testing

#### Test: Large Dataset Handling
```
Steps:
1. Create 100+ works
2. Navigate to listing page
3. Apply various filters
4. Check load times

Expected Results:
✓ Listing page loads within 1 second
✓ Filters are applied quickly
✓ Pagination works smoothly
✓ No lag or freezing
```

#### Test: Dashboard Performance with Large Dataset
```
Steps:
1. With 100+ works in database
2. Navigate to dashboard

Expected Results:
✓ Dashboard loads within 2 seconds
✓ All metrics are calculated correctly
✓ Charts render without lag
```

---

### 12. Integration with Other Modules

#### Test: Integration with Complaints Module
```
Steps:
1. Navigate to complaints module
2. Convert complaint to work
3. Verify work is created with correct reference

Expected Results:
✓ Work is created with complaint_id set
✓ Work appears in works listing
✓ Complaint shows link to work
```

#### Test: Integration with User Roles
```
Steps:
1. Verify MLA_PA can see their MLA's works
2. Verify MLA_SECRETARY can see their MLA's works
3. Verify ADMIN can see all works

Expected Results:
✓ Role-based filtering works correctly
✓ Users see appropriate works for their role
```

---

## Regression Testing Checklist

After deploying updates, verify:

- [ ] All existing works are still accessible
- [ ] No data loss from previous works
- [ ] Existing status transitions still work
- [ ] Historical activity feed is preserved
- [ ] Budget data is intact
- [ ] All user roles have appropriate access
- [ ] Search and filters still work
- [ ] Dashboard metrics are accurate

---

## Post-Deployment Verification

```bash
# Check application logs
tail -f .next/logs/stderr.log
tail -f .next/logs/stdout.log

# Check database connection
pnpm exec prisma db execute --stdin <<< "SELECT 1"

# Verify Prisma client
ls -la node_modules/.prisma/client/

# Check deployed version
curl -s http://localhost:3000/api/health || echo "Health check endpoint not found"

# Test create work action
pnpm exec ts-node -e "import { createWorkAction } from '@/actions/mla/works'; console.log('Actions imported successfully')"
```

---

## Rollback Procedure

If issues are found after deployment:

```bash
# 1. Revert database migrations
pnpm exec prisma migrate resolve --rolled-back migrations/001_create_works_models

# 2. Restore database from backup
mysql -u root -p jansetu < backup_YYYYMMDD_HHMMSS.sql

# 3. Revert code
git checkout HEAD~1

# 4. Reinstall and rebuild
pnpm install
pnpm build

# 5. Restart application
pnpm start
```

---

## Monitoring & Maintenance

### Daily
- [ ] Check application logs for errors
- [ ] Verify database is running
- [ ] Check disk space

### Weekly
- [ ] Review database size
- [ ] Check for slow queries
- [ ] Verify backups are running

### Monthly
- [ ] Database maintenance (optimize, analyze)
- [ ] Update dependencies
- [ ] Review security patches
- [ ] Performance analysis

---

## Support

For deployment issues, check:
1. Application logs in `.next/logs/`
2. Database connection and permissions
3. Environment variables
4. Browser console for JavaScript errors
5. Network tab for failed API calls

Contact development team if issues persist.
