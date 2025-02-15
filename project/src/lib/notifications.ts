import { db } from './firebase';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface NotificationTemplate {
  subject: string;
  body: string;
}

export interface NotificationSetting {
  id: string;
  enabled: boolean;
  template: NotificationTemplate;
}

export const saveNotificationSettings = async (userId: string, settings: NotificationSetting[]) => {
  try {
    // First save settings
    const settingsDoc = doc(db, 'notification_settings', userId);
    await setDoc(settingsDoc, {
      settings: settings.reduce((acc, setting) => ({
        ...acc,
        [setting.id]: {
          enabled: setting.enabled,
          template: setting.template
        }
      }), {}),
      updatedAt: new Date()
    });

    // Log the settings update
    await addDoc(collection(db, 'notification_logs'), {
      userId,
      type: 'settings_update',
      timestamp: new Date(),
      details: { settings }
    });

    return true;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    throw error;
  }
};

export const getNotificationSettings = async (userId: string) => {
  try {
    const settingsDoc = doc(db, 'notification_settings', userId);
    const snapshot = await getDoc(settingsDoc);
    
    if (!snapshot.exists()) {
      // Return default settings if none exist
      return {
        settings: {
          subscription_expiring: {
            enabled: true,
            template: {
              subject: 'Il tuo abbonamento sta per scadere',
              body: 'Il tuo abbonamento scadrà tra {days_left} giorni. Rinnova ora per continuare ad utilizzare tutti i servizi.'
            }
          },
          subscription_expired: {
            enabled: true,
            template: {
              subject: 'Il tuo abbonamento è scaduto',
              body: 'Il tuo abbonamento è scaduto. Rinnova ora per riprendere ad utilizzare tutti i servizi.'
            }
          },
          subscription_renewed: {
            enabled: true,
            template: {
              subject: 'Abbonamento rinnovato con successo',
              body: 'Grazie per aver rinnovato il tuo abbonamento! Il tuo nuovo periodo di abbonamento è attivo fino al {expiry_date}.'
            }
          }
        }
      };
    }

    return snapshot.data();
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw error;
  }
};

export const sendTestNotification = async (email: string): Promise<boolean> => {
  try {
    const sendNotification = httpsCallable(functions, 'sendSubscriptionNotification');
    const result = await sendNotification({
      to: email,
      type: 'custom',
      message: 'Questa è una notifica di test. Le tue preferenze di notifica sono state aggiornate con successo!'
    });

    // Log the test notification
    await addDoc(collection(db, 'notification_logs'), {
      email,
      type: 'test_notification',
      timestamp: new Date(),
      success: true
    });

    return (result.data as any).success || false;
  } catch (error) {
    console.error('Error sending test notification:', error);
    
    // Log the error
    await addDoc(collection(db, 'notification_logs'), {
      email,
      type: 'test_notification',
      timestamp: new Date(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
};