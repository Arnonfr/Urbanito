
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SYSTEM_USER_ID = '63a80fa9-b66d-42e6-af0e-26c10a2b3b40';

interface RoutePoi {
    name: string;
    name_he: string;
    lat: number;
    lng: number;
    desc_en: string;
    desc_he: string;
    history?: string; // Hebrew history context
    arch?: string;   // Hebrew architectural context
    category?: string;
}

interface RouteDef {
    name: string;
    name_he: string;
    description: string;
    description_he: string;
    pois: RoutePoi[];
}

const BERLIN_ROUTES: RouteDef[] = [
    {
        name: "Classic Berlin Icons",
        name_he: "הקלאסיקות של ברלין",
        description: "The absolute must-sees of Berlin from the Gate to the Tower.",
        description_he: "אתרי החובה המוחלטים של ברלין, משער ברנדנבורג ועד מגדל הטלוויזיה. סיור שעובר דרך ציוני הדרך המפורסמים ביותר של העיר ומספר את סיפורה ההיסטורי והמודרני.",
        pois: [
            {
                name: "Brandenburg Gate",
                name_he: "שער ברנדנבורג",
                lat: 52.5163,
                lng: 13.3777,
                desc_en: "The most famous landmark of Berlin, symbolizing unity and peace.",
                desc_he: "הסמל המזוהה ביותר עם ברלין. השער, שנבנה במאה ה-18, היווה בעבר סמל לחלוקה אך כיום הוא סמל לאחדות ושלום.",
                history: "במקור נבנה כשער שלום, אך הפך לסמל הכוח הנאצי ולאחר מכן לסמל המלחמה הקרה כשעמד על קו התפר של החומה. בשנת 1989, עם נפילת החומה, נחגג כאן האיחוד מחדש.",
                category: "history"
            },
            {
                name: "Reichstag Building",
                name_he: "בניין הרייכסטאג",
                lat: 52.5186,
                lng: 13.3762,
                desc_en: "Home of the German parliament, featuring a stunning glass dome.",
                desc_he: "משכן הפרלמנט הגרמני (הבונדסטאג). המבנה ההיסטורי משלב אדריכלות קלאסית עם כיפת זכוכית מודרנית ומרשימה המציעה תצפית על העיר.",
                arch: "השילוב בין המבנה המקורי הכבד והמרשים לבין הכיפה השקופה והקלילה של האדריכל נורמן פוסטר מסמל את השקיפות של הדמוקרטיה הגרמנית החדשה.",
                category: "architecture"
            },
            {
                name: "Memorial to the Murdered Jews of Europe",
                name_he: "אנדרטת השואה",
                lat: 52.5139,
                lng: 13.3787,
                desc_en: "A poignant memorial consisting of 2,711 concrete slabs.",
                desc_he: "אנדרטה עוצמתית ומרגשת המורכבת מ-2,711 קוביות בטון בגבהים שונים, היוצרת תחושת בלבול, אובדן ואי-נוחות מכוונת.",
                history: "האנדרטה נחנכה בשנת 2005 ותוכננה על ידי האדריכל פיטר אייזנמן. היא ממוקמת בלב העיר, סמוך לשער ברנדנבורג, כעדות וזיכרון נצחי לנספים.",
                category: "history"
            },
            {
                name: "Unter den Linden",
                name_he: "שדרות אונטר דן לינדן",
                lat: 52.5170,
                lng: 13.3888,
                desc_en: "The magnificent boulevard leading from the gate to the cathedral.",
                desc_he: "השדרה המפוארת והמרכזית של ברלין, 'תחת עצי התרזה', המחברת בין שער ברנדנבורג לאי המוזיאונים.",
                desc_he: "לאורך השדרה ניצבים מבנים היסטוריים חשובים, שגרירויות, האוניברסיטה ולבסוף - הקתדרלה המרשימה.",
                category: "culture"
            },
            {
                name: "Berlin Cathedral",
                name_he: "ברלינר דום",
                lat: 52.5190,
                lng: 13.4010,
                desc_en: "Berlin's largest church with a magnificent green dome.",
                desc_he: "הקתדרלה הגדולה והמרשימה ביותר בברלין, עם כיפתה הירוקה האיקונית והעיצוב המפואר בסגנון נאו-רנסאנס.",
                arch: "המבנה הנוכחי נבנה במאה ה-19 ושרד (עם נזקים) את מלחמת העולם השנייה. ניתן לעלות לכיפה לתצפית מרהיבה.",
                category: "religion"
            },
            {
                name: "Alexanderplatz",
                name_he: "אלכסנדרפלאץ",
                lat: 52.5219,
                lng: 13.4132,
                desc_en: "The bustling central square of East Berlin, dominated by the TV Tower.",
                desc_he: "הכיכר המרכזית והתוססת של מזרח ברלין לשעבר, הנשלטת על ידי מגדל הטלוויזיה (Fernsehturm) הנראה כמעט מכל מקום בעיר.",
                history: "הכיכר הייתה הלב הפועם של מזרח גרמניה הקומוניסטית, ועד היום היא משמרת את האדריכלות הסוציאליסטית המונומנטלית סביבה.",
                category: "urban"
            }
        ]
    },
    {
        name: "Jewish Heritage Walk",
        name_he: "מורשת יהודית בברלין",
        description: "Exploring the deep history of the Jewish quarter in Mitte.",
        description_he: "סיור במעמקי ההיסטוריה של הרובע היהודי במיטה (Mitte). מסע מרגש בין חצרות נסתרות, בתי כנסת ואנדרטאות זיכרון.",
        pois: [
            {
                name: "Hackesche Höfe",
                name_he: "האקשה הפה",
                lat: 52.5230,
                lng: 13.4020,
                desc_en: "Germany's largest enclosed courtyard complex, beautifully restored.",
                desc_he: "מערכת החצרות הפנימיות הגדולה בגרמניה. שילוב מרהיב של ארכיטקטורת אר-דקו (Art Deco), בתי קפה, גלריות והיסטוריה יהודית עשירה.",
                arch: "חזיתות המבנים בחצר הראשונה מעוטרות באריחי קרמיקה צבעוניים בסגנון יוגנדשיל (אר נובו גרמני), ששוחזרו בקפדנות לאחר האיחוד.",
                category: "architecture"
            },
            {
                name: "New Synagogue Berlin",
                name_he: "בית הכנסת החדש",
                lat: 52.5246,
                lng: 13.3953,
                desc_en: "Once the largest synagogue in Germany, known for its golden dome.",
                desc_he: "בית הכנסת החדש ברחוב אורניינבורגר, עם כיפת הזהב המפורסמת שלו. בעבר היה הגדול והמפואר ביותר בגרמניה.",
                history: "ניצל מהריסה מוחלטת בליל הבדולח בזכות שוטר גרמני אמיץ, אך נפגע קשות בהפצצות. כיום משמש כמרכז יהודי (Centrum Judaicum).",
                category: "religion"
            },
            {
                name: "Old Jewish Cemetery",
                name_he: "בית הקברות היהודי הישן",
                lat: 52.5290,
                lng: 13.3980,
                desc_en: "The site of the first Jewish cemetery in Berlin.",
                desc_he: "מקום מנוחתם של יהודי ברלין הראשונים, כולל הפילוסוף משה מנדלסון. המקום נהרס על ידי הגסטפו ב-1943 וכיום הוא פארק זיכרון שקט.",
                category: "history"
            },
            {
                name: "Otto Weidt's Workshop for the Blind",
                name_he: "מוזיאון אוטו ויידט",
                lat: 52.5238,
                lng: 13.4022,
                desc_en: "The workshop where Otto Weidt protected his Jewish employees.",
                desc_he: "בית המלאכה למטאטאים ומברשות של אוטו ויידט, אשר סיכן את חייו כדי להגן על עובדיו היהודים העיוורים והחירשים מפני הגירוש.",
                history: "סיפור גבורה אנושי בלב האפלה. המקום נשמר בצורתו המקורית ומספר את סיפורם האישי של הניצולים.",
                category: "history"
            },
            {
                name: "Rosenstraße Protest Memorial",
                name_he: "אנדרטת מחאת רוזנשטראסה",
                lat: 52.5210,
                lng: 13.4030,
                desc_en: "Site of the only successful mass protest by Germans against deportation.",
                desc_he: "המקום בו התקיימה מחאת הנשים הגרמניות ב-1943, שהצליחו למנוע את גירוש בעליהן היהודים - המחאה ההמונית המוצלחת היחידה בגרמניה הנאצית.",
                category: "history"
            }
        ]
    },
    {
        name: "Cold War & The Wall",
        name_he: "המלחמה הקרה והחומה",
        description: "Tracing the path of the Berlin Wall and Checkpoint Charlie.",
        description_he: "בעקבות חומת ברלין, צ׳ק פוינט צ׳ארלי והחיים בצל המלחמה הקרה. סיור מרתק לאורך קו התפר שחצה את העיר במשך 28 שנה.",
        pois: [
            {
                name: "Checkpoint Charlie",
                name_he: "צ׳ק פוינט צ׳ארלי",
                lat: 52.5074,
                lng: 13.3904,
                desc_en: "The most famous border crossing between East and West Berlin.",
                desc_he: "נקודת המעבר המפורסמת ביותר בין המערב למזרח. סמל למתיחות הבין-מעצמתית וזירת התרחשויות של סיפורי ריגול ומבריחים.",
                history: "כאן עמדו טנקים אמריקאים וסובייטים קנה מול קנה בשנת 1961, ברגע שכמעט הצית מלחמת עולם שלישית.",
                category: "history"
            },
            {
                name: "Topography of Terror",
                name_he: "טופוגרפיה של הטרור",
                lat: 52.5056,
                lng: 13.3845,
                desc_en: "Site of the former Gestapo and SS headquarters.",
                desc_he: "מוזיאון פתוח הממוקם על חורבות מפקדת הגסטפו וה-SS. מקום מצמרר המספר את תולדות מנגנוני הדיכוי הנאציים.",
                arch: "לצד המוזיאון נחשף קטע מקורי וארוך של חומת ברלין שלא נהרס.",
                category: "history"
            },
            {
                name: "Potsdamer Platz",
                name_he: "כיכר פוטסדאם",
                lat: 52.5096,
                lng: 13.3765,
                desc_en: "Once a wasteland divided by the wall, now a modern hub.",
                desc_he: "דוגמה לתחייה של ברלין. הכיכר שהייתה שטח הפקר מת ושומם במשך עשורים (No Man's Land), הפכה למרכז המודרני והתוסס ביותר בעיר.",
                category: "architecture"
            },
            {
                name: "Berlin Wall Memorial",
                name_he: "אתר הנצחה לחומה (ברנאוור)",
                lat: 52.5352,
                lng: 13.3900,
                desc_en: "The official memorial site containing the last fully preserved section of the Wall.",
                desc_he: "אתר ההנצחה הרשמי והחשוב ביותר לחומה ברחוב ברנאוור. כאן ניתן לראות את 'רצועת המוות' המקורית בשלמותה, כולל מגדל השמירה.",
                history: "רחוב זה היה מוקד של טרגדיות רבות וניסיונות בריחה דרמטיים, כולל קפיצות מחלונות ושימוש במנהרות.",
                category: "history"
            }
        ]
    },
    {
        name: "Alternative Kreuzberg",
        name_he: "קרויצברג האלטרנטיבית",
        description: "Street art, multicultural vibes, and the soul of West Berlin.",
        description_he: "אומנות רחוב (גרפיטי), אווירה רב-תרבותית, אוכל רחוב מעולה והנשמה של מערב ברלין הפרועה.",
        pois: [
            {
                name: "Kottbusser Tor",
                name_he: "קוטבוסר טור",
                lat: 52.4990,
                lng: 13.4180,
                desc_en: "The raw heart of Kreuzberg, bustling with life.",
                desc_he: "הלב הפועם והמחוספס של קרויצברג. צומת סואן המוקף בשיכוני 'רכבת' אימתניים, מלא בחיים, דוכני דונר ומחאות חברתיות.",
                category: "urban"
            },
            {
                name: "Oranienstraße",
                name_he: "רחוב אורניין",
                lat: 52.5005,
                lng: 13.4200,
                desc_en: "Creative street full of bars, cafes, and history.",
                desc_he: "רחוב הבילויים והקניות האלטרנטיבי. מלא בברים היסטוריים, בתי קפה ייחודיים וחנויות עצמאיות.",
                category: "culture"
            },
            {
                name: "Markthalle Neun",
                name_he: "שוק האוכל (Markthalle Neun)",
                lat: 52.5015,
                lng: 13.4300,
                desc_en: "Historic market hall famous for Street Food Thursday.",
                desc_he: "שוק מקורה היסטורי משוחזר שהפך למקדש של פודיז. מפורסם ב'יום חמישי של אוכל רחוב' ובתוצרת מקומית איכותית.",
                category: "food"
            },
            {
                name: "Görlitzer Park",
                name_he: "פארק גורליצר",
                lat: 52.4968,
                lng: 13.4365,
                desc_en: "A park loved by locals for chilling and gathering.",
                desc_he: "ה'גורלי' הוא הסלון של השכונה. פארק עם אווירה חופשית לחלוטין, מוזיקה, מנגלים ולעיתים גם צדדים פחות נעימים, אבל אותנטי לחלוטין.",
                category: "nature"
            },
            {
                name: "Oberbaum Bridge",
                name_he: "גשר אוברבאום",
                lat: 52.5014,
                lng: 13.4450,
                desc_en: "The most beautiful bridge in Berlin connecting East and West.",
                desc_he: "הגשר היפה ביותר בברלין, הבנוי לבנים אדומות ומגדלים גותיים. מחבר בין קרויצברג (מערב) לפרידריכסהיין (מזרח).",
                history: "בזמן החלוקה הגשר היה חסום ושימש כמעבר גבול להולכי רגל בלבד. כיום הוא אחד מסמלי האיחוד.",
                category: "architecture"
            }
        ]
    },
    {
        name: "Museum Island Treasures",
        name_he: "אוצרות אי המוזיאונים",
        description: "A UNESCO World Heritage site full of art and history.",
        description_he: "אתר מורשת עולמית של אונסק״ו מלא באומנות, היסטוריה וארכיטקטורה. ריכוז נדיר של חמישה מוזיאונים ברמה עולמית על אי אחד.",
        pois: [
            {
                name: "Pergamon Museum",
                name_he: "מוזיאון פרגמון",
                lat: 52.5212,
                lng: 13.3969,
                desc_en: "Home to monumental structures such as the Ishtar Gate.",
                desc_he: "המוזיאון המפורסם ביותר בגרמניה (כרגע בשיפוצים חלקיים). ידוע בזכות שער אישתר הכחול מבבל ומזבח פרגמון העצום שהובאו אליו בשלמותם.",
                category: "culture"
            },
            {
                name: "Neues Museum",
                name_he: "המוזיאון החדש (Neues)",
                lat: 52.5204,
                lng: 13.3978,
                desc_en: "Famous for housing the bust of Nefertiti.",
                desc_he: "ביתו של האוסף המצרי ושל הפרוטומה המפורסמת של המלכה נפרטיטי (Nefertiti). המבנה עצמו הוא יצירת מופת של שחזור המשלב ישן וחדש.",
                category: "culture"
            },
            {
                name: "Alte Nationalgalerie",
                name_he: "הגלריה הלאומית הישנה",
                lat: 52.5208,
                lng: 13.3982,
                desc_en: "A stunning temple-like building housing 19th-century art.",
                desc_he: "מקדש לאומנות המאה ה-19, המציג יצירות מופת של קספר דויד פרידריך, מונה ורנואר, בתוך מבנה המזכיר מקדש יווני.",
                category: "art"
            },
            {
                name: "Lustgarten",
                name_he: "לוסטגארטן",
                lat: 52.5185,
                lng: 13.3995,
                desc_en: "The historic pleasure garden in front of the museums.",
                desc_he: "גן התענוגות ההיסטורי בחזית המוזיאונים. מקום מושלם למנוחה על הדשא עם נוף לקתדרלה ולמוזיאון הישן.",
                category: "nature"
            }
        ]
    },
    // Adding concise but rich descriptions for the rest
    {
        name: "Prenzlauer Berg Lifestyle",
        name_he: "לייף סטייל בפרנצלאואר",
        description: "Cafes, boutiques, and beautiful restored architecture.",
        description_he: "חוויית החיים הטובים של ברלין: בתי קפה מעולים, בוטיקים, בניינים משוחזרים ואווירה רגועה ומשפחתית.",
        pois: [
            { name: "Kollwitzplatz", name_he: "קולביץ-פלאץ", lat: 52.5360, lng: 13.4180, desc_en: "Heart of the neighborhood.", desc_he: "הלב הירוק של השכונה. בימי חמישי ושבת מתקיים כאן שוק איכרים נהדר." },
            { name: "Kulturbrauerei", name_he: "קולטור-בראווריי", lat: 52.5390, lng: 13.4130, desc_en: "Old brewery turned culture hub.", desc_he: "מבשלת בירה עתיקה מלבנים אדומות שהוסבה למרכז תרבות, קולנוע ומועדונים." },
            { name: "Mauerpark", name_he: "פארק החומה (מאוארפארק)", lat: 52.5435, lng: 13.4020, desc_en: "Famous for Sunday flea market and karaoke.", desc_he: "המקום להיות בו בימי ראשון. שוק פשפשים ענק, קראוקה המוני תחת כיפת השמיים ושרידי חומה." },
            { name: "Oderberger Straße", name_he: "רחוב אודרברגר", lat: 52.5400, lng: 13.4070, desc_en: "Historic street with great facades.", desc_he: "רחוב יפהפה שפעם הסתיים בקיר החומה. ידוע בחזיתות המשוחזרות ובמסעדות הרבות." },
            { name: "Prater Beer Garden", name_he: "גן הבירה פראטר", lat: 52.5405, lng: 13.4105, desc_en: "Oldest beer garden in Berlin.", desc_he: "גן הבירה הוותיק ביותר בברלין (מאז 1837). מקום קלאסי לשבת בו בקיץ עם בירה ונקניקיה." }
        ]
    },
    {
        name: "Tiergarten & Nature",
        name_he: "פארק טירגארטן והירוק",
        description: "The green lung of Berlin, perfect for a relaxing stroll.",
        description_he: "הריאה הירוקה של ברלין, מסלול מושלם להליכה רגועה בטבע, ממש במרכז העיר.",
        pois: [
            { name: "Victory Column", name_he: "עמוד הניצחון", lat: 52.5145, lng: 13.3501, desc_en: "Golden statue offering great views.", desc_he: "עמוד הניצחון המוזהב (Goldelse). מפורסם מהסרט 'מלאכים בשמי ברלין' ומציע תצפית נהדרת." },
            { name: "Bellevue Palace", name_he: "ארמון בלוו", lat: 52.5175, lng: 13.3530, desc_en: "President's residence.", desc_he: "משכנו הרשמי של נשיא גרמניה. ארמון יפהפה על גדות הנהר." },
            { name: "Haus der Kulturen der Welt", name_he: "בית תרבויות העולם", lat: 52.5186, lng: 13.3650, desc_en: "Unique architecture known as the Pregnant Oyster.", desc_he: "מבנה ייחודי המכונה 'הצדפה ההריונית', מתנה מארה״ב לגרמניה ב-1957." },
            { name: "Soviet War Memorial", name_he: "האנדרטה הסובייטית", lat: 52.5168, lng: 13.3725, desc_en: "Commemorating Soviet soldiers.", desc_he: "אנדרטה מונומנטלית ושמורה היטב לזכר החיילים הסובייטים שנפלו בקרב על ברלין, מלווה בשני טנקים T-34." }
        ]
    },
    {
        name: "Berlin Tech & Startups",
        name_he: "ברלין של ההייטק",
        description: "The bustling startup hub around Torstraße and Rosenthaler.",
        description_he: "סצנת הסטארטאפים השוקקת סביב טורשטראסה ורוזנטלר פלאץ. איפה שהחדשנות פוגשת את הקפה.",
        pois: [
            { name: "Sankt Oberholz", name_he: "סנקט אוברכהולץ", lat: 52.5295, lng: 13.4010, desc_en: "The coworking cafe where Soundcloud started.", desc_he: "בית הקפה המיתולוגי שבו (לפי האגדה) נכתבו הקודים הראשונים של Soundcloud וסטארטאפים נוספים." },
            { name: "Rosenthaler Platz", name_he: "כיכר רוזנטלר", lat: 52.5300, lng: 13.4015, desc_en: "Busy transport and dining hub.", desc_he: "צומת דרכים מרכזי ותוסס, עמוס במסעדות, ברים ואנשי הייטק." },
            { name: "Silicon Allee", name_he: "סיליקון אלי", lat: 52.5310, lng: 13.3850, desc_en: "Major tech offices area.", desc_he: "אזור רחוב Chausseestraße, המכונה לעיתים 'סיליקון אלי' של ברלין, ביתם של משרדי חברות טכנולוגיה רבות." },
            { name: "Factory Berlin", name_he: "פקטורי ברלין", lat: 52.5370, lng: 13.3950, desc_en: "Famous coworking campus.", desc_he: "קמפוס יזמות ענק וקהילה המאגדת תחת קורת גג אחת חברות ענק וסטארטאפים צעירים." }
        ]
    },
    {
        name: "Neukölln Hipster",
        name_he: "נויקלן ההיפסטרית",
        description: "Gritty, trendy, vegan food and vintage vibes.",
        description_he: "השכונה הכי קולית בברלין. מחוספסת, טרנדית, מלאה באוכל טבעוני, חנויות יד שנייה ואווירת חופש.",
        pois: [
            { name: "Tempelhofer Feld", name_he: "שדה התעופה טמפלהוף", lat: 52.4735, lng: 13.4030, desc_en: "Airport turned public park.", desc_he: "שדה תעופה נאצי היסטורי שהפך לפארק עצום ומרחב חופש ציבורי. מדהים לרכיבת אופניים וטיולים." },
            { name: "Schillerkiez", name_he: "שילר-קיץ", lat: 52.4750, lng: 13.4200, desc_en: "Beautiful residential area near the park.", desc_he: "אזור מגורים יפייפה עם שדרה רחבה, בתי קפה שכונתיים ואווירה נעימה ומזמינה." },
            { name: "Weserstraße", name_he: "רחוב ווסר", lat: 52.4850, lng: 13.4350, desc_en: "Famous for its nightlife and bars.", desc_he: "רחוב הברים האולטימטיבי של נויקלן. בלילה הוא מתעורר לחיים עם עשרות ברים אפלוליים ומגניבים." },
            { name: "Maybachufer", name_he: "תעלת המייבאך", lat: 52.4920, lng: 13.4300, desc_en: "Known for the Turkish market.", desc_he: "טיילת יפה לאורך התעלה. בימי שלישי ושישי מתקיים כאן השוק הטורקי המפורסם." }
        ]
    },
    {
        name: "Hidden Courtyards",
        name_he: "החצרות הנסתרות",
        description: "Discovering the beautiful Höfe architecture of Mitte.",
        description_he: "גילוי החצרות הפנימיות המפורסמות של מרכז ברלין (Mitte). פינות חמד שקל לפספס.",
        pois: [
            { name: "Heckmann Höfe", name_he: "הקמן הפה", lat: 52.5240, lng: 13.3930, desc_en: "Charming courtyard with candy maker.", desc_he: "חצר מקסימה ופחות מוכרת, המכילה מפעל סוכריות ידני קטן ומסעדות בוטיק." },
            { name: "Sophienstraße", name_he: "רחוב סופיין", lat: 52.5255, lng: 13.3980, desc_en: "Historic street with craft shops.", desc_he: "אחד הרחובות העתיקים והשמורים ביותר בברלין, מלא בחנויות אומנים וגלריות." },
            { name: "KunstWerke", name_he: "גלריית KW", lat: 52.5270, lng: 13.3960, desc_en: "Institute for Contemporary Art.", desc_he: "מכון לאומנות עכשווית הממוקם בחצר תעשייתית לשעבר. כולל את קפה בראבו האיקוני בחצר." },
            { name: "Clärchens Ballhaus", name_he: "אולם הריקודים קלרכנס", lat: 52.5265, lng: 13.3955, desc_en: "Historic ballroom with vintage charm.", desc_he: "אולם ריקודים היסטורי משנת 1913. מקום קסום שנראה כאילו הזמן עצר בו מלכת, עם גינת בירה נהדרת." }
        ]
    }
];

