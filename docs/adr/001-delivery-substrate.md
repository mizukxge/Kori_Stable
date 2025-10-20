# ADR 001: Media Delivery Substrate Architecture

**Date:** 2025-10-20  
**Status:** Accepted  
**Deciders:** Development Team  
**Context Owner:** Kori Photography Platform

---

## Context

Kori is a photography workflow management platform handling large media files (RAW images, edited photos, videos) with the following requirements:

### Current State
- **Storage:** Local filesystem (`uploads/RAW`, `uploads/EDIT`, `uploads/VIDEO`)
- **Delivery:** Direct serve from Fastify API at `/uploads/*`
- **Scale:** Starting with single studio, potential multi-tenant expansion
- **File Sizes:** RAW (25-100MB), EDIT (5-50MB), VIDEO (100MB-5GB)
- **Access Patterns:** 
  - Admin uploads (high bandwidth, infrequent)
  - Public galleries (moderate bandwidth, sporadic)
  - Client downloads (high bandwidth, bursty)

### Decision Drivers
1. **Cost** — Bootstrap budget, pay-as-you-grow model
2. **Performance** — Fast delivery for client galleries
3. **Scalability** — Support growth from 1 to 100+ clients
4. **Simplicity** — Minimal operational complexity
5. **Security** — Signed URLs for private content
6. **Bandwidth** — Avoid egress costs spiraling out of control

---

## Options Considered

### Option 1: Self-Hosted Direct Serve (Current Implementation)
**Architecture:** Files stored locally, served directly by API

**Pros:**
- ✅ **Zero additional cost** — Uses existing server bandwidth
- ✅ **Simple implementation** — No external dependencies
- ✅ **Full control** — Complete ownership of delivery pipeline
- ✅ **Fast local access** — No network latency for same-region requests
- ✅ **Easy development** — Local testing without cloud credentials

**Cons:**
- ❌ **Limited bandwidth** — Server egress caps
- ❌ **No geographic distribution** — Single origin location
- ❌ **Server resource drain** — API serves large files
- ❌ **No caching layer** — Every request hits origin
- ❌ **Scaling bottleneck** — Vertical scaling only
- ❌ **Backup complexity** — Must handle file backups separately

**Cost:** $0 + server bandwidth (typically $0.01-0.10/GB egress)

---

### Option 2: Object Storage + CDN (Cloudflare R2 + CDN)
**Architecture:** S3-compatible object storage with CDN distribution

**Pros:**
- ✅ **Zero egress fees** — R2 doesn't charge for bandwidth
- ✅ **Global CDN** — Cloudflare's edge network
- ✅ **Scalable storage** — Unlimited capacity
- ✅ **Reliable** — 99.9% uptime SLA
- ✅ **Signed URLs** — Secure private access
- ✅ **Image transformations** — On-the-fly resize/optimization

**Cons:**
- ❌ **Storage costs** — $0.015/GB/month
- ❌ **Operation costs** — $4.50 per million Class A operations
- ❌ **Complexity** — Requires credential management
- ❌ **Migration effort** — Code changes for upload/access
- ❌ **Vendor lock-in** — (though S3 API is standard)

**Cost Estimate (100GB, 1TB egress/month):**
- Storage: 100GB × $0.015 = **$1.50/month**
- Operations: ~1M × $4.50/M = **$4.50/month**
- Egress: **$0** (R2 zero egress)
- **Total: ~$6/month**

---

### Option 3: AWS S3 + CloudFront
**Architecture:** Industry-standard object storage with CDN

**Pros:**
- ✅ **Enterprise-grade** — Proven at massive scale
- ✅ **Rich ecosystem** — Extensive tooling and integrations
- ✅ **Glacier archival** — Cost-effective long-term storage
- ✅ **Lambda@Edge** — Custom processing at edge
- ✅ **Compliance** — SOC2, HIPAA certifications

**Cons:**
- ❌ **Egress costs** — $0.09/GB from S3 to internet
- ❌ **Complex pricing** — Multiple cost components
- ❌ **Higher base cost** — CloudFront minimums
- ❌ **Configuration complexity** — Many knobs to tune

**Cost Estimate (100GB, 1TB egress/month):**
- S3 storage: 100GB × $0.023 = **$2.30/month**
- S3 requests: ~1M × $0.0004/1000 = **$0.40/month**
- CloudFront egress: 1000GB × $0.085 = **$85/month**
- **Total: ~$88/month**

---

### Option 4: Specialized Media CDN (Cloudinary, ImageKit, imgix)
**Architecture:** Purpose-built media delivery with transformations

**Pros:**
- ✅ **Zero-config transforms** — Resize, crop, format on URL
- ✅ **Smart optimization** — Auto WebP/AVIF conversion
- ✅ **DAM features** — Built-in asset management
- ✅ **Fast time-to-market** — Minimal integration effort
- ✅ **AI features** — Auto-tagging, background removal

