# Private DOCK guestbook

The new section lives below the main canvas. A small guestbook hint sits in the welcome canvas without taking space from other features. It scrolls to the guestbook and disappears when a visitor starts exploring. Visitors draw with mouse, touch or pen, or use a typed name. Each confirmed submission produces a personal downloadable constellation and a short melody generated locally from the mark. It is a guestbook, not a legal electronic-signature service.

## Required production connection

Connect a durable Upstash Redis database to the DOCK Vercel project. Use a database owned by your account, not a temporary or expiring sandbox. Disable eviction for this database and configure backups according to your retention needs.

Set these **server environment variables** in Vercel for Production (and a separate database for Preview if you enable it):

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN` (the write-capable token)
- `SIGNATURE_ADMIN_TOKEN` (a new, random secret of at least 32 characters)

Existing Vercel Redis integrations using `KV_REST_API_URL` and `KV_REST_API_TOKEN` also work. Never prefix secrets with `VITE_`. Store the owner key in your password manager. Do not commit it or send it in chat.

Redeploy after setting the variables. The form stays unavailable until storage and owner access are configured; it never pretends that local browser storage is the shared database.

API format reference: https://upstash.com/docs/redis/features/restapi

## Owner access

At the bottom of the page, select **Owner access** and enter your owner key. The archive displays names, drawings, receipt numbers and dates, 20 entries per page. The key exists only in the open dialog's memory and is discarded on close. Rotate it in Vercel and redeploy if it is lost or shared.

The public API exposes only the count and confirmation receipts. It does not expose drawings or names. Server-side validation, JSON-only submissions, cross-site rejection and per-connection limits protect the write endpoint. Rate limits are basic abuse protection, not a replacement for a bot challenge if traffic warrants one.

## Data and persistence

The database holds the submitted name or alias, typed/drawn mode, normalized strokes, random receipt ID, timestamp and sequence number. Three Redis keys (`dock:signatures:records`, `dock:signatures:order`, `dock:signatures:count`) keep the private records, newest-first index and global count. The save operation is an atomic Lua script; retrying the same receipt ID does not increment the count twice. Records have no application-set expiry.

A visitor's browser keeps their own latest receipt and drawing for the constellation keepsake. Clearing browser data removes that local keepsake, but does not erase the server-side signature or shared count. No other visitor's records are downloaded publicly. Rate-limit keys contain hashed IP identifiers and expire within two hours.

## Checks completed before connection

- Unit tests for validation, archive authorization, public-response privacy, idempotent saves, count reads, rate limiting and unavailable storage.
- Browser checks with a simulated API for drawing, typed signatures, constellation rendering, refresh, owner login and mobile overflow.
- Production build and whitespace checks.

Still required after connecting production storage: submit a disposable test signature, refresh in a separate browser, confirm the shared count, verify it appears only in the owner archive, and verify anonymous archive requests are rejected. No production database was available during local verification.
