export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");

  res.setHeader("X-Frame-Options", "DENY");

  res.setHeader("X-XSS-Protection", "1; mode=block");

  if (req.user || req.headers.authorization) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  res.removeHeader("X-Powered-By");

  res.setHeader(
    "Permissions-Policy",
    [
      "geolocation=()",
      "microphone=()",
      "camera=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "accelerometer=()",
      "gyroscope=()",
      "fullscreen=(self)",
      "display-capture=()",
      "autoplay=()",
      "encrypted-media=()",
      "picture-in-picture=()",
      "speaker-selection=()",
      "screen-wake-lock=()",
      "web-share=()",
      "clipboard-write=(self)",
      "clipboard-read=()",
    ].join(", "),
  );

  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  res.setHeader("X-DNS-Prefetch-Control", "off");

  res.setHeader("X-Download-Options", "noopen");

  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  res.setHeader("Origin-Agent-Cluster", "?1");

  next();
};

export const clearSecurityHeaders = (req, res, next) => {
  res.setHeader(
    "Clear-Site-Data",
    '"cache", "cookies", "storage", "executionContexts"',
  );
  next();
};

export const contentSecurityPolicyHeaders = (req, res, next) => {
  if (!res.getHeader("Content-Security-Policy")) {
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "font-src 'self' https: data:",
        "frame-src 'self'",
        "img-src 'self' data: https:",
        "object-src 'none'",
        "script-src 'self'",
        "script-src-attr 'none'",
        "style-src 'self' https: 'unsafe-inline'",
        "upgrade-insecure-requests",
      ].join("; "),
    );
  }
  next();
};

export const featurePolicyHeaders = (req, res, next) => {
  res.setHeader(
    "Feature-Policy",
    [
      "geolocation 'none'",
      "microphone 'none'",
      "camera 'none'",
      "payment 'none'",
      "usb 'none'",
      "magnetometer 'none'",
      "accelerometer 'none'",
      "gyroscope 'none'",
      "fullscreen 'self'",
    ].join("; "),
  );
  next();
};

export const applyAllSecurityHeaders = (req, res, next) => {
  securityHeaders(req, res, () => {
    contentSecurityPolicyHeaders(req, res, () => {
      featurePolicyHeaders(req, res, () => {
        next();
      });
    });
  });
};

export const conditionalSecurityHeaders = (req, res, next) => {
  if (req.path.startsWith("/api") && (req.user || req.headers.authorization)) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  if (req.path.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg)$/)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }

  // For HTML pages
  if (req.path.match(/\.html$/)) {
    // Don't cache HTML
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
};

// ==================== EXPORT ALL ====================

export default {
  securityHeaders,
  clearSecurityHeaders,
  contentSecurityPolicyHeaders,
  featurePolicyHeaders,
  applyAllSecurityHeaders,
  conditionalSecurityHeaders,
};
