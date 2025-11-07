# Kori Solo Upgrade Plan

This document outlines the functional and user experience enhancements for Kori as a **solo creator platform** — designed for freelancers or individual professionals. Each section focuses on deepening utility, simplifying workflow, and polishing UX for single-user operation.

---

## 🧾 1. Proposals (Solo Workflow)

### 🔧 Functional Enhancements
- **Proposal Templates** – save common service bundles (e.g., “Wedding Full Day,” “Corporate Shoot”) to duplicate and tweak quickly.
- **Automatic Variables** – auto-fill client name, date, price, and expiry using placeholders (`{{client.name}}`, `{{date}}`).
- **Single-click Conversion** – once a client accepts, instantly generate a linked **Contract** and **Invoice** with shared metadata.
- **Smart Expiry & Reminders** – auto-expire old proposals and send a gentle follow-up reminder.
- **Cost breakdown summary** – quick toggle to show/hide detailed pricing when sharing proposals.

### 🎨 UX Improvements
- **Drag-and-drop block editor** – easily reorder text, images, and pricing sections.
- **Instant PDF preview** – view export in the same screen before sending.
- **Compact status view** – color-coded labels: “Draft,” “Sent,” “Viewed,” “Accepted.”
- **Client-facing readability** – add a “client preview mode” that hides editing controls.

---

## 📑 2. Contracts

### 🔧 Functional Enhancements
- **Personalized Clause Library** – store and reuse your standard legal sections.
- **Conditional Terms** – clauses that auto-show/hide depending on project type or service.
- **One-Click Signature** – simple client-side signature capture, automatic PDF generation, and stored hash for verification.
- **Expiry and Auto-Follow-up** – contracts not signed within X days trigger a single automated reminder.

### 🎨 UX Improvements
- **Guided signing flow** – highlight where to sign, then show a confirmation checkmark.
- **Visual timeline** – Sent → Viewed → Signed, with dates.
- **Branded PDF output** – include your logo, accent color, and digital stamp automatically.

---

## 💸 3. Invoices

### 🔧 Functional Enhancements
- **Quick Invoice Creation** – pull data from last contract or proposal in one click.
- **Auto-numbering** – incremented automatically for organization.
- **Stripe Integration** – collect card or wallet payments directly.
- **Payment Tracking** – “Paid,” “Partially Paid,” or “Overdue” statuses auto-update.
- **Recurring Invoices** – optional repeat billing for retainers or ongoing projects.

### 🎨 UX Improvements
- **Mini dashboard widget** – “Total outstanding / Paid this month.”
- **Progress bar** for invoice payment status.
- **Email-ready invoice previews** (copy or send link instantly).
- **Overdue alert banner** on dashboard.

---

## 👤 4. Client Management

### 🔧 Functional Enhancements
- **Client Profiles** – each with contact info, communication log, invoices, and galleries.
- **Client Notes** – quick scratchpad for private reminders (e.g., “prefers phone calls”).
- **Tags & Filters** – label clients (“Wedding,” “Corporate,” “VIP”).
- **Automatic History Timeline** – show when proposals, contracts, and invoices were last sent.

### 🎨 UX Improvements
- **Single unified view** – all client assets on one page: contracts, invoices, galleries, messages.
- **Profile header card** – display client name, photo/logo, and quick stats.
- **Quick-create buttons** – “+ Proposal,” “+ Invoice,” “+ Contract” right from client page.

---

## 🖼️ 5. Galleries / Proofing

### 🔧 Functional Enhancements
- **Auto-watermarking** – add watermark presets to protect images.
- **One-click “Send Gallery”** – generates an expiring public link for the client.
- **Favorites selection** – clients pick their favorites; you get the selection list automatically.
- **ZIP export** – bundle and download selected files as a single archive.
- **Access logs** – view when and how often a client viewed the gallery.

### 🎨 UX Improvements
- **Grid & slideshow views** with fast loading.
- **Selection progress bar** (“12/30 favorites chosen”).
- **Clean minimal theme** with subtle hover icons (heart, download, share).
- **Instant feedback animation** on client selections (“✓ Saved!”).

---

## ⚙️ 6. Settings

