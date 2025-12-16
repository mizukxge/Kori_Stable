# TypeScript Type Check Error Checklist

## Summary
- Total Errors: ~40-50
- Files Affected: 12+
- Lint Status: ✅ PASSING
- Type Check Status: ❌ FAILING

---

## PRIORITY 1: FastifySchema Type Errors

### 1. proposalTemplates.ts (8+ errors)
- **Line 20**: `description` not in FastifySchema
  - [ ] Remove: `description: 'List all proposal templates',`
  - [ ] Location: First route schema object
  
- **Line 21**: `tags` not in FastifySchema  
  - [ ] Remove: `tags: ['Proposal Templates'],`
  - [ ] Check all route schemas in file and remove tags

- **Lines 67, 98, 145, 202, 233, 270**: Same FastifySchema errors
  - [ ] Systematically remove all `description:` and `tags:` from all schema objects

### 2. variables.ts (4+ errors)
- **Lines 16, 54, 89, 122, 195**: `tags` not in FastifySchema
  - [ ] Remove all `tags: ['Variables']` from schema objects
  - [ ] Affects multiple route handlers

---

## PRIORITY 2: SessionData Property Access Errors

All files accessing `request.user.id` should use `request.user.userId` instead.
SessionData interface has: `userId: string`, NOT `id: string`

### 3. proposalTemplates.ts (7+ errors)
- **Lines 49, 76, 121, 173, 205, 240, 272**: `request.user.id`
  - [ ] Change all `request.user.id` → `request.user.userId`
  - [ ] Change all `request.user?.id` → `request.user?.userId`
  - Already partially fixed, verify all instances

### 4. notifications.ts (1 error)
- **Line 26**: Expected 2-3 arguments but got 1
  - [ ] Check logger call signature - likely missing error argument
  - [ ] Pattern should be: `request.log.error(error, 'message')` not `request.log.error('message')`

---

## PRIORITY 3: JSON Type Casting Errors

These involve assigning Record<string, unknown> to Prisma JSON fields.

### 5. notifications.ts (2 errors)
- **Line 312**: `headers: data.headers` (Type 'Record<string, unknown>')
  - [ ] Add type cast: `headers: (data.headers as any)`
  
- **Line 354**: Similar JSON type issue
  - [ ] Add type cast: `(someValue as any)`

### 6. settings.ts (2 errors)
- **Line 104**: `features: data.features` (Type 'Record<string | number | symbol, unknown>')
  - [ ] Add type cast: `features: (data.features as any)`

---

## PRIORITY 4: Service Method Missing/Signature Errors

### 7. proposals.ts (1 error)
- **Line 474**: Property 'emailTemplateId' does not exist in UpdateProposalData
  - [ ] Remove or fix: `emailTemplateId: request.body.emailTemplateId,`
  - [ ] Check UpdateProposalData interface definition
  - [ ] Either add field to interface or remove from assignment

### 8. publicContract.ts (3 errors)
- **Lines 341, 343**: Property 'createdById' (should be 'createdBy')
  - [ ] Change: `contract.createdById` → `contract.createdBy`
  
- **Line 349**: Logger no overload matches (fastify.log.error)
  - [ ] Change: `fastify.log.error('...', error)` → `request.log.error(error, '...')`

### 9. publicGallery.ts (3 errors)
- **Line 141**: Logger error (fastify.log.error)
  - [ ] Fix logger signature

- **Line 181**: `getGalleryStyle` not in GalleryService
  - [ ] Check if method should be `getGalleryItems` or other existing method
  - [ ] Or implement missing method

- **Lines 211, 264**: `getViewerPreferences`, `updateViewerPreferences` don't exist
  - [ ] Check GalleryService implementation
  - [ ] Remove calls or implement missing methods

### 10. publicInvoice.ts (2 errors)
- **Line 99**: `generateForInvoice` not in OTPService
  - [ ] Check what method exists for generating OTP
  - [ ] Likely should be different method name

- **Line 161**: `markInvoiceAsPaid` not in InvoiceService
  - [ ] Check InvoiceService methods
  - [ ] May need different method name or implementation

- **Line 229**: `reply.sendFile()` signature error
  - [ ] Current: `reply.sendFile({ root: string })`
  - [ ] Fix to: `reply.sendFile(filename, rootPath)` (separate args, not object)

### 11. publicProposal.ts (2 errors)
- **Lines 308, 313**: `reply.sendFile()` signature errors
  - [ ] Same fix as publicInvoice.ts line 229
  - [ ] Change `reply.sendFile({ root: string })` to proper signature

---

## PRIORITY 5: Service Class Method Errors

### 12. contract.ts (1 error)
- **Line 623**: Comparison with 'DECLINED' (doesn't exist in enum)
  - [ ] Already partially fixed - change to 'VOIDED' or 'CANCELLED'
  - [ ] Verify fix was applied: `if (contract.status === 'VOIDED' || contract.status === 'CANCELLED')`

### 13. invoice.ts (1 error)
- **Line 263**: Property 'toFixed' doesn't exist on type 'never'
  - [ ] Issue: depositAmount is hardcoded as 0, type inference breaks
  - [ ] Add explicit type: `const depositAmount: number = 0;`
  - [ ] Or: `(depositAmount as number).toFixed(2)`

### 14. docgen.ts (1 error)
- **Line 181**: Rotation type missing 'type' property
  - [ ] Current: `rotate: { angle: 45, type: 'degrees' as any }`
  - [ ] Verify type cast is present

### 15. pdf-generator.ts (1 error)
- **Line 421**: Same rotation type error
  - [ ] Verify: `rotate: { angle: 45, type: 'degrees' as any }`

### 16. template.ts (1 error)
- **Line 198**: Type conversion from JsonArray to TemplateVariable[]
  - [ ] Add type cast: `(variables as unknown as TemplateVariable[])` or `(variables as any)`

---

## PRIORITY 6: rbac.ts Unused Imports (Lint Warnings)

### 17. rbac.ts (4 lint errors - already partially fixed)
- [ ] Verify unused imports removed:
  - ~~`FastifyRequest`~~
  - ~~`FastifyReply`~~
  - ~~`requirePermission`~~
  - ~~`requireRole`~~

- [ ] Check if schemas are used:
  - ~~`_assignRoleSchema`~~ (prefixed with underscore, OK if intentional)
  - ~~`_assignPermissionSchema`~~ (prefixed with underscore, OK if intentional)

---

## VERIFICATION CHECKLIST

After fixing, verify:
- [ ] All FastifySchema descriptions removed
- [ ] All FastifySchema tags removed
- [ ] All request.user.id changed to request.user.userId
- [ ] All JSON fields have `as any` casts where needed
- [ ] All service method calls use correct method names
- [ ] All reply.sendFile() calls use correct signature
- [ ] All logger calls follow pattern: `request.log.error(error, 'message')`
- [ ] Type casts for problematic types are in place

---

## Expected Result After Fixes

```
✅ Lint: PASSING
✅ Type Check: PASSING
✅ Build: PASSING
✅ Test: PASSING
```

Then CI will auto-deploy to Railway and login test can proceed.