const seedBerlin = async () => {
    console.log('🇩🇪 Starting RICH seed for Berlin...');

    // 1. Clean up existing routes to prevent duplicates/mess
    console.log('🧹 Cleaning up old Berlin routes for system user...');
    try {
        const { error: deleteError } = await supabase
            .from('routes')
            .delete()
            .eq('user_id', SYSTEM_USER_ID)
            .eq('city', 'Berlin');

        if (deleteError) {
            console.error('⚠️ Warning: Failed to clean up old routes:', deleteError.message);
        } else {
            console.log('✅ Clean up successful');
        }
    } catch (e) {
        console.error('⚠️ Cleanup failed with exception:', e);
    }

    // 2. Insert new enriched routes
    for (const route of BERLIN_ROUTES) {
        console.log(`📍 Processing: ${route.name}`);

        // Build POIs with proper structure for RPC
        const poisRpc = route.pois.map((p, idx) => ({
            id: `berlin-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            order_index: idx,
            data: {
                name_en: p.name,
                name_he: p.name_he,
                description: p.desc_en,
                description_he: p.desc_he,
                historical_context: p.history || (p.desc_en ? `Historical details for ${p.name}` : undefined),
                historical_context_he: p.history,
                architectural_analysis_he: p.arch,
                category: p.category || 'culture'
            }
        }));

        const { data: routeId, error } = await supabase.rpc('save_generated_route', {
            p_city: 'Berlin',
            p_name: route.name,
            p_description: route.description,
            p_duration: route.pois.length * 30, // 30 mins per stop est.
            p_preferences: {
                names: { en: route.name, he: route.name_he },
                descriptions: { en: route.description, he: route.description_he },
                theme: 'curated'
            },
            p_pois: poisRpc,
            p_user_id: SYSTEM_USER_ID,
            p_is_public: true
        });

        if (error) {
            console.error(`❌ Failed to save ${route.name}:`, error.message);
        } else {
            console.log(`✅ Saved ${route.name}`);
        }
    }

    console.log('✨ Berlin Rich Seed complete!');
};

seedBerlin();
