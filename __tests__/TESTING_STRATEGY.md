# Works Management Module - Testing Strategy

## Overview
This document outlines the comprehensive testing strategy for the Works Management Module. The module handles the creation, management, and tracking of development works assigned to constituencies.

## Testing Levels

### 1. Unit Tests
- **Location**: `__tests__/actions/mla/works/`
- **Files**: `validation.test.ts`, `authorization.test.ts`

#### Validation Schema Tests
Tests all Zod validation schemas used in the Works module:
- `createWorkValidationSchema`: Tests title/description/priority constraints
- `updateWorkValidationSchema`: Tests status transitions and numeric ranges
- `createTaskValidationSchema`: Tests task creation rules
- `updateTaskValidationSchema`: Tests task update rules

#### Authorization Tests
Tests role-based access control:
- `isWorksManagerRole()`: Verifies correct roles (MLA, MLA_PA, MLA_SECRETARY, ADMIN)
- `isBudgetApproverRole()`: Verifies budget approval roles
- `checkWorkAccess()`: Verifies record-level access control

### 2. Integration Tests
- **Location**: `__tests__/actions/mla/works/integration.test.ts`
- **Scope**: End-to-end workflow testing with real database

#### Test Scenarios

##### Complete Works Workflow
1. **Create Work**: Verify work creation with all fields, audit logging, and default status
2. **Update Work Status**: Verify status transitions follow business rules
3. **List Works**: Verify filtering, sorting, and pagination
4. **Get Details**: Verify all nested relationships are included
5. **Close Work**: Verify complaint status update when all works complete

##### Authorization & Access Control
1. **MLA Access**: Verify access to own works only
2. **Admin Access**: Verify full access across all works
3. **Budget Approval**: Verify authorization for budget updates

##### Business Rules
1. **Priority Validation**: Ensure 1-100 range
2. **Task Date Validation**: Ensure planned dates don't exceed work target date
3. **Completion Percentage**: Verify calculation from completed tasks
4. **Status Transitions**: Verify only valid transitions are allowed

##### Audit & Logging
1. **Audit Log Creation**: Verify logs for create/update/delete operations
2. **Activity Feed**: Verify all changes are recorded with correct order

##### Performance
1. **Dashboard Performance**: < 500ms for full dashboard load
2. **List Performance**: < 200ms for paginated lists with 500+ records

## Running Tests

### Prerequisites
```bash
# Install dependencies
pnpm install

# Install Jest if not already installed
pnpm add -D jest @types/jest ts-jest
```

### Jest Configuration
```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/__tests__"],
  "testMatch": ["**/__tests__/**/*.test.ts"],
  "collectCoverageFrom": [
    "actions/**/*.ts",
    "schema/**/*.ts",
    "!**/*.d.ts"
  ]
}
```

### Run All Tests
```bash
pnpm test
```

### Run Specific Test Suite
```bash
pnpm test -- validation.test.ts
pnpm test -- authorization.test.ts
pnpm test -- integration.test.ts
```

### Run Tests with Coverage
```bash
pnpm test -- --coverage
```

## Test Data Setup

For integration tests, the following test data is required:

### Departments
```
ID | Name
1  | Public Works
2  | Health & Sanitation
3  | Education
4  | Social Welfare
```

### Wards
```
ID | Name           | Constituency
1  | Ward 1         | Constituency A
2  | Ward 2         | Constituency A
3  | Ward 3         | Constituency B
```

### Officers
```
ID | Name      | Department | Mobile
1  | Officer A | 1          | 9876543210
2  | Officer B | 2          | 9876543211
3  | Officer C | 1          | 9876543212
```

### Test Users
```
Role           | ID      | Name
MLA            | mla-1   | MLA User 1
MLA            | mla-2   | MLA User 2
MLA_PA         | pa-1    | PA User 1
MLA_SECRETARY  | sec-1   | Secretary User 1
ADMIN          | admin-1 | Admin User
```

## Test Coverage Goals

| Component | Target Coverage |
|-----------|-----------------|
| Validation Schemas | 95% |
| Authorization | 90% |
| Action Functions | 85% |
| Business Rules | 90% |
| UI Components | 70% |

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test -- --coverage
      - run: pnpm exec tsc --noEmit
```

## Manual Testing Checklist

### Create Work Flow
- [ ] User navigates to /mla/works/create
- [ ] Form loads with department and ward dropdowns
- [ ] User fills required fields and submits
- [ ] Work is created with PROPOSED status
- [ ] User is redirected to work detail page
- [ ] Audit log entry is created

### Update Work Flow
- [ ] User views work detail page
- [ ] User updates status from PROPOSED to APPROVED
- [ ] Status change is validated
- [ ] Activity feed shows status change
- [ ] Audit log entry is created

### List Works Flow
- [ ] User navigates to /mla/works
- [ ] All works are displayed in table
- [ ] Search filter works
- [ ] Status filter works
- [ ] Pagination works correctly
- [ ] Sort by different columns works

### Dashboard Flow
- [ ] User navigates to /mla/works/dashboard
- [ ] Summary cards show correct counts
- [ ] Budget utilization percentage displays
- [ ] Charts render correctly
- [ ] Priority works list is populated
- [ ] Works due soon list shows correct deadline

### Close Work Flow
- [ ] User clicks "Close Work" button on detail page
- [ ] Confirmation modal appears
- [ ] User confirms closure
- [ ] Work status changes to COMPLETED
- [ ] All tasks marked as COMPLETED
- [ ] Linked complaint updated to RESOLVED
- [ ] Activity feed updated

## Known Issues & Limitations

1. **Database Setup**: Integration tests require MySQL test database
2. **Authentication Mock**: Tests mock authentication - real auth flow needs E2E tests
3. **File Upload**: Media upload tests skip actual S3 upload
4. **Concurrent Tests**: Tests should run sequentially to avoid transaction conflicts

## Future Improvements

1. Add E2E tests using Playwright/Cypress for UI workflows
2. Add performance benchmarks with actual large datasets
3. Add load testing for dashboard queries
4. Add stress testing for concurrent work updates
5. Add snapshot tests for API responses
