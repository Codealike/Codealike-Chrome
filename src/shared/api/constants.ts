// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../../package.json');
const isProduction = process.env.NODE_ENV === 'production'

export const CodealikeHost = (isProduction ? 'https://codealike.com/api/v2' : 'https://dev.codealike.com/api/v2');
export const InvalidTokenError = 'Invalid token provided';

export const CurrentClientVersion = packageJson.version;
