const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
const YOCO_CHECKOUT_URL = process.env.YOCO_CHECKOUT_URL;
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const APPLICATION_OBJECT_RAW = (process.env.HUBSPOT_APPLICATION_OBJECT_TYPE || '').toString().trim();
const APPLICATION_OBJECT = /^\d-\d+$/.test(APPLICATION_OBJECT_RAW) ? APPLICATION_OBJECT_RAW : '2-195685154';
const APPLICATION_ID_PROPERTY = 'application_id';
const PAYMENT_STATUS_PROPERTY = 'yoko_payment_status';
const PAYMENT_ID_PROPERTY = 'yoko_payment_id';
const APPLICATION_LOOKUP_MAX_ATTEMPTS = Number(process.env.APPLICATION_LOOKUP_MAX_ATTEMPTS || 3);
const APPLICATION_LOOKUP_DELAY_MS = Number(process.env.APPLICATION_LOOKUP_DELAY_MS || 400);
const APPLICATION_LOOKUP_MAX_WAIT_MS = Number(process.env.APPLICATION_LOOKUP_MAX_WAIT_MS || 3500);
const PAYMENT_CURRENCY = 'ZAR';

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

const logError = (code, context = {}) => {
  try {
    console.error(`[yoco-checkout][${code}]`, JSON.stringify(context));
  } catch {
    console.error(`[yoco-checkout][${code}]`, context);
  }
};

const logInfo = (code, context = {}) => {
  try {
    console.error(`[yoco-checkout][${code}]`, JSON.stringify(context));
  } catch {
    console.error(`[yoco-checkout][${code}]`, context);
  }
};

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

const findApplicationRecordByApplicationId = async (applicationId) => {
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
    properties: [APPLICATION_ID_PROPERTY, PAYMENT_STATUS_PROPERTY, PAYMENT_ID_PROPERTY],
    limit: 1,
  });

  return (search.results || [])[0] || null;
};

const waitForApplicationRecord = async (applicationId) => {
  const startedAt = Date.now();
  for (let attempt = 0; attempt < APPLICATION_LOOKUP_MAX_ATTEMPTS; attempt += 1) {
    const record = await findApplicationRecordByApplicationId(applicationId);
    if (record && record.id) {
      return record;
    }
    if (attempt < APPLICATION_LOOKUP_MAX_ATTEMPTS - 1) {
      if ((Date.now() - startedAt + APPLICATION_LOOKUP_DELAY_MS) > APPLICATION_LOOKUP_MAX_WAIT_MS) {
        break;
      }
      await sleep(APPLICATION_LOOKUP_DELAY_MS);
    }
  }
  return null;
};