**Cons:**
- ❌ **High cost** — Premium pricing for features
- ❌ **Limited flexibility** — Opinionated workflows
- ❌ **Vendor lock-in** — Proprietary APIs
- ❌ **Unnecessary features** — We already have DAM logic

**Cost Estimate (100GB, 1TB bandwidth/month):**
- Cloudinary: **$99-249/month** (Pro plan)
- ImageKit: **$49-149/month**
- imgix: **$99-299/month**

---

### Option 5: Hybrid Approach
**Architecture:** Local for admin/upload, CDN for public delivery

**Pros:**
- ✅ **Optimized costs** — CDN only for public galleries
- ✅ **Fast uploads** — Direct to local storage
- ✅ **Gradual migration** — Adopt CDN incrementally
- ✅ **Best of both** — Simple admin, fast public

**Cons:**
- ❌ **Dual complexity** — Two delivery paths
- ❌ **Sync overhead** — Keep local and CDN in sync
- ❌ **Split brain** — Different behaviors per route

---

## Decision

**Phase 1 (Current): Self-Hosted Direct Serve**  
Continue with local filesystem storage and direct API delivery for MVP validation.

**Rationale:**
- Allows rapid iteration without external dependencies
- Zero additional cost during product validation
- Sufficient performance for single studio use case
- Simplifies development and testing

**Phase 2 (Future): Migrate to Cloudflare R2 + CDN**  
Once product-market fit is established and usage scales beyond single server capacity.

**Migration Triggers:**
1. Monthly bandwidth exceeds 500GB
2. Client count exceeds 20 active clients
3. Geographic distribution becomes a requirement
4. Server resources are constrained by file serving

**Rationale for R2:**
- **Zero egress fees** are game-changing for media delivery
- S3-compatible API enables easy migration
- Cloudflare CDN included with no additional configuration
- Storage costs are competitive ($0.015/GB vs AWS $0.023/GB)
- Linear, predictable pricing without surprise bandwidth bills

---

## Consequences

### Positive
- ✅ **Low initial cost** — No CDN expenses during validation
- ✅ **Simple architecture** — Single codebase, one storage layer
- ✅ **Fast development** — No credentials or external service setup
- ✅ **Clear migration path** — Well-defined triggers and process

### Negative
- ❌ **Limited scale** — Must migrate before hitting server limits
- ❌ **No geographic distribution** — All clients served from origin
- ❌ **Manual backups** — No automatic replication
- ❌ **Future refactor needed** — Upload/access code must change

### Neutral
- 🔄 **Technical debt intentional** — Accept limitations for speed
- 🔄 **Monitoring required** — Must track bandwidth to trigger migration
- 🔄 **Migration complexity** — ~2-4 weeks engineering effort estimated

---

## Migration Plan (Future)

### Step 1: Add R2 Integration
- Install AWS SDK v3 for S3-compatible operations
- Add R2 credentials to environment configuration
- Create upload service abstraction layer

### Step 2: Dual-Write Period
- Upload to both local and R2 simultaneously
- Serve from local, verify R2 consistency
- Monitor for any issues

### Step 3: Switch Reads
- Update asset service to generate R2 signed URLs
- Public galleries fetch from CDN
- Admin still uses local for uploads

### Step 4: Backfill Historical Assets
- Script to upload existing local files to R2
- Verify checksums match
- Update database with R2 paths

### Step 5: Deprecate Local Delivery
- Archive local files as backup
- Serve all assets from R2/CDN
- Remove direct file serving routes

**Estimated Migration Time:** 2-4 weeks  
**Estimated Cost Impact:** +$10-50/month depending on usage

---

## Implementation Notes

### Current Implementation Requirements
```typescript
// No changes needed - current direct serve continues
app.get('/uploads/*', async (request, reply) => {
  reply.sendFile(filepath);
});
```

### Future R2 Implementation Pseudocode
```typescript
// Upload to R2
const uploadToR2 = async (file: Buffer, key: string) => {
  await s3Client.putObject({
    Bucket: 'kori-assets',
    Key: key,
    Body: file,
    ContentType: mimeType,
  });
};

// Generate signed URL for private access
const getSignedUrl = async (key: string, expiresIn = 3600) => {
  return await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: 'kori-assets',
    Key: key,
  }), { expiresIn });
};

// Public CDN URL for galleries
const getPublicUrl = (key: string) => {
  return `https://cdn.kori.example/${key}`;
};
```

---

## Monitoring & Metrics

Track these metrics to inform migration timing:

| Metric | Warning Threshold | Critical Threshold |
|--------|------------------|-------------------|
| Monthly Egress | > 300GB | > 500GB |
| API CPU (file serving) | > 40% | > 60% |
| Active Clients | > 15 | > 25 |
| Gallery Views/Month | > 10,000 | > 25,000 |
| Average Response Time | > 800ms | > 1500ms |

---

## References

- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [Cloudinary Pricing](https://cloudinary.com/pricing)
- [S3-Compatible API Spec](https://docs.aws.amazon.com/AmazonS3/latest/API/)

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-20 | 1.0 | Initial decision: Self-hosted with R2 migration plan |