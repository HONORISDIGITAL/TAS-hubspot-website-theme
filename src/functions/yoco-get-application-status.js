const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const APPLICATION_OBJECT_RAW = (process.env.HUBSPOT_APPLICATION_OBJECT_TYPE || '').toString().trim();
const APPLICATION_OBJECT = /^\d-\d+$/.test(APPLICATION_OBJECT_RAW) ? APPLICATION_OBJECT_RAW : '2-195685154';
const APPLICATION_ID_PROPERTY = 'application_id';
const PAYMENT_STATUS_PROPERTY = 'yoko_payment_status';
const PAYMENT_ID_PROPERTY = 'yoko_payment_id';

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

  try {
    const body = typeof context.body === 'string' ? JSON.parse(context.body) : (context.body || {});
    const applicationId = (body.applicationId || '').toString().trim();

    if (!applicationId) {
      return sendResponse(withCors(400, { error: 'Missing application ID.' }));
    }

    const record = await findApplicationRecordByApplicationId(applicationId);
    if (!record || !record.id) {
      return sendResponse(withCors(404, {
        found: false,
        applicationId,
      }));
    }

    return sendResponse(withCors(200, {
      found: true,
      applicationId,
      recordId: record.id,
      yoko_payment_id: record?.properties?.yoko_payment_id || '',
      yoko_payment_status: record?.properties?.yoko_payment_status || '',
      status: record?.properties?.yoko_payment_status || '',
    }));
  } catch (error) {
    return sendResponse(withCors(500, { error: error.message || 'Server error.' }));
  }
};
