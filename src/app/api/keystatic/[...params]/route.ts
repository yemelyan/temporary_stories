import { makeRouteHandler } from '@keystatic/next/route-handler';
import keystaticConfig from '../../../../../keystatic.config';

// Removed edge runtime - using Node.js runtime for file system access
export const { POST, GET } = makeRouteHandler({ config: keystaticConfig });
