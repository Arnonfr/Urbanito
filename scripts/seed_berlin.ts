
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SYSTEM_USER_ID = '63a80fa9-b66d-42e6-af0e-26c10a2b3b40';

const BERLIN_ROUTES = [
    {
        name: "Classic Berlin Icons",
        name_he: "הקלאסיקות של ברלין",
        description: "The absolute must-sees of Berlin from the Gate to the Tower.",
        description_he: "אתרי החובה המוחלטים של ברלין, משער ברנדנבורג ועד מגדל הטלוויזיה.",
        pois: [
            { name: "Brandenburg Gate", name_he: "שער ברנדנבורג", lat: 52.5163, lng: 13.3777 },
            { name: "Reichstag Building", name_he: "בניין הרייכסטאג", lat: 52.5186, lng: 13.3762 },
            { name: "Memorial to the Murdered Jews of Europe", name_he: "אנדרטת השואה", lat: 52.5139, lng: 13.3787 },
            { name: "Unter den Linden", name_he: "שדרות אונטר דן לינדן", lat: 52.5170, lng: 13.3888 },
            { name: "Bebelplatz", name_he: "ביבלפלאץ", lat: 52.5164, lng: 13.3936 },
            { name: "Berlin Cathedral", name_he: "ברלינר דום", lat: 52.5190, lng: 13.4010 },
            { name: "Alexanderplatz", name_he: "אלכסנדרפלאץ", lat: 52.5219, lng: 13.4132 }
        ]
    },
    {
        name: "Jewish Heritage Walk",
        name_he: "מורשת יהודית בברלין",
        description: "Exploring the deep history of the Jewish quarter in Mitte.",
        description_he: "סיור במעמקי ההיסטוריה של הרובע היהודי במיטה.",
        pois: [
            { name: "Hackesche Höfe", name_he: "האקשה הפה", lat: 52.5230, lng: 13.4020 },
            { name: "New Synagogue Berlin", name_he: "בית הכנסת החדש", lat: 52.5246, lng: 13.3953 },
            { name: "Old Jewish Cemetery", name_he: "בית הקברות היהודי הישן", lat: 52.5290, lng: 13.3980 },
            { name: "Otto Weidt's Workshop for the Blind", name_he: "מוזיאון אוטו ויידט", lat: 52.5238, lng: 13.4022 },
            { name: "Rosenstraße Protest Memorial", name_he: "אנדרטת מחאת רוזנשטראסה", lat: 52.5210, lng: 13.4030 }
        ]
    },
    {
        name: "Cold War & The Wall",
        name_he: "המלחמה הקרה והחומה",
        description: "Tracing the path of the Berlin Wall and Checkpoint Charlie.",
        description_he: "בעקבות חומת ברלין, צ׳ק פוינט צ׳ארלי והחיים בצל המלחמה הקרה.",
        pois: [
            { name: "Checkpoint Charlie", name_he: "צ׳ק פוינט צ׳ארלי", lat: 52.5074, lng: 13.3904 },
            { name: "Topography of Terror", name_he: "טופוגרפיה של הטרור", lat: 52.5056, lng: 13.3845 },
            { name: "Potsdamer Platz", name_he: "כיכר פוטסדאם", lat: 52.5096, lng: 13.3765 },
            { name: "Berlin Wall Memorial", name_he: "אתר הנצחה לחומה (ברנאוור)", lat: 52.5352, lng: 13.3900 }
        ]
    },
    {
        name: "Alternative Kreuzberg",
        name_he: "קרויצברג האלטרנטיבית",
        description: "Street art, multicultural vibes, and the soul of West Berlin.",
        description_he: "אומנות רחוב, אווירה רב-תרבותית והנשמה של מערב ברלין הפרועה.",
        pois: [
            { name: "Kottbusser Tor", name_he: "קוטבוסר טור", lat: 52.4990, lng: 13.4180 },
            { name: "Oranienstraße", name_he: "רחוב אורניין", lat: 52.5005, lng: 13.4200 },
            { name: "Markthalle Neun", name_he: "שוק האוכל (Markthalle Neun)", lat: 52.5015, lng: 13.4300 },
            { name: "Görlitzer Park", name_he: "פארק גורליצר", lat: 52.4968, lng: 13.4365 },
            { name: "Oberbaum Bridge", name_he: "גשר אוברבאום", lat: 52.5014, lng: 13.4450 }
        ]
    },
    {
        name: "Prenzlauer Berg Lifestyle",
        name_he: "לייף סטייל בפרנצלאואר",
        description: "Cafes, boutiques, and beautiful restored architecture.",
        description_he: "בתי קפה, בוטיקים וארכיטקטורה משוחזרת ויפהפייה.",
        pois: [
            { name: "Kollwitzplatz", name_he: "קולביץ-פלאץ", lat: 52.5360, lng: 13.4180 },
            { name: "Kulturbrauerei", name_he: "קולטור-בראווריי", lat: 52.5390, lng: 13.4130 },
            { name: "Mauerpark", name_he: "פארק החומה (מאוארפארק)", lat: 52.5435, lng: 13.4020 },
            { name: "Oderberger Straße", name_he: "רחוב אודרברגר", lat: 52.5400, lng: 13.4070 },
            { name: "Prater Beer Garden", name_he: "גן הבירה פראטר", lat: 52.5405, lng: 13.4105 }
        ]
    },
    {
        name: "Museum Island Treasures",
        name_he: "אוצרות אי המוזיאונים",
        description: "A UNESCO World Heritage site full of art and history.",
        description_he: "אתר מורשת עולמית של אונסק״ו מלא באומנות, היסטוריה וארכיטקטורה.",
        pois: [
            { name: "Pergamon Museum", name_he: "מוזיאון פרגמון", lat: 52.5212, lng: 13.3969 },
            { name: "Neues Museum", name_he: "המוזיאון החדש (Neues)", lat: 52.5204, lng: 13.3978 },
            { name: "Alte Nationalgalerie", name_he: "הגלריה הלאומית הישנה", lat: 52.5208, lng: 13.3982 },
            { name: "Lustgarten", name_he: "לוסטגארטן", lat: 52.5185, lng: 13.3995 }
        ]
    },
    {
        name: "Tiergarten & Nature",
        name_he: "פארק טירגארטן והירוק",
        description: "The green lung of Berlin, perfect for a relaxing stroll.",
        description_he: "הריאה הירוקה של ברלין, מסלול מושלם להליכה רגועה בטבע.",
        pois: [
            { name: "Victory Column", name_he: "עמוד הניצחון", lat: 52.5145, lng: 13.3501 },
            { name: "Bellevue Palace", name_he: "ארמון בלוו", lat: 52.5175, lng: 13.3530 },
            { name: "Haus der Kulturen der Welt", name_he: "בית תרבויות העולם", lat: 52.5186, lng: 13.3650 },
            { name: "Soviet War Memorial", name_he: "האנדרטה הסובייטית", lat: 52.5168, lng: 13.3725 }
        ]
    },
    {
        name: "Modern Architecture Tour",
        name_he: "ברלין המודרנית",
        description: "Contemporary architecture around Potsdamer Platz and Govt District.",
        description_he: "אדריכלות עכשווית סביב כיכר פוטסדאם ורובע הממשלה.",
        pois: [
            { name: "Sony Center", name_he: "מרכז סוני", lat: 52.5098, lng: 13.3735 },
            { name: "Philharmonie Berlin", name_he: " הפילהרמונית", lat: 52.5100, lng: 13.3700 },
            { name: "Marie-Elisabeth-Lüders-Haus", name_he: "בניין מארי-אליזבת-לודרס", lat: 52.5195, lng: 13.3790 },
            { name: "Central Station (Hauptbahnhof)", name_he: "התחנה המרכזית", lat: 52.5251, lng: 13.3694 }
        ]
    },
    {
        name: "East Side & Friedrichshain",
        name_he: "איסט סייד ופרידריכסהיין",
        description: "The longest remaining section of the Wall and gritty vibrant streets.",
        description_he: "הקטע הארוך ביותר שנותר מהחומה, ואווירת רחוב מחוספסת ותוססת.",
        pois: [
            { name: "East Side Gallery", name_he: "איסט סייד גלרי", lat: 52.5050, lng: 13.4390 },
            { name: "Mercedes-Benz Arena", name_he: "מרצדס-בנץ ארנה", lat: 52.5063, lng: 13.4436 },
            { name: "Simon-Dach-Straße", name_he: "רחוב סימון דאך", lat: 52.5110, lng: 13.4530 },
            { name: "Boxhagener Platz", name_he: "בוקסהגנר פלאץ", lat: 52.5115, lng: 13.4600 }
        ]
    },
    {
        name: "West Berlin Glory",
        name_he: "הזוהר של מערב ברלין",
        description: "The classic luxury of Kurfürstendamm and Charlottenburg.",
        description_he: "היוקרה הקלאסית של השאנז-אליזה הגרמני, הקורפירסטנדאם.",
        pois: [
            { name: "Kaiser Wilhelm Memorial Church", name_he: "כנסיית הזיכרון (קייזר וילהלם)", lat: 52.5048, lng: 13.3350 },
            { name: "KaDeWe", name_he: "כלבו קה-דה-ווה", lat: 52.5015, lng: 13.3410 },
            { name: "Kurfürstendamm", name_he: "קורפירסטנדאם (קודאם)", lat: 52.5030, lng: 13.3300 },
            { name: "Savignyplatz", name_he: "סאביניפלאץ", lat: 52.5055, lng: 13.3220 }
        ]
    },
    {
        name: "Spree River Walk",
        name_he: "טיילת נהר השפרה",
        description: "A scenic walk along the river passing beach bars and offices.",
        description_he: "הליכה ציורית לאורך הנהר, בין ברים על החוף ובנייני משרדים.",
        pois: [
            { name: "Monbijou Park", name_he: "פארק מונביז׳ו", lat: 52.5230, lng: 13.3960 },
            { name: "James Simon Park", name_he: "פארק ג׳יימס סימון", lat: 52.5220, lng: 13.4000 },
            { name: "Schiffbauerdamm", name_he: "שיפבאוארדאם", lat: 52.5205, lng: 13.3850 },
            { name: "Tränenpalast", name_he: "ארמון הדמעות", lat: 52.5203, lng: 13.3870 }
        ]
    },
    {
        name: "Berlin Tech & Startups",
        name_he: "ברלין של ההייטק",
        description: "The bustling startup hub around Torstraße and Rosenthaler.",
        description_he: "סצנת הסטארטאפים השוקקת סביב טורשטראסה ורוזנטלר.",
        pois: [
            { name: "Sankt Oberholz", name_he: "סנקט אוברכהולץ (קפה הייטק)", lat: 52.5295, lng: 13.4010 },
            { name: "Rosenthaler Platz", name_he: "כיכר רוזנטלר", lat: 52.5300, lng: 13.4015 },
            { name: "Silicon Allee", name_he: "סיליקון אלי (Chausseestraße)", lat: 52.5310, lng: 13.3850 },
            { name: "Factory Berlin", name_he: "פקטורי ברלין", lat: 52.5370, lng: 13.3950 }
        ]
    },
    {
        name: "Charlottenburg Palace",
        name_he: "ארמון שרלוטנבורג",
        description: "Royal vibes and huge gardens in the west.",
        description_he: "אווירה מלכותית וגנים ענקיים במערב העיר.",
        pois: [
            { name: "Charlottenburg Palace", name_he: "ארמון שרלוטנבורג", lat: 52.5208, lng: 13.2957 },
            { name: "Palace Gardens", name_he: "גני הארמון", lat: 52.5230, lng: 13.2960 },
            { name: "Belvedere", name_he: "בית התה בלוודר", lat: 52.5260, lng: 13.2940 },
            { name: "Mausoleum", name_he: "המאוזוליאום", lat: 52.5240, lng: 13.2920 }
        ]
    },
    {
        name: "Neukölln Hipster",
        name_he: "נויקלן ההיפסטרית",
        description: "Gritty, trendy, vegan food and vintage vibes.",
        description_he: "שכונה מחוספסת, טרנדית, אוכל טבעוני ואווירת וינטג׳.",
        pois: [
            { name: "Tempelhofer Feld", name_he: "שדה התעופה טמפלהוף", lat: 52.4735, lng: 13.4030 },
            { name: "Schillerkiez", name_he: "שילר-קיץ", lat: 52.4750, lng: 13.4200 },
            { name: "Weserstraße", name_he: "רחוב ווסר (ברים)", lat: 52.4850, lng: 13.4350 },
            { name: "Maybachufer", name_he: "תעלת המייבאך (שוק גדות)", lat: 52.4920, lng: 13.4300 }
        ]
    },
    {
        name: "Hidden Courtyards",
        name_he: "החצרות הנסתרות",
        description: "Discovering the beautiful Höfe architecture of Mitte.",
        description_he: "גילוי החצרות הפנימיות המפורסמות של מרכז ברלין (Mitte).",
        pois: [
            { name: "Heckmann Höfe", name_he: "הקמן הפה", lat: 52.5240, lng: 13.3930 },
            { name: "Sophienstraße", name_he: "רחוב סופיין", lat: 52.5255, lng: 13.3980 },
            { name: "KunstWerke", name_he: "גלריית KW", lat: 52.5270, lng: 13.3960 },
            { name: "Clärchens Ballhaus", name_he: "אולם הריקודים קלרכנס", lat: 52.5265, lng: 13.3955 }
        ]
    }
];

