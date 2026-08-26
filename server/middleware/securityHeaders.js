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
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), " +
      "magnetometer=(), accelerometer=(), gyroscope=(), " +
      "fullscreen=(self), display-capture=()",
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
