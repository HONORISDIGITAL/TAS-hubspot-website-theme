const crypto = require('crypto');

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const YOCO_WEBHOOK_SECRET = process.env.YOCO_WEBHOOK_SECRET;
const YOCO_WEBHOOK_SIGNATURE_HEADER = process.env.YOCO_WEBHOOK_SIGNATURE_HEADER || 'webhook-signature';
const YOCO_ALLOW_UNSIGNED_WEBHOOKS = (process.env.YOCO_ALLOW_UNSIGNED_WEBHOOKS || 'true').toString().trim().toLowerCase() !== 'false';
const YOCO_TEST_FORCE_STATUS = (process.env.YOCO_TEST_FORCE_STATUS || '').toString().trim().toLowerCase();
const APPLICATION_OBJECT_RAW = (process.env.HUBSPOT_APPLICATION_OBJECT_TYPE || '').toString().trim();
const APPLICATION_OBJECT = /^\d-\d+$/.test(APPLICATION_OBJECT_RAW) ? APPLICATION_OBJECT_RAW : '2-195685154';
const APPLICATION_ID_PROPERTY = 'application_id';
const PAYMENT_STATUS_PROPERTY = 'yoko_payment_status';
const PAYMENT_ID_PROPERTY = 'yoko_payment_id';
const WEBHOOK_LOOKUP_MAX_ATTEMPTS = Number(process.env.WEBHOOK_LOOKUP_MAX_ATTEMPTS || 8);
const WEBHOOK_LOOKUP_DELAY_MS = Number(process.env.WEBHOOK_LOOKUP_DELAY_MS || 1500);

const logEvent = (code, context = {}) => {
  try {
    console.error(`[yoco-webhook][${code}]`, JSON.stringify(context));
  } catch {
    console.error(`[yoco-webhook][${code}]`, context);
  }
};

const withCors = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
  body,
});

