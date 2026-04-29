import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import SurfaceCard from '../components/SurfaceCard'
import StatusBadge from '../components/StatusBadge'

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function BillingPage() {
  const [config, setConfig] = useState(null)
  const [message, setMessage] = useState('')
  const [loadingCode, setLoadingCode] = useState('')

  async function loadConfig() {
    try {
      const res = await api.get('/billing/config')
      setConfig(res.data)
    } catch (err) {
      setMessage(err.response?.data?.error || err.response?.data?.message || 'Billing details are not available right now.')
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  async function startCheckout(plan) {
    setLoadingCode(plan.code)
    setMessage('')
    try {
      const order = await api.post('/billing/orders', { planCode: plan.code, amount: plan.amount }).then((res) => res.data)
      const ready = await loadRazorpayScript()
      if (!ready || !window.Razorpay) {
        setMessage(`Order ${order.id} created, but Razorpay checkout could not load in this environment.`)
        return
      }

      const rz = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'NeuralProxy',
        description: `${plan.name} plan`,
        order_id: order.id,
        theme: { color: '#2563eb' },
        handler: async (response) => {
          try {
            const confirm = await api.post('/billing/confirm', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            }).then((res) => res.data)
            setMessage(confirm.message || `Plan upgraded to ${confirm.subscription?.planCode}.`)
            await loadConfig()
          } catch (err) {
            setMessage(err.response?.data?.error || 'Payment succeeded but plan confirmation failed.')
          }
        },
        modal: {
          ondismiss: () => setMessage('Checkout closed before payment was completed.')
        }
      })
      rz.open()
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to start billing flow.')
    } finally {
      setLoadingCode('')
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Billing"
        title="Plans and payments"
        description="Upgrade plans, confirm subscription status, and make the value of each tier easy to understand."
        breadcrumbs={[{ label: 'Workspace', to: '/' }, { label: 'Billing' }]}
        meta={[
          { label: 'Active plan', value: config?.currentSubscription?.planCode || 'FREE' },
          { label: 'Gateway', value: config?.enabled ? 'Ready' : 'Setup needed' }
        ]}
      />

      {message ? (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
          {message}
        </div>
      ) : null}

      {config?.currentSubscription ? (
        <div className="mb-6 grid gap-6 xl:grid-cols-[0.75fr,1.25fr]">
          <SurfaceCard title="Current subscription" subtitle="This workspace switches plan immediately after successful confirmation.">
            <div className="flex items-center gap-3">
              <StatusBadge status={config.currentSubscription.subscriptionStatus || config.currentSubscription.planCode} />
              <span className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{config.currentSubscription.planCode}</span>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Billing cycle ends</p>
                <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                  {config.currentSubscription.billingCycleEnd ? new Date(config.currentSubscription.billingCycleEnd).toLocaleDateString() : 'No paid cycle yet'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Requests per minute</p>
                <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{config.currentSubscription.limits?.requestsPerMinute}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Monthly tokens</p>
                <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{config.currentSubscription.limits?.monthlyTokens}</p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Plan limits" subtitle="Explain clearly how many requests, tokens, and analytics depth each plan gets.">
            <div className="grid gap-4 md:grid-cols-3">
              {(config?.plans || []).map((plan) => (
                <div
                  key={plan.code}
                  className={`rounded-3xl border px-4 py-4 ${config.currentSubscription.planCode === plan.code ? 'border-blue-300 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{plan.name}</p>
                    {config.currentSubscription.planCode === plan.code ? <StatusBadge status="ACTIVE" /> : null}
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-50">{plan.amount === 0 ? 'Free' : `Rs ${plan.amount}`}</p>
                  <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <p>{plan.requestsPerMinute} requests per minute</p>
                    <p>{plan.monthlyTokens} tokens per month</p>
                    <p>{plan.savedPrompts}</p>
                    <p>{plan.analytics}</p>
                    <p>{plan.support}</p>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        {(config?.plans || []).map((plan) => (
          <SurfaceCard
            key={plan.code}
            title={plan.name}
            subtitle={`${plan.requestsPerMinute} req/min • ${plan.monthlyTokens} tokens/month`}
            className={plan.code === 'PRO' ? 'ring-1 ring-blue-200 dark:ring-blue-900' : ''}
          >
            <p className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              {plan.amount === 0 ? 'Free' : `Rs ${plan.amount}`}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Monthly plan</p>
            <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p>{plan.savedPrompts}</p>
              <p>{plan.analytics}</p>
              <p>{plan.support}</p>
            </div>
            <button
              type="button"
              onClick={() => startCheckout(plan)}
              disabled={!config?.enabled || loadingCode === plan.code || plan.amount === 0 || config?.currentSubscription?.planCode === plan.code}
              className="button-primary mt-6 w-full justify-center disabled:opacity-50"
            >
              {plan.amount === 0
                ? 'Starter tier'
                : config?.currentSubscription?.planCode === plan.code
                  ? `Current ${plan.name} plan`
                  : loadingCode === plan.code
                    ? 'Starting...'
                    : `Upgrade to ${plan.name}`}
            </button>
          </SurfaceCard>
        ))}
      </div>

      {!config?.enabled ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          Razorpay is not fully configured yet. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the backend environment before taking live payments.
        </div>
      ) : null}
    </div>
  )
}
