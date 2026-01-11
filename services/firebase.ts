
// Fix: Using modular Firebase functions via namespaced import to avoid "no exported member" errors in specific build environments
import * as firebaseApp from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  limit, 
  serverTimestamp,
  Firestore 
} from "firebase/firestore";
import { Route } from "../types";

// Fix: Destructure functions from the namespace to maintain the modular syntax while resolving the type errors
const { initializeApp, getApps, getApp } = firebaseApp as any;

const firebaseConfig = {
  apiKey: "AIzaSyC0N098xYS15TAjlri0FVOfY-OVAqRs7KE",
  authDomain: "tours-a22af.firebaseapp.com",
  projectId: "tours-a22af",
  storageBucket: "tours-a22af.firebasestorage.app",
  messagingSenderId: "559289255286",
  appId: "1:559289255286:web:79b07ba5eda92c33442657"
};

let db: Firestore;

try {
  // Fix: Using the modular functions extracted above to initialize the app
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase init error:", e);
}

export { db };

/**
 * Searches for a cached route for a specific city in the 'public_routes' collection.
 */
export const findCachedRoute = async (city: string): Promise<Route | null> => {
  if (!db) return null;
  try {
    const q = query(
      collection(db, "public_routes"), 
      where("city", "==", city), 
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      return { ...data, id: querySnapshot.docs[0].id } as Route;
    }
  } catch (e) {
    console.warn("Firestore findCachedRoute error:", e);
  }
  return null;
};

/**
 * Caches a newly generated route in the 'public_routes' collection.
 */
export const cacheRoute = async (route: Route) => {
  if (!db) return;
  try {
    await addDoc(collection(db, "public_routes"), {
      ...route,
      cachedAt: serverTimestamp()
    });
    console.log("Route successfully cached in Firebase.");
  } catch (e) {
    console.error("Firestore cacheRoute error:", e);
  }
};

/**
 * Saves a route to the user's personal 'saved_routes' collection.
 */
export const saveRouteToFirebase = async (route: Route): Promise<string | null> => {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, "saved_routes"), {
      ...route,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error("Firestore saveRoute error:", e);
    return null;
  }
};

/**
 * Retrieves all routes from the user's 'saved_routes' collection.
 */
export const getSavedRoutesFromFirebase = async (): Promise<Route[]> => {
  if (!db) return [];
  try {
    const querySnapshot = await getDocs(collection(db, "saved_routes"));
    return querySnapshot.docs.map(doc => ({ 
      ...doc.data(), 
      id: doc.id 
    } as Route));
  } catch (e) {
    console.error("Firestore getSavedRoutes error:", e);
    return [];
  }
};

/**
 * Deletes a route from the user's 'saved_routes' collection.
 */
export const deleteRouteFromFirebase = async (firebaseId: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "saved_routes", firebaseId));
    console.log(`Deleted route with ID: ${firebaseId}`);
  } catch (e) {
    console.error("Firestore deleteRoute error:", e);
  }
};
