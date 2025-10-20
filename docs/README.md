# Kori Photography Platform — Documentation

Welcome to the Kori documentation repository.

## 📁 Documentation Structure

### [Architecture Decision Records (ADRs)](./adr/)
Important architectural decisions with context and rationale.

### API Documentation
_(Coming soon)_ — API endpoints, authentication, and integration guides

### Database Schema
_(Coming soon)_ — Entity relationships and data models

### Deployment Guide
_(Coming soon)_ — Production deployment and operations

## 🚀 Quick Links

- **[ADR 001: Media Delivery Substrate](./adr/001-delivery-substrate.md)** — CDN vs self-hosted decision
- **Main README:** [../README.md](../README.md)
- **API README:** [../apps/api/README.md](../apps/api/README.md)
- **Web README:** [../apps/web/README.md](../apps/web/README.md)

## 📝 Contributing to Documentation

1. **ADRs** — Follow the format in existing ADRs
2. **API docs** — Use OpenAPI/Swagger specifications
3. **Guides** — Keep practical with code examples
4. **Diagrams** — Use Mermaid for consistency

## 🏗️ System Architecture Overview
```
┌─────────────────────────────────────────────────────┐
│                    Kori Platform                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │   Next.js    │ ◄────── │  Fastify API │         │
│  │  (React UI)  │  Auth   │  (Node.js)   │         │
│  └──────────────┘         └──────┬───────┘         │
│                                   │                  │
│  ┌──────────────────────────────┴─────────────┐    │
│  │         PostgreSQL Database                 │    │
│  │  - Users, Clients, Assets, Galleries        │    │
│  │  - Rights Presets, Releases, Audit Logs     │    │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         Filesystem Storage                    │   │
│  │  - uploads/RAW, uploads/EDIT, uploads/VIDEO  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 🔑 Key Concepts

### Asset Management
- **RAW files** — Original camera files (CR2, NEF, ARW)
- **EDIT files** — Processed images (JPEG, PNG, TIFF)
- **VIDEO files** — Video content (MP4, MOV)

### Rights Management
- **Rights Presets** — Copyright templates for metadata
- **Releases** — Model and property release tracking

### Public Galleries
- **Token-based access** — Shareable URLs with `/g/:token`
- **Password protection** — Optional gallery passwords
- **Expiry dates** — Time-limited gallery access

### Metadata Embedding
- **IPTC/XMP** — Standard metadata formats
- **ExifTool** — Metadata reading/writing engine
- **Batch processing** — CLI tool for mass updates

---

_For technical support, see the main [README.md](../README.md)_