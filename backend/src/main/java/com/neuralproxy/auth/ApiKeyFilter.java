package com.neuralproxy.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Component
public class ApiKeyFilter extends OncePerRequestFilter {

    private final JdbcTemplate jdbcTemplate;

    public ApiKeyFilter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/gateway") && !path.startsWith("/api/gateway");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String apiKey = request.getHeader("X-API-Key");
        if (apiKey == null) {
            chain.doFilter(request, response);
            return;
        }

        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(apiKey.getBytes(StandardCharsets.UTF_8));
            String keyHash = HexFormat.of().formatHex(hash);

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT tenant_id, id FROM api_keys WHERE key_hash=? AND active=true " +
                    "AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())",
                keyHash
            );

            if (rows.isEmpty()) {
                chain.doFilter(request, response);
                return;
            }

            String tenantId = rows.get(0).get("tenant_id").toString();
            String keyId = rows.get(0).get("id").toString();
            request.setAttribute("tenantId", tenantId);
            jdbcTemplate.update("UPDATE api_keys SET last_used_at = ? WHERE id = ?::uuid", OffsetDateTime.now(), keyId);

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "apikey:" + tenantId,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_API_CLIENT"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is always available
        }

        chain.doFilter(request, response);
    }
}
