import { UAParser } from "ua-parser-js";
export const getDeviceInfo = (req: any) => {
  const parser = new UAParser();
  parser.setUA(req.headers["user-agent"]);
  const uaResult = parser.getResult();
  return {
    deviceType: uaResult.device.type || "desktop",
    deviceVendor: uaResult.device.vendor || "unknown",
    browser: uaResult.browser.name || "unknown",
    browserVersion: uaResult.browser.version || "unknown",
    os: uaResult.os.name || "unknown",
    osVersion: uaResult.os.version || "unknown",
    userAgent: req.headers["user-agent"],
    ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  };
};
