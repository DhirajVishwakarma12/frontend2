export function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.user) {
      return response.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const userRole = String(request.user.role || "")
      .trim()
      .toLowerCase();

    const normalizedAllowedRoles = allowedRoles.map((role) =>
      String(role).trim().toLowerCase()
    );

    if (!normalizedAllowedRoles.includes(userRole)) {
      return response.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
        requiredRoles: normalizedAllowedRoles,
        currentRole: userRole,
      });
    }

    return next();
  };
}
