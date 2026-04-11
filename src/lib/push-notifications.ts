import { toast } from 'react-hot-toast';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const registerPushNotifications = async (publicVapidKey: string, userId: string, hospitalId: string) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push Notifications are not supported in this browser');
    return null;
  }

  try {
    // 1. Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    // 2. Request Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
       throw new Error('Notification permission denied');
    }

    // 3. Subscribe to Push Manager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    // 4. Save Subscription to Backend
    const response = await fetch('/api/notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        userId,
        hospitalId
      })
    });

    if (!response.ok) throw new Error('Failed to save push subscription');

    toast.success('System notifications enabled');
    return subscription;
  } catch (error: any) {
    console.error('Push Registration Error:', error);
    toast.error(error.message || 'Push registration failed');
    return null;
  }
};
