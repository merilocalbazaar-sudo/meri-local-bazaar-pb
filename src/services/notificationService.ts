// =========================================================================
// REAL-TIME PUSH NOTIFICATION & SOUND ENGINE FOR BAZAARX
// Handles:
// 1. Web Audio API synthesized alert chimes (Order chime & Delivery chime)
// 2. Browser Device Push Notifications (Window Notification API + Service Worker)
// 3. In-App Floating Visual Toast Alerts
// 4. Supabase Realtime channel listeners for Sellers & Delivery Partners
// =========================================================================

import { supabase } from '../supabase';
import { createRealtimeChannel } from './dbService';

export interface InAppAlert {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'delivery' | 'payout' | 'system';
  referenceId?: string;
  timestamp: string;
  actionLabel?: string;
  onAction?: () => void;
}

type AlertListener = (alert: InAppAlert) => void;
const alertListeners: Set<AlertListener> = new Set();

// Deduplication cache: keeps track of alerted IDs for 60 seconds
const recentAlertsCache = new Set<string>();
function markAlerted(key: string): boolean {
  if (recentAlertsCache.has(key)) return false;
  recentAlertsCache.add(key);
  setTimeout(() => recentAlertsCache.delete(key), 60000);
  return true;
}

// =========================================================================
// 1. WEB AUDIO API SYNTHESIZER (NO EXTERNAL ASSETS NEEDED, 100% RELIABLE)
// =========================================================================
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.warn('Web Audio API not supported:', err);
    return null;
  }
}

// Auto-unlock AudioContext on first user interaction anywhere
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      }).catch(() => {});
    }
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

/**
 * Plays a cheerful, loud, distinctive dual-bell cash register chime
 * Designed specifically for Sellers receiving a new paid customer order.
 */
export function playOrderAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [
      { freq: 523.25, time: now + 0.00, duration: 0.18 },
      { freq: 659.25, time: now + 0.12, duration: 0.18 },
      { freq: 783.99, time: now + 0.24, duration: 0.22 },
      { freq: 1046.50, time: now + 0.38, duration: 0.45 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      // Main tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      // Bell harmonics
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.35, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);

      // Overtone sparkle (one octave higher, subtle)
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(freq * 2, time);

      sparkleGain.gain.setValueAtTime(0, time);
      sparkleGain.gain.linearRampToValueAtTime(0.12, time + 0.02);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.8);

      sparkle.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);

      sparkle.start(time);
      sparkle.stop(time + duration * 0.8);
    });

    // Device vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([150, 80, 150, 80, 300]);
    }
  } catch (e) {
    console.warn('Could not play order chime:', e);
  }
}

/**
 * Plays an urgent, energetic two-burst dispatch alert
 * Designed specifically for Delivery Partners when an order is assigned.
 */
export function playDeliveryAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Pattern: High beep-beep, short pause, higher beep-beep
    const beeps = [
      { freq: 659.25, time: now + 0.00, duration: 0.12 },
      { freq: 880.00, time: now + 0.14, duration: 0.16 },
      { freq: 659.25, time: now + 0.35, duration: 0.12 },
      { freq: 1174.66, time: now + 0.49, duration: 0.35 },
    ];

    beeps.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square'; // punchy alert timbre
      osc.frequency.setValueAtTime(freq, time);

      // Low pass filter for smoothing square harshness
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.28, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    });

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([250, 100, 250, 100, 400]);
    }
  } catch (e) {
    console.warn('Could not play delivery chime:', e);
  }
}

/**
 * Test sound trigger for checking audio output
 */
export function playTestSound(type: 'order' | 'delivery' = 'order') {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      if (type === 'order') playOrderAlertSound();
      else playDeliveryAlertSound();
    });
  } else {
    if (type === 'order') playOrderAlertSound();
    else playDeliveryAlertSound();
  }
}

