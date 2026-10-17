# העברת מקל לאייג'נט הבא — Urbanito (16.10.2026)

> **המשימה הבאה:** להפיץ את אפליקציית האנדרואיד הנייטיב (`native-android/`) לבודקים דרך **Firebase App Distribution**.
> קרא את כל המסמך לפני שאתה מריץ משהו. כל הערכים הסודיים (טוקנים, סיסמאות) **לא** מופיעים כאן — רק איפה הם נמצאים.

---

## 1. מצב הקוד — ענפים ו-PR-ים

| ענף | קומיט | מה יש בו | PR |
|---|---|---|---|
| `main` | `503ba84` | המצב שלפני העבודה הזו | — |
| `feature/mapbox-open-data` | `4940825` | אפליקציית הווב/Capacitor: מנוע מסלולים חינמי, מפת Mapbox במקום Google Maps, פלטה חדשה | [#1](https://github.com/Arnonfr/Urbanito/pull/1) → `main` |
| `feature/native-android` | `d340046` | **אפליקציית אנדרואיד נייטיב** (Kotlin + Compose) — זו שצריך להפיץ | [#2](https://github.com/Arnonfr/Urbanito/pull/2) → `feature/mapbox-open-data` |

- סדר מיזוג: קודם #1, אחר כך #2 (GitHub יעביר את הבסיס של #2 ל-`main` אוטומטית).
- **אל תיגע** בשינויים הלא-מקומטים של הבעלים ב-`services/geminiService.ts` וב-`services/supabase.ts` (פונקציית `logApiCost` → טבלת `api_cost_log`). הם עבודה בתהליך של הבעלים, נשמרו בכוונה מחוץ לכל קומיט.
- ה-checkout הנוכחי בתיקייה הזו: ענף `feature/native-android`.

---

## 2. מה נעשה (בקצרה)

### 2.1 מנוע מסלולים חינמי (open data)
- **ווב:** `services/openDataRouteEngine.ts`. **נייטיב:** `native-android/app/src/main/java/com/urbanito/walk/data/OpenDataEngine.kt` (פורט 1:1).
- מקורות: Wikipedia geosearch (he+en) → Wikidata (SPARQL, עם API רגיל כגיבוי אחרי 3.5 שניות) → תקצירי ויקיפדיה. סידור התחנות מקומי (nearest-neighbour + 2-opt), הערכת זמני הליכה מקומית.
- תוצאה: מקומות אמיתיים, תמונות, עובדות (שנה, אדריכל, סגנון, מעמד מורשת), **0 קריאות AI למסלול**.
- בווב: Gemini נשאר רק כגיבוי (בקשה חופשית, נושאי אוכל/חיי לילה/קניות, אזור דל) ולתוכן פרימיום/מאמרים שקיימים רק באנגלית — ואז הוא מקבל את טקסט ויקיפדיה כבסיס עובדתי.

### 2.2 אפליקציית הווב / Capacitor (PR #1)
- Google Maps הוסר. `services/mapbox/googleMapsCompat.ts` מממש את תת-ה-API של `google.maps` שהאפליקציה משתמשת בו, על גבי Mapbox GL — כדי לא לשכתב 40 מקומות ב-`App.tsx`.
- פלטה: `theme/palette.ts` + override ל-Tailwind ב-`index.html` (`indigo` → סגול עמוק `#4F2D96`, `slate` → נייטרלים "נייר", `signal` כתום `#E2602F`, כותרות Suez One).
- הטוקן: `VITE_MAPBOX_TOKEN` ב-`.env.local` (מקומי) ו-secret `MAPBOX_TOKEN` ב-CI (**עוד לא הוגדר ב-GitHub!** ראה סעיף 6).

### 2.3 אפליקציית אנדרואיד נייטיב (PR #2) — `native-android/`
- Kotlin 2.2.10, AGP 8.13, Compose BOM 2025.10.01, **Mapbox Maps SDK 11.32.0** (Maven ציבורי, לא צריך secret token להורדה), OkHttp, Coil 3.
- applicationId: **`com.urbanito.walk`** (מותקן לצד אפליקציית Capacitor `com.urbanito.app`). versionCode `1`, versionName `0.1.0`.
- מסכים: מפה בסגנון "נייר" + גיליון הגדרות (מסננים, סליידר מרחק, אפשרויות נוספות, "בניית מסלול") + גיליון מסלול (פרטי מסלול, רשימת תחנות עם ציר זמן הליכה) + מסך תחנה (עובדות, סיפור מלא מוויקיפדיה, הקראה TTS של המכשיר, ניווט, מקורות). עברית RTL.
- טוקן Mapbox נקרא מ-`native-android/local.properties` (`MAPBOX_TOKEN=...`) או ממשתנה סביבה `MAPBOX_TOKEN`. הקובץ ב-`.gitignore` ו**כבר קיים במק הזה**.
- נבדק באמולטור `subty_api35`: מפה, בניית מסלול בתל אביב, מסך תחנה, הקראה בעברית — עובדים. **לא נבדק על מכשיר אמיתי.**

---

## 3. עלויות

> מחירים ומכסות חינם — **לאמת בדפי התמחור** לפני החלטות; אלה הנתונים כפי שידועים לי ומסומנים בהתאם.

### לפני (המצב ב-`main`)
לכל מסלול: קריאת Gemini גדולה ליצירת המסלול, **קריאת Gemini לכל תחנה** (העשרה אוטומטית), קריאת Gemini לתרגום הכותרת, חיפוש תמונה ב-Google Places לכל תמונה, Google Directions לכל טעינת מסלול, Distance Matrix כשחסרים זמני הליכה, טעינות Maps JS. הקראה: Gemini TTS לכל המשתמשים.
- תעריף Gemini שהבעלים קודד ב-`logApiCost`: $0.075 למיליון טוקני קלט, $0.30 למיליון טוקני פלט (טקסט בלבד; TTS לא נמדד).
- ה-Google Cloud project של המפות במצב `ProjectDeniedMapError` — כלומר המפה בכלל לא עבדה.

### אחרי
| פעולה | נייטיב (`com.urbanito.walk`) | ווב/Capacitor (PR #1) | עלות |
|---|---|---|---|
| בחירת תחנות + מידע | Wikipedia/Wikidata | Wikipedia/Wikidata | **חינם** (מדיניות שימוש: User-Agent מזוהה, בלי הצפה) |
| AI | אין | רק גיבוי / פרימיום | 0 ברוב המסלולים |
| שם העיר (reverse geocoding) | 1 קריאת Mapbox | 1–2 קריאות Mapbox | בתוך מכסת חינם (Geocoding: ~100K/חודש, לא מאומת) |
| קו הליכה אמיתי | 1 קריאת Mapbox Directions | 1, עם cache מקומי | בתוך מכסת חינם (~100K/חודש, לא מאומת) |
| מפה | Mapbox Mobile SDK | Mapbox GL JS | חינם עד ~25K משתמשים פעילים בחודש (מובייל) / ~50K טעינות (ווב) — לא מאומת |
| הקראה | TTS של המכשיר | Gemini TTS (לא שונה) | נייטיב: חינם |

נמדד בפועל בדפדפן: מסלול שלם בפריז — **אפס בקשות ל-Gemini ואפס ל-Google**.

### עלויות פיתוח בסשן הזה
אין חיובים ידועים: רק קריאות Mapbox (במכסת חינם) ו-Wikimedia. לא נוצרו משאבים בענן.

---

## 4. איך לבנות את האפליקציה הנייטיב

1. **JDK 21** (גם 17 עובד ל-Kotlin; AGP 8.13 דורש 17+). ה-JDK ששימש אותי היה בתיקייה זמנית ואולי נמחק — התקן Temurin 21 או השתמש ב-JBR של Android Studio.
2. **Android SDK:** `~/Library/Android/sdk` (compileSdk 36 מותקן).
3. **`native-android/local.properties`** (קיים במק הזה):
   ```
   sdk.dir=/Users/hyh/Library/Android/sdk
   MAPBOX_TOKEN=<הערך של VITE_MAPBOX_TOKEN מתוך /Users/hyh/Urbanito/.env.local>
   ```
4. בנייה:
   ```bash
   cd /Users/hyh/Urbanito/native-android
   export JAVA_HOME=<JDK 21>
   ./gradlew :app:assembleDebug
   # → app/build/outputs/apk/debug/app-debug.apk
   ```

**שים לב:** ה-APK של debug שוקל **~128MB** כי הוא כולל את הספריות הנייטיב של Mapbox לכל ארכיטקטורות המעבד. לפני הפצה כדאי לצמצם, למשל ב-`native-android/app/build.gradle.kts` בתוך `defaultConfig`:
```kotlin
ndk { abiFilters += listOf("arm64-v8a") }   // מכשירי אנדרואיד מודרניים
```
(לא נבדק כמה זה חוסך; לבדוק גודל אחרי הבנייה. האמולטור במק הזה הוא arm64 ולכן ימשיך לעבוד.)

---

## 5. הפצה ל-Firebase App Distribution — צעד אחר צעד

**עובדות שבדקתי (16.10.2026, קריאה בלבד):**
- פרויקט Firebase: `gen-lang-client-0224015230` (project number `966802127078`), מוגדר ב-`.firebaserc`.
- בפרויקט יש אפליקציית אנדרואיד **אחת** בלבד: "Urbanito Android", `1:966802127078:android:774dffd136d95ecfa3e327`, חבילה `com.urbanito.app` (אפליקציית Capacitor).
- **אין עדיין אפליקציה ל-`com.urbanito.walk`** — צריך לרשום.
- App Distribution: **אין קבוצות בודקים**, יש **בודק אחד** בפרויקט.
- `firebase-tools` 15.14.0 מותקן כ-devDependency, וה-CLI **מחובר** במק הזה עם חשבון הבעלים.

> ⚠️ רישום אפליקציה ושליחת הפצה הן פעולות חיצוניות (יוצרות משאב, שולחות מיילים לבודקים). **לאשר עם המשתמש לפני כל אחת**, כולל רשימת הבודקים ותוכן הערות השחרור.

1. **רישום האפליקציה ב-Firebase** (פעם אחת, אחרי אישור):
   ```bash
   cd /Users/hyh/Urbanito
   npx firebase apps:create ANDROID "Urbanito Native" --package-name com.urbanito.walk --project gen-lang-client-0224015230
   ```
   שמור את ה-App ID שיחזור (`1:966802127078:android:...`).
   - אין צורך ב-`google-services.json` להפצה בלבד (האפליקציה לא משתמשת ב-Firebase SDK).
2. **גרסה:** להעלות `versionCode` (ו-`versionName`) ב-`native-android/app/build.gradle.kts` בכל הפצה חדשה.
3. **חתימה:** ל-debug חותמים עם `~/.android/debug.keystore` של המק הזה. בודקים יוכלו לעדכן רק אם כל ההפצות נחתמות באותו מפתח — לכן להפיץ תמיד מאותו מק, או להגדיר `signingConfig` ייעודי (מפתח חדש לאפליקציה הזו; **לא** את ה-keystore של `com.urbanito.app` בלי החלטה של הבעלים).
4. **בנייה** (סעיף 4), אחרי צמצום ה-ABI אם הוחלט.
5. **הפצה** (אחרי אישור על הבודקים):
   ```bash
   cd /Users/hyh/Urbanito
   npx firebase appdistribution:distribute native-android/app/build/outputs/apk/debug/app-debug.apk \
     --app <APP_ID_מצעד_1> \
     --project gen-lang-client-0224015230 \
     --testers "<אימיילים מהמשתמש>" \
     --release-notes "Urbanito נייטיב 0.1.0 — מסלולי הליכה חינמיים מוויקיפדיה, מפת Mapbox, הקראה בעברית"
   ```
   אפשר ליצור קבוצה (`appdistribution:groups:create`) ולהשתמש ב-`--groups`.
6. **אימות:** בקונסולת Firebase → App Distribution → האפליקציה החדשה: הגרסה מופיעה, הבודקים קיבלו הזמנה. אם אפשר — להתקין מקישור הבודק על מכשיר אמיתי ולבדוק: מיקום, בניית מסלול, מסך תחנה, הקראה.
7. **(רשות) CI:** להוסיף workflow לנייטיב בדומה ל-`.github/workflows/android-distribute.yml` — עם secrets חדשים `FIREBASE_NATIVE_APP_ID` ו-`MAPBOX_TOKEN` (שם הקובץ `local.properties` לא קיים ב-CI; ה-build קורא את `MAPBOX_TOKEN` מהסביבה).

### ⚠️ הפצת אפליקציית Capacitor (`com.urbanito.app`) — שים לב
- `.github/workflows/android-distribute.yml` רץ אוטומטית ב-**push ל-`main`** ומפיץ ל-Firebase. `deploy.yml` מעלה ל-Firebase Hosting באותו טריגר.
- **מיזוג PR #1 יפעיל את שניהם.** לפני מיזוג: להוסיף ב-GitHub secret בשם `MAPBOX_TOKEN` (אותו ערך כמו ב-`.env.local`), אחרת ייצא build בלי מפה.

---

## 6. בעיות פתוחות שכדאי לדעת

1. **Supabase מושבת:** `xrawvyvcyewjmlzypnqc.supabase.co` מחזיר NXDOMAIN — שמירה, ספרייה קהילתית, cache והתחברות לא עובדים באפליקציית הווב. הכתובת גם hard-coded ב-`services/supabase.ts` (לא קוראת `VITE_SUPABASE_URL`). הנייטיב לא תלויה ב-Supabase.
2. **סיסמאות keystore** של `com.urbanito.app` כתובות כ-literal ב-`android/app/build.gradle` ומקומטות ב-GitHub — להעביר ל-secrets ולשקול החלפה.
3. **מפתח Gemini נארז בבאנדל הווב** (`vite.config.ts` → `define: process.env`).
4. ב-`/Users/hyh/Urbanito` התקנת npm דורשת `--force` במק (devDependency `@rollup/rollup-linux-arm64-gnu` מיועדת ל-Linux בלבד).
5. נייטיב — עוד לא קיים: שמירת מסלולים/אופליין, שיתוף, מתג אנגלית, תוויות מפה בעברית, גרירת הגיליון מתנגשת בגלילה (כרגע מרחיבים בהקשה על הכותרת), בניית release/AAB.
6. אמולטור `subty_api35` משותף עם פרויקטים אחרים; תצוגה רגילה שלו: `wm size 390x892`, `wm density 420` — להחזיר אם משנים.

---

## 7. קבצים חשובים

| קובץ | תפקיד |
|---|---|
| `native-android/README.md` | הוראות בנייה לנייטיב |
| `native-android/app/build.gradle.kts` | גרסה, applicationId, טוקן, תלויות |
| `native-android/.../data/OpenDataEngine.kt` | מנוע המסלולים (נייטיב) |
| `native-android/.../data/MapboxService.kt` | גאוקודינג + מסלול הליכה |
| `native-android/.../ui/*` | מסכים, עיצוב (`theme/Theme.kt`) |
| `services/openDataRouteEngine.ts` | מנוע המסלולים (ווב) |
| `services/mapbox/googleMapsCompat.ts` | שכבת Mapbox לאפליקציית הווב |
| `theme/palette.ts`, `index.html` | פלטת הצבעים בווב |
| `.github/workflows/android-distribute.yml` | הפצת Capacitor ל-Firebase (על push ל-main) |

זיכרון הפרויקט (Obsidian): `/Users/hyh/Documents/arnon/01 Projects/urbanito-your-urban-guide-2/` — `Current State.md`, `Backlog.md`, `Decisions.md`, `UX Feedback.md`. לעדכן בסוף העבודה לפי `CLAUDE.md` / `AGENTS.md` שבתיקייה הזו.

**העדפת המשתמש:** כל התקשורת איתו — בעברית.