const hubspotRequest = async (path, method, body) => {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'HubSpot request failed.');
  }

  return res.json();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const timingSafeEqual = (a, b) => {
  if (!a || !b) return false;
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const verifySignature = (rawBody, signatureHeader) => {
  if (!YOCO_WEBHOOK_SECRET) return true;
  if (!signatureHeader) return YOCO_ALLOW_UNSIGNED_WEBHOOKS;

  const provided = signatureHeader.includes('=')
    ? signatureHeader.split('=')[1].trim()
    : signatureHeader.trim();
  const computed = crypto
    .createHmac('sha256', YOCO_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  return timingSafeEqual(computed, provided);
};

const normalizeStatus = (value) => {
  const raw = (value || '').toString().trim().toLowerCase();
  if (!raw) return '';

  if (
    ['succeeded', 'success', 'successful', 'paid', 'completed', 'complete'].includes(raw) ||
    raw.includes('succeed') ||
    raw.includes('success') ||
    raw.endsWith('.paid')
  ) {
    return 'succeeded';
  }
  if (
    ['failed', 'failure', 'declined', 'canceled', 'cancelled'].includes(raw) ||
    raw.includes('fail') ||
    raw.includes('declin') ||
    raw.includes('cancel') ||
    raw.includes('reject') ||
    raw.includes('denied') ||
    raw.includes('error') ||
    raw.includes('expire') ||
    raw.includes('timeout')
  ) {
    return 'failed';
  }
  if (['pending', 'processing', 'awaiting', 'created'].includes(raw)) return 'awaiting';
  return '';
};

const deriveStatus = (payload) => {
  const eventType = (
    payload?.type ||
    payload?.eventType ||
    payload?.event ||
    payload?.data?.type ||
    payload?.payload?.type ||
    ''
  ).toString().trim().toLowerCase();

  if (eventType === 'payment.succeeded' || eventType.endsWith('.succeeded') || eventType.endsWith('.paid')) {
    return 'succeeded';
  }
  if (
    eventType === 'payment.failed' ||
    eventType.endsWith('.failed') ||
    eventType.endsWith('.declined') ||
    eventType.endsWith('.cancelled') ||
    eventType.endsWith('.canceled')
  ) {
    return 'failed';
  }
  if (eventType.endsWith('.pending') || eventType.endsWith('.processing')) {
    return 'awaiting';
  }

  const statusCandidates = [
    payload?.payload?.status,
    payload?.status,
    payload?.data?.status,
    payload?.data?.payment?.status,
    payload?.data?.payment_status,
    payload?.payment_status,
    payload?.payload?.paymentStatus,
    payload?.payload?.payment_status,
    payload?.payload?.result,
    payload?.payload?.outcome,
    payload?.payload?.failureReason,
    payload?.payload?.failure_reason,
    payload?.payload?.declineReason,
    payload?.payload?.decline_reason,
    payload?.payload?.errorCode,
    payload?.payload?.error_code,
  ];

  for (const candidate of statusCandidates) {
    const normalized = normalizeStatus(candidate);
    if (normalized) return normalized;
  }

  return normalizeStatus(eventType);
};

const extractCheckoutIds = (payload) => {
  return [
    payload?.payload?.metadata?.checkoutId,
    payload?.payload?.metadata?.checkout_id,
    payload?.payload?.checkoutId,
    payload?.payload?.checkout_id,
    payload?.payload?.paymentMethodDetails?.checkoutId,
    payload?.metadata?.checkoutId,
    payload?.metadata?.checkout_id,
    payload?.data?.checkoutId,
    payload?.data?.checkout_id,
    payload?.data?.checkout?.id,
    payload?.data?.metadata?.checkoutId,
    payload?.data?.metadata?.checkout_id,
    payload?.data?.payment?.metadata?.checkoutId,
    payload?.data?.payment?.metadata?.checkout_id,
    payload?.data?.object?.metadata?.checkoutId,
    payload?.data?.object?.metadata?.checkout_id,
    payload?.data?.resource?.metadata?.checkoutId,
    payload?.data?.resource?.metadata?.checkout_id,
    payload?.checkoutId,
    payload?.checkout_id,
  ]
    .map((v) => (v == null ? '' : v.toString().trim()))
    .filter(Boolean);
};

const extractPaymentIds = (payload) => {
  return [
    payload?.payload?.paymentId,
    payload?.payload?.payment_id,
    payload?.payload?.id,
    payload?.metadata?.paymentId,
    payload?.metadata?.payment_id,
    payload?.data?.payment?.id,
    payload?.data?.payment?.paymentId,
    payload?.data?.payment?.payment_id,
    payload?.data?.metadata?.paymentId,
    payload?.data?.metadata?.payment_id,
    payload?.data?.payment?.metadata?.paymentId,
    payload?.data?.payment?.metadata?.payment_id,
    payload?.data?.paymentId,
    payload?.data?.payment_id,
    payload?.data?.object?.id,
    payload?.data?.object?.paymentId,
    payload?.data?.object?.payment_id,
    payload?.data?.resource?.id,
    payload?.data?.resource?.paymentId,
    payload?.data?.resource?.payment_id,
    payload?.resourceId,
    payload?.resource_id,
    payload?.paymentId,
    payload?.payment_id,
  ]
    .map((v) => (v == null ? '' : v.toString().trim()))
    .filter(Boolean);
};

const extractApplicationIds = (payload) => {
  return [
    payload?.payload?.metadata?.applicationId,
    payload?.payload?.metadata?.application_id,
    payload?.payload?.externalId,
    payload?.payload?.external_id,
    payload?.payload?.clientReferenceId,
    payload?.payload?.client_reference_id,
    payload?.externalId,
    payload?.external_id,
    payload?.clientReferenceId,
    payload?.client_reference_id,
    payload?.metadata?.applicationId,
    payload?.metadata?.application_id,
    payload?.data?.applicationId,
    payload?.data?.application_id,
    payload?.data?.externalId,
    payload?.data?.external_id,
    payload?.data?.clientReferenceId,
    payload?.data?.client_reference_id,
    payload?.data?.metadata?.applicationId,
    payload?.data?.metadata?.application_id,
    payload?.data?.payment?.metadata?.applicationId,
    payload?.data?.payment?.metadata?.application_id,
    payload?.data?.payment?.applicationId,
    payload?.data?.payment?.application_id,
    payload?.data?.object?.metadata?.applicationId,
    payload?.data?.object?.metadata?.application_id,
    payload?.data?.object?.externalId,
    payload?.data?.object?.external_id,
    payload?.data?.object?.clientReferenceId,
    payload?.data?.object?.client_reference_id,
    payload?.data?.resource?.metadata?.applicationId,
    payload?.data?.resource?.metadata?.application_id,
    payload?.data?.resource?.externalId,
    payload?.data?.resource?.external_id,
    payload?.data?.resource?.clientReferenceId,
    payload?.data?.resource?.client_reference_id,
    payload?.applicationId,
    payload?.application_id,
  ]
    .map((v) => (v == null ? '' : v.toString().trim()))
    .filter(Boolean);
};

const extractRecordIds = (payload) => {
  return [
    payload?.payload?.metadata?.hubspotRecordId,
    payload?.payload?.metadata?.hubspot_record_id,
    payload?.metadata?.hubspotRecordId,
    payload?.metadata?.hubspot_record_id,
    payload?.data?.metadata?.hubspotRecordId,
    payload?.data?.metadata?.hubspot_record_id,
    payload?.data?.payment?.metadata?.hubspotRecordId,
    payload?.data?.payment?.metadata?.hubspot_record_id,
  ]
    .map((v) => (v == null ? '' : v.toString().trim()))
    .filter(Boolean);
};

const findApplicationByPaymentIdentifier = async (paymentIdentifier) => {
  if (!paymentIdentifier) return null;
  const search = await hubspotRequest(`/crm/v3/objects/${APPLICATION_OBJECT}/search`, 'POST', {
    filterGroups: [
      {
        filters: [
          {
            propertyName: PAYMENT_ID_PROPERTY,
            operator: 'EQ',
            value: paymentIdentifier,
          },
        ],
      },
    ],
    properties: [PAYMENT_STATUS_PROPERTY, PAYMENT_ID_PROPERTY, APPLICATION_ID_PROPERTY],
    limit: 1,
  });
  return (search.results || [])[0] || null;
};

const findApplicationByApplicationId = async (applicationId) => {
  if (!applicationId) return null;
  const search = await hubspotRequest(`/crm/v3/objects/${APPLICATION_OBJECT}/search`, 'POST', {
    filterGroups: [
      {
        filters: [
          {
            propertyName: APPLICATION_ID_PROPERTY,
            operator: 'EQ',
            value: applicationId,
          },
        ],
      },
    ],
    properties: [PAYMENT_STATUS_PROPERTY, PAYMENT_ID_PROPERTY, APPLICATION_ID_PROPERTY],
    limit: 1,
  });
  return (search.results || [])[0] || null;
};

const findApplicationWithRetry = async (paymentIds, applicationIds) => {
  const uniquePaymentIds = [...new Set((paymentIds || []).filter(Boolean))];
  const uniqueApplicationIds = [...new Set((applicationIds || []).filter(Boolean))];

  for (let attempt = 0; attempt < WEBHOOK_LOOKUP_MAX_ATTEMPTS; attempt += 1) {
    for (const paymentId of uniquePaymentIds) {
      const byPaymentIdentifier = await findApplicationByPaymentIdentifier(paymentId);
      if (byPaymentIdentifier && byPaymentIdentifier.id) return byPaymentIdentifier;
    }

    for (const applicationId of uniqueApplicationIds) {
      const byApplication = await findApplicationByApplicationId(applicationId);
      if (byApplication && byApplication.id) return byApplication;
    }

    if (attempt < WEBHOOK_LOOKUP_MAX_ATTEMPTS - 1) {
      await sleep(WEBHOOK_LOOKUP_DELAY_MS);
    }
  }

  return null;
};

const sanitizePaymentIdentifiers = (ids = []) => {
  const safePrefixes = ['ch_', 'chk_', 'checkout_'];
  return [...new Set(ids.filter(Boolean))]
    .map((id) => id.toString().trim())
    .filter((id) => safePrefixes.some((prefix) => id.startsWith(prefix)));
};

const createOrphanPaymentNote = async ({ checkoutId, applicationId, status }) => {
  const lines = [
    'Yoco webhook received but no matching application record was found after retries.',
    `Checkout ID: ${checkoutId || 'n/a'}`,
    `Application ID: ${applicationId || 'n/a'}`,
    `Status: ${status || 'n/a'}`,
  ];

  try {
    await hubspotRequest('/crm/v3/objects/notes', 'POST', {
      properties: {
        hs_timestamp: `${Date.now()}`,
        hs_note_body: lines.join('<br>'),
      },
    });
  } catch {}
};

const tryPatchByRecordId = async (recordId, status, paymentId) => {
  if (!recordId) return false;
  await hubspotRequest(`/crm/v3/objects/${APPLICATION_OBJECT}/${recordId}`, 'PATCH', {
    properties: {
      [PAYMENT_STATUS_PROPERTY]: status,
      [PAYMENT_ID_PROPERTY]: paymentId || '',
    },
  });
  return true;
};

exports.main = async (context, sendResponse) => {
  if (context.method === 'OPTIONS') {
    return sendResponse(withCors(204));
  }

  if (context.method !== 'POST') {
    return sendResponse(withCors(405, { error: 'Method not allowed.' }));
  }

  if (!HUBSPOT_ACCESS_TOKEN) {
    return sendResponse(withCors(500, { error: 'Missing HubSpot access token.' }));
  }

  const rawBody = typeof context.body === 'string'
    ? context.body
    : JSON.stringify(context.body || {});

  const headers = context.headers || {};
  const signatureHeader = (
    headers[YOCO_WEBHOOK_SIGNATURE_HEADER] ||
    headers[YOCO_WEBHOOK_SIGNATURE_HEADER.toLowerCase()] ||
    headers['webhook-signature'] ||
    headers['x-webhook-signature'] ||
    headers['yoco-signature'] ||
    headers['x-yoco-signature']
  );

  if (YOCO_WEBHOOK_SECRET && !signatureHeader && YOCO_ALLOW_UNSIGNED_WEBHOOKS) {
    logEvent('MISSING_SIGNATURE_ACCEPTED', {
      headerName: YOCO_WEBHOOK_SIGNATURE_HEADER,
      providedHeaders: Object.keys(headers),
    });
  }

  if (!verifySignature(rawBody, signatureHeader)) {
    logEvent('INVALID_SIGNATURE', {
      headerName: YOCO_WEBHOOK_SIGNATURE_HEADER,
      providedHeaders: Object.keys(headers),
    });
    return sendResponse(withCors(401, { error: 'Invalid webhook signature.' }));
  }

  let payload;
  try {
    payload = typeof context.body === 'string' ? JSON.parse(context.body) : (context.body || {});
  } catch {
    return sendResponse(withCors(400, { error: 'Invalid JSON.' }));
  }

  const derivedStatus = deriveStatus(payload);
  const forcedStatus = normalizeStatus(YOCO_TEST_FORCE_STATUS);
  const status = forcedStatus || derivedStatus;
  if (forcedStatus) {
    logEvent('STATUS_FORCED_BY_ENV', {
      forcedStatus,
      derivedStatus,
    });
  }

  if (!status) {
    logEvent('IGNORED_UNSUPPORTED_STATUS', {
      statusCandidates: {
        status: payload?.status,
        dataStatus: payload?.data?.status,
        paymentStatus: payload?.data?.payment?.status,
        dataPaymentStatus: payload?.data?.payment_status,
        rootPaymentStatus: payload?.payment_status,
        type: payload?.type,
        eventType: payload?.eventType,
        event: payload?.event,
      },
    });
    return sendResponse(withCors(202, { ignored: true, reason: 'Unsupported status.' }));
  }

  const checkoutIds = extractCheckoutIds(payload);
  const paymentIds = sanitizePaymentIdentifiers(extractPaymentIds(payload));
  const applicationIds = extractApplicationIds(payload);
  const recordIds = extractRecordIds(payload);
  const lookupPaymentIds = [...new Set([...checkoutIds, ...paymentIds])].filter(Boolean);

  if (!lookupPaymentIds.length && !applicationIds.length) {
    logEvent('IGNORED_MISSING_IDENTIFIERS', { status });
    return sendResponse(withCors(202, { ignored: true, reason: 'Missing payment/application identifiers.' }));
  }
  const primaryCheckoutId = checkoutIds[0] || '';
  const primaryPaymentId = paymentIds[0] || '';
  const primaryApplicationId = applicationIds[0] || '';
  logEvent('WEBHOOK_PARSED', {
    type: payload?.type || '',
    status,
    derivedStatus,
    forcedStatus: forcedStatus || '',
    checkoutIds,
    paymentIds,
    applicationIds,
    recordIds,
    failureReason: payload?.payload?.failureReason || payload?.payload?.failure_reason || '',
    declineReason: payload?.payload?.declineReason || payload?.payload?.decline_reason || '',
    errorCode: payload?.payload?.errorCode || payload?.payload?.error_code || '',
  });

  try {
    const directRecordId = recordIds[0] || '';
    const resolvedPaymentId = primaryCheckoutId || primaryPaymentId || '';
    if (directRecordId) {
      try {
        await tryPatchByRecordId(directRecordId, status, resolvedPaymentId);
        logEvent('APPLICATION_UPDATED_BY_RECORD_ID', {
          recordId: directRecordId,
          checkoutId: primaryCheckoutId,
          paymentId: primaryPaymentId,
          applicationId: primaryApplicationId,
          status,
        });
        return sendResponse(withCors(200, { updated: true, via: 'record_id' }));
      } catch (error) {
        logEvent('PATCH_BY_RECORD_ID_FAILED', {
          recordId: directRecordId,
          message: error?.message || '',
        });
      }
    }

    const record = await findApplicationWithRetry(lookupPaymentIds, applicationIds);
    if (!record || !record.id) {
      logEvent('IGNORED_APPLICATION_NOT_FOUND', {
        lookupPaymentIds,
        applicationIds,
        status,
        payloadKeys: Object.keys(payload || {}),
        dataKeys: Object.keys(payload?.data || {}),
      });
      await createOrphanPaymentNote({
        checkoutId: primaryCheckoutId || primaryPaymentId,
        applicationId: primaryApplicationId,
        status,
      });
      return sendResponse(withCors(202, { ignored: true, reason: 'Application not found after retries.' }));
    }

    await hubspotRequest(`/crm/v3/objects/${APPLICATION_OBJECT}/${record.id}`, 'PATCH', {
      properties: {
        [PAYMENT_STATUS_PROPERTY]: status,
        [PAYMENT_ID_PROPERTY]: primaryCheckoutId || primaryPaymentId || record?.properties?.[PAYMENT_ID_PROPERTY] || '',
      },
    });

    logEvent('APPLICATION_UPDATED', {
      recordId: record.id,
      checkoutId: primaryCheckoutId,
      paymentId: primaryPaymentId,
      applicationId: primaryApplicationId,
      status,
    });
    return sendResponse(withCors(200, { updated: true }));
  } catch (error) {
    return sendResponse(withCors(500, { error: error.message || 'Server error.' }));
  }
};