// =========================================================================
// 2. DEVICE BROWSER PUSH NOTIFICATIONS (WINDOW NOTIFICATION API)
// =========================================================================

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('bazaarx_notif_granted', 'true');
      // Show confirmation push
      sendDevicePushNotification('🔔 Notifications Enabled!', {
        body: 'You will now receive instant push alerts with sound for every incoming order and assignment.',
        tag: 'setup-success',
      });
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

export function sendDevicePushNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    onClick?: () => void;
  }
) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    const iconUrl =
      options.icon ||
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=128&auto=format&fit=crop&q=80';

    const notif = new Notification(title, {
      body: options.body,
      icon: iconUrl,
      badge: iconUrl,
      tag: options.tag || `bazaarx-${Date.now()}`,
      renotify: true,
      requireInteraction: true, // Keep notification visible until dismissed
      silent: false,
    } as any);

    notif.onclick = () => {
      window.focus();
      notif.close();
      if (options.onClick) options.onClick();
    };
  } catch (err) {
    console.warn('Browser native notification dispatch notice:', err);
  }
}

// =========================================================================
// 3. IN-APP TOAST NOTIFICATION DISPATCHER
// =========================================================================

export function subscribeToInAppAlerts(listener: AlertListener): () => void {
  alertListeners.add(listener);
  return () => {
    alertListeners.delete(listener);
  };
}

export function emitInAppAlert(alert: InAppAlert) {
  alertListeners.forEach((listener) => {
    try {
      listener(alert);
    } catch (e) {
      console.error('Error in alert listener:', e);
    }
  });
}

// =========================================================================
// 4. SELLER REAL-TIME ORDER NOTIFICATION LISTENER
// =========================================================================

/**
 * Attaches a dedicated Supabase Realtime channel for Sellers.
 * Listens for new order items and new orders placed at their shop.
 * Instantly triggers:
 * 1. Web Audio cash register chime
 * 2. Device browser push notification
 * 3. In-App glowing alert banner
 */