### 🔧 Functional Enhancements
- **Business Info** – name, logo, contact details auto-inserted into docs.
- **Email Templates** – edit text for “Proposal Sent,” “Invoice Reminder,” etc.
- **Payment Settings** – connect Stripe, choose currency, set default tax rate.
- **Data Backup/Export** – backup all data (JSON/CSV) for peace of mind.

### 🎨 UX Improvements
- **Simple category layout** (“Business Info,” “Finance,” “Documents,” “Notifications”).
- **Instant feedback** (✓ Save confirmation animation).
- **Auto-preview** for branded colors and email headers.

---

## 💬 7. Messaging / Notifications

### 🔧 Functional Enhancements
- **Single message thread per client** – everything in one conversation log.
- **Automated reminders** – “Payment due,” “Contract not signed,” etc.
- **Smart templates** – quick-insert predefined responses.
- **In-app + Email sync** – messages from clients appear both in Kori and in your inbox.

### 🎨 UX Improvements
- **Floating mini chat window** accessible anywhere in the app.
- **Read receipts** and message timestamps.
- **Modern bubble layout** (your messages on the right, client’s on the left).
- **Attachment previews** for images and PDFs.

---

## 🔒 8. Security / Backup

### 🔧 Functional Enhancements
- **2FA toggle** for your account.
- **Automatic encrypted local backups** (once a week).
- **Activity log** – track your own major actions (deletes, edits).
- **Data export** – backup all your records to a downloadable file.

### 🎨 UX Improvements
- **Backup reminders** on dashboard (“Last backup: 5 days ago”).
- **Visual indicator** for data safety (“Everything synced and secure ✓”).

---

## 📊 9. Dashboard & Analytics

### 🔧 Functional Enhancements
- **At-a-glance insights** – income this month, outstanding invoices, signed contracts.
- **Client engagement** – see which proposals were viewed but not accepted.
- **Top services** – revenue by service category.
- **Simple time tracking** (optional) – record hours per project for personal reporting.

### 🎨 UX Improvements
- **Clean, minimal dashboard cards** with color-coded metrics.
- **Mini timeline feed** (“Contract signed,” “Invoice paid,” etc.).
- **Graph toggle** – switch between weekly, monthly, or yearly views.

---

## ⚙️ 10. Workflow Automation (Solo-friendly)

### 🔧 Functional Enhancements
- **Trigger-based actions (no-code):**
  - When proposal accepted → auto-create contract.
  - When contract signed → auto-generate invoice.
  - When invoice overdue → send reminder email.
- **Task reminders** (“Follow up with client tomorrow”).
- **Custom sequences** – chain actions together manually in a “Workflow Builder.”

### 🎨 UX Improvements
- **Visual timeline** of each project’s progress (Proposal → Contract → Payment → Gallery).
- **Progress badges** (“3/4 project steps complete”).
- **Small automation switch toggles** (“Auto reminders ON”).

---

## 🪄 11. General UX Enhancements

- **Global search bar (Ctrl+K)** for quick navigation.
- **Autosave drafts everywhere** (no “Save” button anxiety).
- **Quick actions panel** (floating plus button for “New Invoice,” “New Proposal,” etc.).
- **Keyboard shortcuts** (N = new, / = search, R = refresh dashboard).
- **Onboarding checklist** for new users (e.g., “Set up Stripe → Create first proposal → Add client”).
- **Dark mode toggle** for creative environments.

---

## 🌟 Focused Upgrade Phases (Solo Priorities)

| Phase | Focus | Goal |
|-------|--------|------|
| **Phase 1: Client Workflow** | Proposals → Contracts → Invoices chain | Seamless project pipeline from offer to payment |
| **Phase 2: Delivery Experience** | Galleries + Messaging | Polished, client-friendly delivery and communication |
| **Phase 3: Automation** | Reminders + Triggers | Save admin time and maintain follow-up consistency |
| **Phase 4: Insight & Stability** | Dashboard + Backups | Business visibility and reliability for long-term use |

---

**Author:** Mizu  
**Purpose:** Kori Solo Edition Upgrade Plan  
**Format:** Markdown (.md)
