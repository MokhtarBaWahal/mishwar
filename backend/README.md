# Backend

This folder contains the runtime API used by the web app, demo flows, and Flutter clients.

## Current responsibilities

- ride creation and lifecycle transitions
- dispatch and driver assignment logic
- auth and role checks
- pricing and validation endpoints
- demo state storage and pilot-safe guardrails

## Production direction

Keep backend responsibilities centralized here and avoid spreading business rules across frontend apps. Use this folder as the source of truth for:

- ride state
- authorization
- pricing
- audits
- environment configuration

This helps keep the app teams aligned and prevents client-side tampering.
