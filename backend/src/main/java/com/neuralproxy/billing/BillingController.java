package com.neuralproxy.billing;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    record CreateOrderRequest(String planCode, Integer amount) {}
    record ConfirmPaymentRequest(String orderId, String paymentId, String signature) {}

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig(Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(billingService.getBillingConfig(auth, request));
    }

    @PostMapping("/orders")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody CreateOrderRequest billingRequest,
                                                           Authentication auth,
                                                           HttpServletRequest request) {
        return ResponseEntity.ok(billingService.createOrder(billingRequest.planCode(), billingRequest.amount(), auth, request));
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmPayment(@RequestBody ConfirmPaymentRequest billingRequest,
                                                              Authentication auth,
                                                              HttpServletRequest request) {
        return ResponseEntity.ok(billingService.confirmPayment(billingRequest.orderId(), billingRequest.paymentId(), billingRequest.signature(), auth, request));
    }

    @GetMapping("/admin-summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminSummary() {
        return ResponseEntity.ok(billingService.getAdminSummary());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
