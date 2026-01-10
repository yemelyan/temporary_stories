import { makeRouteHandler } from '@keystatic/next/route-handler';
import keystaticConfig from '../../../../../keystatic.config';

export const runtime = 'edge';

export const { POST, GET } = makeRouteHandler({ config: keystaticConfig });
