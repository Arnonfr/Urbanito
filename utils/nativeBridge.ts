
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';

const isNative = Capacitor.isNativePlatform();

export const nativeBridge = {
    /**
     * Trigger a subtle vibration for feedback
     */
    hapticImpact: async (style: ImpactStyle = ImpactStyle.Light) => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style });
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    },

    /**
     * Trigger a success vibration
     */
    hapticSuccess: async () => {
        if (!isNative) return;
        try {
            await Haptics.notification({ type: 'success' as any });
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    },

    isNative: () => isNative,

    /**
     * Share a link or text using native share sheet
     */
    share: async (options: { title?: string; text?: string; url?: string }) => {
        const { title, text, url } = options;
        if (isNative) {
            try {
                await Share.share({
                    title,
                    text,
                    url,
                    dialogTitle: 'Share with Urbanito',
                });
                return true;
            } catch (e) {
                console.warn('Share failed', e);
                return false;
            }
        } else if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    },

    /**
     * Initialize status bar styling
     */
    initStatusBar: async (color: string = '#ffffff', darkButtons: boolean = true) => {
        if (!isNative) return;
        try {
            await StatusBar.setBackgroundColor({ color });
            await StatusBar.setStyle({ style: darkButtons ? Style.Light : Style.Dark });
        } catch (e) {
            console.warn('StatusBar not available', e);
        }
    },

    /**
     * Show a local notification
     */
    showNotification: async (title: string, body: string, id: number = 1) => {
        if (!isNative) {
            console.log('Notification (Web):', title, body);
            return;
        }
        try {
            const permission = await LocalNotifications.checkPermissions();
            if (permission.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id,
                        schedule: { at: new Date(Date.now() + 1000) },
                        sound: 'default',
                        attachments: [],
                        actionTypeId: '',
                        extra: null,
                    },
                ],
            });
        } catch (e) {
            console.warn('Notification failed', e);
        }
    },

    /**
     * Handle OAuth deep link callback (Android/iOS).
     * When the user completes Google Sign-In in the external browser,
     * the redirect URL opens the app via deep link. This listener
     * extracts the auth tokens from the URL and sets them in the page hash
     * so Supabase client can pick them up.
     */
    handleAuthCallback: (onComplete?: () => void) => {
        if (!isNative) return () => { };

        let handler: any = null;
        const init = async () => {
            handler = await App.addListener('appUrlOpen', (event) => {
                const url = event.url;
                console.log('[nativeBridge] App opened with URL:', url);

                if (url.includes('auth/callback') || url.includes('access_token')) {
                    // Extract the hash/query part containing tokens
                    const hashPart = url.split('#')[1];
                    const queryPart = url.split('?')[1];
                    const tokenPart = hashPart || queryPart;

                    if (tokenPart) {
                        // Set the hash so Supabase client can detect the tokens
                        window.location.hash = tokenPart;
                        console.log('[nativeBridge] Auth tokens extracted, setting hash');
                        onComplete?.();
                    }
                }
            });
        };
        init();

        return () => {
            if (handler) handler.remove();
        };
    },

    /**
     * Handle Android Back Button
     */
    onBackButton: (callback: () => void) => {
        if (!isNative) return () => { };

        let handler: any = null;
        const init = async () => {
            handler = await App.addListener('backButton', () => {
                callback();
            });
        };
        init();

        return () => {
            if (handler) handler.remove();
        };
    }
};
