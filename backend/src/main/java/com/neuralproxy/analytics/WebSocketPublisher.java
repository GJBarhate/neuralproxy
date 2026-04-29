package com.neuralproxy.analytics;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class WebSocketPublisher {

    private static final Logger log = LoggerFactory.getLogger(WebSocketPublisher.class);

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishAnalytics(Map<String, Object> summary) {
        try {
            messagingTemplate.convertAndSend("/topic/analytics", summary);
        } catch (Exception e) {
            log.warn("WebSocket publish failed: {}", e.getMessage());
        }
    }
}