export function setupSellerOrderRealtime(
  shopId: string,
  sellerOwnerId: string,
  onNewOrder?: (order: any) => void
): () => void {
  if (!shopId && !sellerOwnerId) return () => {};

  const cleanId = (shopId || sellerOwnerId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const channelName = `seller_alert_${cleanId}_${Date.now()}`;

  const triggerSellerNotification = (orderData: any) => {
    const orderId = orderData.order_id || orderData.id || `ORD-${Date.now()}`;
    const dedupeKey = `seller_ord_${orderId}`;

    if (!markAlerted(dedupeKey)) return;

    // 1. Play audible chime
    playOrderAlertSound();

    const shopTitle = orderData.shop_name ? ` (${orderData.shop_name})` : '';
    const earningText = orderData.seller_earnings
      ? ` • Earn ₹${orderData.seller_earnings}`
      : orderData.seller_subtotal
      ? ` • Total ₹${orderData.seller_subtotal}`
      : '';
    const itemCount = Array.isArray(orderData.items) ? `${orderData.items.length} item(s)` : 'New items';

    const title = `🛍️ New Order Received!`;
    const message = `Order #${orderId}${shopTitle} placed with ${itemCount}${earningText}. Check orders to pack & dispatch!`;

    // 2. Trigger native device push notification
    sendDevicePushNotification(title, {
      body: message,
      tag: `order-${orderId}`,
      onClick: () => {
        window.focus();
        if (onNewOrder) onNewOrder(orderData);
      },
    });

    // 3. Emit in-app banner alert
    emitInAppAlert({
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type: 'order',
      referenceId: orderId,
      timestamp: new Date().toISOString(),
      actionLabel: 'View Order',
      onAction: () => {
        if (onNewOrder) onNewOrder(orderData);
      },
    });

    if (onNewOrder) {
      onNewOrder(orderData);
    }
  };

  // 1. Realtime on seller_orders table
  const channel = createRealtimeChannel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'seller_orders',
      },
      (payload) => {
        const row = payload.new as any;
        if (row && (row.seller_id === shopId || row.seller_id === sellerOwnerId)) {
          triggerSellerNotification(row);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        const notif = payload.new as any;
        if (
          notif &&
          notif.type === 'order' &&
          (notif.user_id === shopId || notif.user_id === sellerOwnerId || notif.recipient_role === 'seller')
        ) {
          triggerSellerNotification({
            order_id: notif.reference_id,
            shop_name: notif.title,
            items: [],
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// =========================================================================
// 5. DELIVERY PARTNER REAL-TIME ASSIGNMENT NOTIFICATION LISTENER
// =========================================================================

/**
 * Attaches a dedicated Supabase Realtime channel for Delivery Partners.
 * Listens for when an order assignment is assigned to them (or broadcast available).
 * Instantly triggers:
 * 1. Web Audio dispatch siren/beep alert
 * 2. Device browser push notification
 * 3. In-App glowing alert banner
 */
export function setupDeliveryPartnerRealtime(
  partnerId: string,
  onNewAssignment?: (assignment: any) => void
): () => void {
  if (!partnerId) return () => {};

  const cleanId = partnerId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const channelName = `delivery_alert_${cleanId}_${Date.now()}`;

  const triggerDeliveryNotification = (asgnData: any, isDirectAssignment: boolean) => {
    const asgnId = asgnData.id || asgnData.order_id || `ASGN-${Date.now()}`;
    const dedupeKey = `dp_asgn_${asgnId}_${asgnData.status || 'asgn'}`;

    if (!markAlerted(dedupeKey)) return;

    // 1. Play audible dispatch siren
    playDeliveryAlertSound();

    const earning = asgnData.earning_amount || asgnData.earningAmount || 35;
    const shopName = asgnData.shop_name || asgnData.shopName || 'Local Shop';
    const pickupLoc = asgnData.shop_address || asgnData.shopAddress || 'Local Market';

    const title = isDirectAssignment
      ? `🛵 Order Assigned to You!`
      : `📦 New Delivery Available Nearby!`;

    const message = isDirectAssignment
      ? `Order #${asgnData.order_id || asgnId} from ${shopName} is assigned to you! Pickup: ${pickupLoc}. Earn ₹${earning}.`
      : `Delivery #${asgnData.order_id || asgnId} is ready for pickup at ${shopName} (Earn ₹${earning}). Accept now!`;

    // 2. Trigger native device push notification
    sendDevicePushNotification(title, {
      body: message,
      tag: `assignment-${asgnId}`,
      onClick: () => {
        window.focus();
        if (onNewAssignment) onNewAssignment(asgnData);
      },
    });

    // 3. Emit in-app banner alert
    emitInAppAlert({
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type: 'delivery',
      referenceId: asgnId,
      timestamp: new Date().toISOString(),
      actionLabel: isDirectAssignment ? 'View Pickup' : 'Accept Delivery',
      onAction: () => {
        if (onNewAssignment) onNewAssignment(asgnData);
      },
    });

    if (onNewAssignment) {
      onNewAssignment(asgnData);
    }
  };

  // Realtime on delivery_assignments table
  const channel = createRealtimeChannel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'delivery_assignments',
      },
      (payload) => {
        const row = payload.new as any;
        if (!row) return;

        // Check if assigned specifically to this rider
        if (row.delivery_partner_id === partnerId && row.status === 'assigned') {
          triggerDeliveryNotification(row, true);
        } else if (payload.eventType === 'INSERT' && row.status === 'available') {
          // New unassigned delivery broadcast in region
          triggerDeliveryNotification(row, false);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        const notif = payload.new as any;
        if (
          notif &&
          notif.type === 'delivery' &&
          (notif.user_id === partnerId || notif.recipient_role === 'delivery_partner')
        ) {
          triggerDeliveryNotification(
            {
              id: notif.reference_id,
              order_id: notif.reference_id,
              shop_name: notif.title,
            },
            notif.user_id === partnerId
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
