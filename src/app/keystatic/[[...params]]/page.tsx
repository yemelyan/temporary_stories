'use client';

import { makePage } from '@keystatic/next/ui/app';
import keystaticConfig from '../../../../keystatic.config';

// Keystatic admin is only available in development
// In production, this will show an error since Keystatic requires Node.js fs APIs
// which don't work in Cloudflare's Edge Runtime
export default makePage(keystaticConfig);
