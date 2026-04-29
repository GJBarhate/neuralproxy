package com.neuralproxy.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;

import java.util.UUID;

public final class TenantAccess {

    private static final UUID DEFAULT_ADMIN_TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private TenantAccess() {
    }

    public static UUID extractTenantId(Authentication auth, HttpServletRequest req) {
        if (auth != null && auth.getDetails() instanceof String s && !s.isBlank()) {
            try {
                return UUID.fromString(s);
            } catch (IllegalArgumentException ignored) {
            }
        }

        Object attr = req.getAttribute("tenantId");
        if (attr != null) {
            try {
                return UUID.fromString(attr.toString());
            } catch (IllegalArgumentException ignored) {
            }
        }

        return DEFAULT_ADMIN_TENANT;
    }

    public static boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
            .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
