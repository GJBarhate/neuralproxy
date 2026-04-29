package com.neuralproxy.gateway;

import com.neuralproxy.analytics.AsyncLogService;
import com.neuralproxy.common.TenantAccess;
import com.neuralproxy.model.PromptRequest;
import com.neuralproxy.model.PromptResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/gateway")
public class GatewayController {

    private final GatewayService gatewayService;
    private final GeminiRouter geminiRouter;
    private final AsyncLogService asyncLogService;

    public GatewayController(GatewayService gatewayService, GeminiRouter geminiRouter, AsyncLogService asyncLogService) {
        this.gatewayService = gatewayService;
        this.geminiRouter = geminiRouter;
        this.asyncLogService = asyncLogService;
    }

    @PostMapping("/prompt")
    public ResponseEntity<PromptResponse> prompt(
        @RequestBody PromptRequest req,
        Authentication auth,
        HttpServletRequest httpReq,
        @RequestHeader(value = "X-User-Gemini-Key", required = false) String userKey
    ) {
        UUID tenantId = TenantAccess.extractTenantId(auth, httpReq);
        boolean usedUserKey = userKey != null && !userKey.isBlank();
        try {
            PromptResponse response = gatewayService.process(req, tenantId, userKey);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            asyncLogService.logFailure(tenantId, req == null ? null : req.prompt(), usedUserKey, ex.getMessage());
            throw ex;
        }
    }

    @GetMapping("/validate-key")
    public ResponseEntity<Map<String, Object>> validateKey(@RequestParam String key) {
        try {
            geminiRouter.validateKey(key);
            return ResponseEntity.ok(Map.of("valid", true));
        } catch (InvalidApiKeyException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Could not validate key: " + e.getMessage()));
        }
    }

    @ExceptionHandler(GatewayException.class)
    public ResponseEntity<Map<String, Object>> handleGatewayException(GatewayException ex) {
        return ResponseEntity.status(503).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
    }
}
