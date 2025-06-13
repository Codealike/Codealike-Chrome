// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../../package.json');
export const IS_PRODUCTION_ENVIRONMENT = process.env.NODE_ENV === 'production'

export const CodealikeHost = (IS_PRODUCTION_ENVIRONMENT ? 'https://codealike.com/api/v2' : 'https://dev.codealike.com/api/v2');
export const InvalidTokenError = 'Invalid token provided';

export const CurrentClientVersion = packageJson.version;