const appendParams = (baseUrl, params) => {
  if (!baseUrl) return baseUrl;
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    return baseUrl;
  }
  Object.entries(params || {}).forEach(([key, value]) => {
    if (!key || value === undefined || value === null || value === '') return;
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const updateApplicationPaymentProperties = async ({ recordId, checkoutId }) => {
  await hubspotRequest(`/crm/v3/objects/${APPLICATION_OBJECT}/${recordId}`, 'PATCH', {
    properties: {
      [PAYMENT_STATUS_PROPERTY]: 'awaiting',
      [PAYMENT_ID_PROPERTY]: checkoutId || '',
    },
  });
};

exports.main = async (context, sendResponse) => {
  if (context.method === 'OPTIONS') {
    return sendResponse(withCors(204));
  }

  if (context.method !== 'POST') {
    return sendResponse(withCors(405, { error: 'Method not allowed.' }));
  }

  if (!YOCO_SECRET_KEY || !YOCO_CHECKOUT_URL) {
    return sendResponse(withCors(500, { error: 'Missing Yoco configuration.' }));
  }

  try {
    const body = typeof context.body === 'string' ? JSON.parse(context.body) : (context.body || {});
    const amountMajor = Number(body.amount || 0);
    const amountMinor = Math.round(amountMajor * 100);
    const requestedCurrency = (body.currency || '').toString().trim().toUpperCase();
    const currency = PAYMENT_CURRENCY;
    const description = body.description || 'Payment';
    const successUrl = body.successUrl;
    const cancelUrl = body.cancelUrl;
    const applicationId = (body.applicationId || '').toString().trim();
    const applicationIdParam = (body.applicationIdParam || 'application_id').toString().trim();
    const statusParam = (body.statusParam || 'payment_status').toString().trim();
    const successValue = (body.statusSuccessValue || 'succeeded').toString().trim();
    const failedValue = (body.statusFailedValue || 'failed').toString().trim();
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    if (!amountMajor || amountMajor <= 0) {
      return sendResponse(withCors(400, { error: 'Invalid amount.' }));
    }
    if (requestedCurrency && requestedCurrency !== PAYMENT_CURRENCY) {
      return sendResponse(withCors(400, { error: `Unsupported currency. Expected ${PAYMENT_CURRENCY}.` }));
    }
    if (!applicationId) {
      return sendResponse(withCors(400, { error: 'Missing application ID.' }));
    }
    if (!successUrl || !cancelUrl) {
      return sendResponse(withCors(400, { error: 'Missing success or cancel URL.' }));
    }

    if (!HUBSPOT_ACCESS_TOKEN) {
      return sendResponse(withCors(500, { error: 'Missing HubSpot access token.' }));
    }

    const applicationRecord = await waitForApplicationRecord(applicationId);
    if (!applicationRecord || !applicationRecord.id) {
      return sendResponse(withCors(409, {
        error: 'Application record not found yet for this application ID.',
        code: 'APPLICATION_NOT_READY',
      }));
    }

    const payload = {
      amount: amountMinor,
      currency,
      description,
      metadata: {
        ...metadata,
        applicationId: applicationId || metadata.applicationId,
        application_id: applicationId || metadata.application_id,
        hubspotRecordId: applicationRecord.id,
        hubspot_record_id: applicationRecord.id,
        hubspotObjectType: APPLICATION_OBJECT,
        hubspot_object_type: APPLICATION_OBJECT,
      },
      externalId: applicationId || undefined,
      clientReferenceId: applicationId || undefined,
      successUrl: applicationId
        ? appendParams(successUrl, {
          [applicationIdParam]: applicationId,
          [statusParam]: successValue,
        })
        : successUrl,
      cancelUrl: applicationId
        ? appendParams(cancelUrl, {
          [applicationIdParam]: applicationId,
          [statusParam]: failedValue,
        })
        : cancelUrl,
    };

    const res = await fetch(YOCO_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      logError('YOCO_REQUEST_FAILED', {
        status: res.status,
        response: text,
      });
      return sendResponse(withCors(res.status, { error: text || 'Yoco request failed.' }));
    }

    const data = await res.json();
    const checkoutId = data.id || data.checkoutId || data.checkout_id;
    const redirectUrl = data.redirectUrl || data.redirect_url || data.url;

    if (!redirectUrl) {
      logError('YOCO_MISSING_REDIRECT_URL', {
        checkoutId,
        yocoResponse: data,
      });
      return sendResponse(withCors(502, { error: 'Missing redirect URL from Yoco.' }));
    }

    try {
      await updateApplicationPaymentProperties({
        recordId: applicationRecord.id,
        checkoutId,
      });
      logInfo('CHECKOUT_CREATED_AND_APPLICATION_UPDATED', {
        objectType: APPLICATION_OBJECT,
        recordId: applicationRecord.id,
        applicationId,
        checkoutId: checkoutId || '',
        paymentStatusProperty: PAYMENT_STATUS_PROPERTY,
        paymentIdProperty: PAYMENT_ID_PROPERTY,
      });
    } catch (error) {
      const msg = error.message || '';
      logError('HUBSPOT_UPDATE_FAILED', {
        applicationRecordId: applicationRecord.id,
        applicationId,
        message: msg,
      });
      return sendResponse(withCors(502, { error: msg || 'Failed to update application.' }));
    }

    return sendResponse(withCors(200, { redirectUrl }));
  } catch (error) {
    logError('UNHANDLED', { message: error.message });
    return sendResponse(withCors(500, { error: error.message || 'Server error.' }));
  }
};
