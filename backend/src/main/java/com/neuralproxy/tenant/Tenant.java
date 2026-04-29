package com.neuralproxy.tenant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    @Column(columnDefinition = "UUID")
    private UUID id;

    private String name;

    @Column(length = 50)
    private String plan;

    private Boolean active;

    @Column(name = "subscription_status", length = 30)
    private String subscriptionStatus;

    @Column(name = "plan_started_at")
    private LocalDateTime planStartedAt;

    @Column(name = "billing_cycle_end")
    private LocalDateTime billingCycleEnd;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public String getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(String subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }

    public LocalDateTime getPlanStartedAt() { return planStartedAt; }
    public void setPlanStartedAt(LocalDateTime planStartedAt) { this.planStartedAt = planStartedAt; }

    public LocalDateTime getBillingCycleEnd() { return billingCycleEnd; }
    public void setBillingCycleEnd(LocalDateTime billingCycleEnd) { this.billingCycleEnd = billingCycleEnd; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
