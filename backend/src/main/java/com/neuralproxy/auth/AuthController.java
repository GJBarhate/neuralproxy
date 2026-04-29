package com.neuralproxy.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    record LoginRequest(String email, String password) {}
    record RegisterRequest(String email, String username, String password, String tenantId) {}
    record MakeAdminRequest(String email) {}
    record ForgotPasswordRequest(String email) {}
    record ResetPasswordRequest(String token, String password) {}

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest req) {
        Map<String, Object> result = authService.login(req.email(), req.password());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest req) {
        Map<String, Object> result = authService.register(req.email(), req.password(), req.username(), req.tenantId());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/make-admin")
    public ResponseEntity<Map<String, Object>> makeAdmin(@RequestBody MakeAdminRequest req) {
        Map<String, Object> result = authService.makeAdmin(req.email());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        return ResponseEntity.ok(authService.requestPasswordReset(req.email()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody ResetPasswordRequest req) {
        return ResponseEntity.ok(authService.resetPassword(req.token(), req.password()));
    }
}
