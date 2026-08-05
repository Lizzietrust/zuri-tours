import jwt from "jsonwebtoken";

export const checkPasswordChanged = (user, token) => {
  try {
    const decoded = jwt.decode(token);

    if (!decoded) return true;

    return user.changedPasswordAfter(decoded.iat);
  } catch (error) {
    return true;
  }
};

export const generateSecureToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    },
  );
};
