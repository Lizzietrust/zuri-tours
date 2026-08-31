import xss from "xss";

function sanitizeString(str) {
  if (typeof str !== "string") {
    return str;
  }

  let sanitized = str
    .split("")
    .filter(function filterControlChars(char) {
      const code = char.charCodeAt(0);

      return (code > 31 && code < 127) || code > 159;
    })
    .join("");

  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  sanitized = sanitized.replace(/ on\w+=/gi, " data-removed=");

  sanitized = sanitized.replace(/javascript:/gi, "blocked:");

  sanitized = sanitized.replace(/data:/gi, "blocked:");

  sanitized = sanitized.trim();

  return sanitized;
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(function sanitizeArrayItem(item) {
      return sanitizeObject(item);
    });
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$")) {
      console.warn(`⚠️ Removed MongoDB operator: ${key}`);
      // eslint-disable-next-line no-continue
      continue;
    }

    if (key.includes(".")) {
      console.warn(`⚠️ Removed MongoDB dot notation: ${key}`);
      // eslint-disable-next-line no-continue
      continue;
    }

    if (value && typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export const sanitizeData = function sanitizeDataMiddleware(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

export const xssSanitize = function xssSanitizeMiddleware(req, res, next) {
  const fieldsToSanitize = [
    "name",
    "description",
    "title",
    "content",
    "comment",
    "message",
    "bio",
    "address",
    "city",
    "country",
  ];

  if (req.body) {
    fieldsToSanitize.forEach(function sanitizeField(field) {
      if (req.body[field]) {
        req.body[field] = xss(req.body[field], {
          whiteList: {},
          stripIgnoreTag: true,
          stripIgnoreTagBody: ["script", "style", "noscript"],
        });
      }
    });
  }

  next();
};

export const validateSanitization = function validateSanitizationMiddleware(
  req,
  res,
  next,
) {
  function checkPattern(value) {
    if (typeof value === "string") {
      const maliciousPatterns = [
        /<\s*script/i,
        /on\w+\s*=/i,
        /javascript:/i,
        /data:text\/html/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
      ];

      // eslint-disable-next-line no-restricted-syntax
      for (const pattern of maliciousPatterns) {
        if (pattern.test(value)) {
          throw new Error(`Potentially malicious content detected: ${pattern}`);
        }
      }
    }
  }

  try {
    if (req.body) {
      JSON.stringify(req.body, function sanitizeReplacer(key, value) {
        checkPattern(value);

        return value;
      });
    }

    if (req.query) {
      JSON.stringify(req.query, function sanitizeQueryReplacer(key, value) {
        checkPattern(value);

        return value;
      });
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid input data",
      error: error.message,
    });
  }
};
