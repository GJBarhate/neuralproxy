import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import useStore from '../store/useStore'

export default function useWebSocket() {
  const { token, updateAnalytics, setWsConnected } = useStore()
  const clientRef = useRef(null)

  useEffect(() => {
    if (!token) {
      if (clientRef.current) {
        clientRef.current.deactivate()
        clientRef.current = null
      }
      setWsConnected(false)
      return
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        setWsConnected(true)
        client.subscribe('/topic/analytics', (message) => {
          try {
            const data = JSON.parse(message.body)
            updateAnalytics(data)
          } catch (e) {
            console.warn('WS parse error', e)
          }
        })
      },
      onDisconnect: () => setWsConnected(false),
      onStompError: () => setWsConnected(false)
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setWsConnected(false)
    }
  }, [token, updateAnalytics, setWsConnected])

  return { connected: useStore((s) => s.wsConnected) }
}
