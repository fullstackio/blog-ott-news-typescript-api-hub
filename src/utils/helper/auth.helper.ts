import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';

export const generateUserId = (firstName: string, lastName: string) => {
  const cleanFirstName = firstName.toLowerCase().replace(/\s+/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/\s+/g, '');
  const namePart = `${cleanFirstName}.${cleanLastName}`;
  const randomSuffix = crypto.randomBytes(6).toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substr(0, 8);
  return `${namePart}${randomSuffix}`;
};

export const generateUniqueUserId = () => {
  const prefix = 'SYSEGGEN';
  const randomPart = crypto.randomBytes(10).toString('hex').toUpperCase().substr(0, 14);
  return `${prefix}${randomPart}`;
};

export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const getDeviceInfo = (req: any) => {
  const parser = new UAParser();
  parser.setUA(req.headers['user-agent']);
  const uaResult = parser.getResult();
  return {
    deviceType: uaResult.device.type || 'desktop',
    deviceVendor: uaResult.device.vendor || 'unknown',
    browser: uaResult.browser.name || 'unknown',
    browserVersion: uaResult.browser.version || 'unknown',
    os: uaResult.os.name || 'unknown',
    osVersion: uaResult.os.version || 'unknown',
    userAgent: req.headers['user-agent'],
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  };
};

// Utility function to generate slug
export const generateSlug = (firstName: string, lastName: string): string => {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
    .replace(/(^-|-$)/g, '');     // remove leading/trailing hyphen
};
