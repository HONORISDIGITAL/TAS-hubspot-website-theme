# Serverless functions

Required secrets in HubSpot:
- YOCO_SECRET_KEY
- YOCO_CHECKOUT_URL
- HUBSPOT_ACCESS_TOKEN
- YOCO_WEBHOOK_SECRET

Security note:
- Do not store keys in this repo or in function source files.
- Configure secrets in HubSpot serverless settings for the portal.

CLI commands:
- hs secrets add YOCO_SECRET_KEY
- hs secrets add YOCO_CHECKOUT_URL
- hs secrets add HUBSPOT_ACCESS_TOKEN
- hs secrets add YOCO_WEBHOOK_SECRET
- hs secrets list

Serverless config:
- serverless.json (in this folder) lists the required secrets and endpoints.

Functions:
- yoco-checkout.js
- yoco-get-application-status.js
- yoco-webhook.js

Flow notes:
- `yoco-checkout.js` accepts `applicationId`, waits for `2-195685154.application_id` to exist, creates a checkout, and updates the application with `yoko_payment_status = awaiting` and `yoko_payment_id = <checkoutId>`.
- `yoco-get-application-status.js` reads by unique `application_id` and returns whether the application exists plus `yoko_payment_status`.
- `yoco-webhook.js` is the source of truth for payment status and updates the application based on Yoco events (with signature verification if `YOCO_WEBHOOK_SECRET` is set). It retries lookup, then creates a HubSpot note if no application is found.

Security notes:
- Treat query params (success/failure redirects) as untrusted. Use a Yoco webhook to confirm payment before marking `payment_status = succeeded`.
- Keep `payment_status = awaiting` when generating the payment link and only move to `succeeded` after webhook verification.
- Never expose `HUBSPOT_ACCESS_TOKEN` or Yoco keys in client-side code. All updates to HubSpot must go through serverless functions.
