package com.neuralproxy.account;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    record UpdateProfileRequest(String email, String username) {}
    record ChangePasswordRequest(String currentPassword, String newPassword) {}

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(accountService.getProfile(auth, request));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<Map<String, Object>>> getActivity(Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(accountService.getRecentActivity(auth, request));
    }

    @PatchMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody UpdateProfileRequest profileRequest,
                                                             Authentication auth,
                                                             HttpServletRequest request) {
        return ResponseEntity.ok(accountService.updateProfile(auth, request, profileRequest.email(), profileRequest.username()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody ChangePasswordRequest passwordRequest,
                                                              Authentication auth) {
        return ResponseEntity.ok(accountService.changePassword(auth, passwordRequest.currentPassword(), passwordRequest.newPassword()));
    }
}
