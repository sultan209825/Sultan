import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDocFromServer,
  increment,
  DocumentSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SiteConfig } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection on boot
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'config', 'site'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
})();

const CONFIG_DOC_PATH = 'config/site';
const STATS_DOC_PATH = 'stats/live';

/**
 * Real-time subscription to global site config
 * Updates immediately for all visitors when admin saves changes!
 */
export function subscribeToGlobalConfig(onConfigChange: (config: Partial<SiteConfig>) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'site');
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onConfigChange(data as Partial<SiteConfig>);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, CONFIG_DOC_PATH);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, CONFIG_DOC_PATH);
    return () => {};
  }
}

/**
 * Saves global config to Cloud Firestore
 * Propagates in real-time to all connected visitors across the world
 */
export async function saveGlobalConfigToCloud(config: SiteConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, 'config', 'site');
    // Ensure all mandatory fields conform to security rules
    const cleanPayload: Record<string, any> = {
      username: config.username || '! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪',
      handle: config.handle || '5susu',
      bio: config.bio || '3 ثانوي 📖 + GYM 🦾',
      joinYear: config.joinYear || '2020',
      footerDomain: config.footerDomain || 'sultansusu.vercel.app',
      theme: config.theme || 'blood_royal',
      bgEffect: config.bgEffect || 'auto',
      bgStyle: config.bgStyle || 'particle',
      countdownDate: config.countdownDate || '2027-08-25T00:00',
      countdownLabel: config.countdownLabel || 'طريق الثانوية العامة والهدف 🎯',
      socials: config.socials || {},
      socialsEnabled: config.socialsEnabled || {},
      gamerHub: config.gamerHub || null,
      discordWebhookUrl: config.discordWebhookUrl || '',
      discordWebhookEnabled: !!config.discordWebhookEnabled,
      discordAutoRole: config.discordAutoRole || null,
      emailNotifications: config.emailNotifications || null,
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, cleanPayload, { merge: true });
    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, CONFIG_DOC_PATH);
    return { success: false, error: err.message };
  }
}

/**
 * Real-time subscription to global aggregated stats (views, upvotes)
 */
export function subscribeToGlobalStats(
  onStatsChange: (stats: { views?: number; upvotes?: number }) => void
): () => void {
  try {
    const docRef = doc(db, 'stats', 'live');
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onStatsChange({
            views: typeof data?.views === 'number' ? data.views : undefined,
            upvotes: typeof data?.upvotes === 'number' ? data.upvotes : undefined
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, STATS_DOC_PATH);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, STATS_DOC_PATH);
    return () => {};
  }
}

/**
 * Increments live global view counter in Cloud Firestore
 */
export async function incrementGlobalViews(currentViews: number = 0): Promise<void> {
  try {
    const docRef = doc(db, 'stats', 'live');
    await setDoc(
      docRef,
      {
        views: increment(1),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, STATS_DOC_PATH);
  }
}

/**
 * Increments live global upvote counter in Cloud Firestore
 */
export async function incrementGlobalUpvotes(): Promise<void> {
  try {
    const docRef = doc(db, 'stats', 'live');
    await setDoc(
      docRef,
      {
        upvotes: increment(1),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, STATS_DOC_PATH);
  }
}
