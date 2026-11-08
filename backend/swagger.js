const bearer = [{ bearerAuth: [] }]
const str = { type: 'string' }
const num = { type: 'number' }

function body(properties, required = []) {
  const schema = { type: 'object', properties }
  if (required.length > 0) schema.required = required

  return {
    required: true,
    content: { 'application/json': { schema } }
  }
}

function pathParam(name, type) {
  return { name, in: 'path', required: true, schema: { type } }
}

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Nirapod API',
    version: '1.0.0',
    description: 'SOS and live location sharing API for women safety.'
  },
  servers: [{ url: 'http://localhost:5000' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Check the server is running',
        responses: { 200: { description: 'Server is ok' } }
      }
    },
    '/api/me': {
      get: {
        tags: ['System'],
        summary: 'Get the logged in user',
        security: bearer,
        responses: {
          200: { description: 'User id, name and email' },
          401: { description: 'Login required' }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        requestBody: body(
          { name: str, email: str, phone: str, password: str, pin: str },
          ['name', 'email', 'password']
        ),
        responses: {
          201: { description: 'Account created' },
          400: { description: 'Missing fields' },
          409: { description: 'Email already registered' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and get a token',
        requestBody: body({ email: str, password: str }, ['email', 'password']),
        responses: {
          200: { description: 'Token and user' },
          401: { description: 'Invalid email or password' }
        }
      }
    },
    '/api/contacts': {
      get: {
        tags: ['Contacts'],
        summary: 'List your trusted contacts',
        security: bearer,
        responses: { 200: { description: 'List of contacts' } }
      },
      post: {
        tags: ['Contacts'],
        summary: 'Add a trusted contact (maximum 5)',
        security: bearer,
        requestBody: body(
          { name: str, phone: str, email: str, telegram_id: str },
          ['name']
        ),
        responses: {
          201: { description: 'Contact added' },
          400: { description: 'Missing fields or 5 contacts already' }
        }
      }
    },
    '/api/contacts/{id}': {
      delete: {
        tags: ['Contacts'],
        summary: 'Delete a contact',
        security: bearer,
        parameters: [pathParam('id', 'integer')],
        responses: {
          200: { description: 'Contact deleted' },
          404: { description: 'Contact not found' }
        }
      }
    },
    '/api/sos/start': {
      post: {
        tags: ['SOS'],
        summary: 'Start an SOS and alert contacts',
        security: bearer,
        responses: {
          201: { description: 'SOS started, share token returned' },
          200: { description: 'SOS already active' }
        }
      }
    },
    '/api/sos/{id}/location': {
      post: {
        tags: ['SOS'],
        summary: 'Save a GPS location for an active SOS',
        security: bearer,
        parameters: [pathParam('id', 'integer')],
        requestBody: body({ lat: num, lng: num }, ['lat', 'lng']),
        responses: {
          201: { description: 'Location saved' },
          404: { description: 'Active SOS not found' }
        }
      }
    },
    '/api/sos/{id}/stop': {
      post: {
        tags: ['SOS'],
        summary: 'End an SOS with your PIN',
        security: bearer,
        parameters: [pathParam('id', 'integer')],
        requestBody: body({ pin: str }, ['pin']),
        responses: {
          200: { description: 'SOS ended' },
          401: { description: 'Wrong PIN' }
        }
      }
    },
    '/api/sos/verify-pin': {
      post: {
        tags: ['SOS'],
        summary: 'Check your PIN (used to cancel a shake alert)',
        security: bearer,
        requestBody: body({ pin: str }, ['pin']),
        responses: {
          200: { description: 'PIN correct' },
          401: { description: 'Wrong PIN' }
        }
      }
    },
    '/api/timer/start': {
      post: {
        tags: ['Safety timer'],
        summary: 'Start a safety timer',
        security: bearer,
        requestBody: body({ minutes: num, lat: num, lng: num }, ['minutes']),
        responses: {
          201: { description: 'Safety timer started' },
          400: { description: 'Bad minutes or timer already running' }
        }
      }
    },
    '/api/timer/active': {
      get: {
        tags: ['Safety timer'],
        summary: 'See if a timer is running and how long is left',
        security: bearer,
        responses: { 200: { description: 'Timer status' } }
      }
    },
    '/api/timer/confirm': {
      post: {
        tags: ['Safety timer'],
        summary: 'Say you are safe with your PIN and cancel the timer',
        security: bearer,
        requestBody: body({ pin: str }, ['pin']),
        responses: {
          200: { description: 'Timer cancelled' },
          401: { description: 'Wrong PIN' }
        }
      }
    },
    '/api/track/{token}': {
      get: {
        tags: ['Tracking'],
        summary: 'Public live tracking data for a share link',
        parameters: [pathParam('token', 'string')],
        responses: {
          200: { description: 'Name, status, last location and trail' },
          404: { description: 'Tracking link not found' },
          410: { description: 'Tracking link expired' }
        }
      }
    }
  }
}

module.exports = swaggerSpec