const seedBerlin = async () => {
    console.log('🇩🇪 Starting seed for Berlin...');

    for (const route of BERLIN_ROUTES) {
        console.log(`📍 Processing: ${route.name}`);

        // Build POIs with proper structure for RPC
        const poisRpc = route.pois.map((p, idx) => ({
            id: `berlin-seed-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
            name: p.name, // Will be key for ID generation
            lat: p.lat,
            lng: p.lng,
            order_index: idx,
            data: {
                name_en: p.name,
                name_he: p.name_he,
                description: `Visit ${p.name}, a key spot in this tour.`,
                description_he: `ביקור ב${p.name_he}, נקודת מפתח בסיור הזה.`,
                category: 'history'
            }
        }));

        const { data: routeId, error } = await supabase.rpc('save_generated_route', {
            p_city: 'Berlin',
            p_name: route.name,
            p_description: route.description,
            p_duration: route.pois.length * 20,
            p_preferences: {
                names: { en: route.name, he: route.name_he },
                descriptions: { en: route.description, he: route.description_he },
                theme: 'curated'
            },
            p_pois: poisRpc,
            p_user_id: SYSTEM_USER_ID, // Correct System user
            p_is_public: true
        });

        if (error) {
            console.error(`❌ Failed to save ${route.name}:`, error.message);
        } else {
            console.log(`✅ Saved ${route.name} (ID: ${routeId})`);
        }
    }

    console.log('✨ Berlin Seed complete!');
};

seedBerlin();
