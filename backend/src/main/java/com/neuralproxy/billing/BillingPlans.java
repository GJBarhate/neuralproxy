package com.neuralproxy.billing;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class BillingPlans {

    private BillingPlans() {
    }

    public static List<Map<String, Object>> all() {
        return List.of(
            plan("FREE", "Free", 0, 60, "10k", 15, "3 saved prompts", "Basic analytics", "Community support"),
            plan("PRO", "Pro", 999, 300, "250k", 90, "50 saved prompts", "Advanced analytics", "Priority support"),
            plan("ENTERPRISE", "Enterprise", 2999, 1000, "2M", 365, "Unlimited prompts", "Full analytics + billing exports", "Dedicated support")
        );
    }

    public static Map<String, Object> get(String code) {
        return all().stream()
            .filter(plan -> plan.get("code").equals(normalize(code)))
            .findFirst()
            .orElse(all().get(1));
    }

    public static int amountFor(String code) {
        return (Integer) get(code).get("amount");
    }

    public static int rpmFor(String code) {
        return (Integer) get(code).get("requestsPerMinute");
    }

    public static String normalize(String code) {
        return code == null || code.isBlank() ? "FREE" : code.trim().toUpperCase();
    }

    private static Map<String, Object> plan(String code,
                                            String name,
                                            int amount,
                                            int requestsPerMinute,
                                            String monthlyTokens,
                                            int analyticsDays,
                                            String savedPrompts,
                                            String analytics,
                                            String support) {
        Map<String, Object> plan = new LinkedHashMap<>();
        plan.put("code", code);
        plan.put("name", name);
        plan.put("amount", amount);
        plan.put("requestsPerMinute", requestsPerMinute);
        plan.put("monthlyTokens", monthlyTokens);
        plan.put("analyticsDays", analyticsDays);
        plan.put("savedPrompts", savedPrompts);
        plan.put("analytics", analytics);
        plan.put("support", support);
        plan.put("description", name + " plan for AI gateway usage");
        return plan;
    }
}
