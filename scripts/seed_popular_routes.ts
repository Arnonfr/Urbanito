
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SYSTEM_USER_ID = '63a80fa9-b66d-42e6-af0e-26c10a2b3b40';

const CITIES = [
    { name: 'Paris', nameHe: 'פריז', lat: 48.8566, lng: 2.3522 },
    { name: 'London', nameHe: 'לונדון', lat: 51.5074, lng: -0.1278 },
    { name: 'New York', nameHe: 'ניו יורק', lat: 40.7128, lng: -74.0060 },
    { name: 'Tokyo', nameHe: 'טוקיו', lat: 35.6762, lng: 139.6503 },
    { name: 'Rome', nameHe: 'רומא', lat: 41.9028, lng: 12.4964 },
    { name: 'Barcelona', nameHe: 'ברצלונה', lat: 41.3851, lng: 2.1734 },
    { name: 'Dubai', nameHe: 'דובאי', lat: 25.2048, lng: 55.2708 },
    { name: 'Amsterdam', nameHe: 'אמסטרדם', lat: 52.3676, lng: 4.9041 },
    { name: 'Berlin', nameHe: 'ברלין', lat: 52.5200, lng: 13.4050 },
    { name: 'Jerusalem', nameHe: 'ירושלים', lat: 31.7683, lng: 35.2137 },
    { name: 'Tel Aviv', nameHe: 'תל אביב', lat: 32.0853, lng: 34.7818 },
    { name: 'Istanbul', nameHe: 'איסטנבול', lat: 41.0082, lng: 28.9784 },
    { name: 'Prague', nameHe: 'פראג', lat: 50.0755, lng: 14.4378 },
    { name: 'Budapest', nameHe: 'בודפשט', lat: 47.4979, lng: 19.0402 },
    { name: 'Vienna', nameHe: 'וינה', lat: 48.2082, lng: 16.3738 },
    { name: 'Lisbon', nameHe: 'ליסבון', lat: 38.7223, lng: -9.1393 },
    { name: 'Singapore', nameHe: 'סינגפור', lat: 1.3521, lng: 103.8198 },
    { name: 'Bangkok', nameHe: 'בנגקוק', lat: 13.7563, lng: 100.5018 },
    { name: 'Seoul', nameHe: 'סיאול', lat: 37.5665, lng: 126.9780 },
    { name: 'Los Angeles', nameHe: 'לוס אנג׳לס', lat: 34.0522, lng: -118.2437 },
    { name: 'San Francisco', nameHe: 'סן פרנסיסקו', lat: 37.7749, lng: -122.4194 },
    { name: 'Chicago', nameHe: 'שיקגו', lat: 41.8781, lng: -87.6298 },
    { name: 'Miami', nameHe: 'מיאמי', lat: 25.7617, lng: -80.1918 },
    { name: 'Las Vegas', nameHe: 'לאס וגאס', lat: 36.1699, lng: -115.1398 },
    { name: 'Sydney', nameHe: 'סידני', lat: -33.8688, lng: 151.2093 },
    { name: 'Melbourne', nameHe: 'מלבורן', lat: -37.8136, lng: 144.9631 },
    { name: 'Cape Town', nameHe: 'קייפטאון', lat: -33.9249, lng: 18.4241 },
    { name: 'Rio de Janeiro', nameHe: 'ריו דה ז׳ניירו', lat: -22.9068, lng: -43.1729 },
    { name: 'Buenos Aires', nameHe: 'בואנוס איירס', lat: -34.6037, lng: -58.3816 },
    { name: 'Mexico City', nameHe: 'מקסיקו סיטי', lat: 19.4326, lng: -99.1332 }
];

const ROUTES_DATA: any = {
    'Paris': [
        {
            name: 'Paris Classics', nameHe: 'הקלאסיקות של פריז',
            desc: 'The absolute must-sees of Paris.', descHe: 'אתרי החובה שאי אפשר לפספס בפריז.',
            pois: [
                { en: 'Eiffel Tower', he: 'מגדל אייפל' },
                { en: 'Louvre Museum', he: 'מוזיאון הלובר' },
                { en: 'Notre Dame Cathedral', he: 'קתדרלת נוטרדאם' },
                { en: 'Arc de Triomphe', he: 'שער הניצחון' },
                { en: 'Sacre Coeur', he: 'בזיליקת סקרה קר' }
            ]
        },
        {
            name: 'Montmartre Vibes', nameHe: 'אווירה במונמארטר',
            desc: 'Artistic history and bohemian streets.', descHe: 'היסטוריה אמנותית ורחובות בוהמיים.',
            pois: [
                { en: 'Place du Tertre', he: 'כיכר טרטר' },
                { en: 'Moulin Rouge', he: 'מולן רוז׳' },
                { en: 'Le Consulat Cafe', he: 'קפה לה קונסולאט' },
                { en: 'Dali Paris', he: 'מוזיאון דאלי' },
                { en: 'Wall of Love', he: 'קיר האהבה' }
            ]
        }
    ],
    'London': [
        {
            name: 'Royal London', nameHe: 'לונדון המלכותית',
            desc: 'Palaces, parks and politics.', descHe: 'ארמונות, פארקים ופוליטיקה.',
            pois: [
                { en: 'Buckingham Palace', he: 'ארמון בקינגהאם' },
                { en: 'Big Ben', he: 'ביג בן' },
                { en: 'Westminster Abbey', he: 'מנזר וסטמינסטר' },
                { en: 'London Eye', he: 'לונדון איי' },
                { en: 'Trafalgar Square', he: 'כיכר טרפלגר' }
            ]
        },
        {
            name: 'Shoreditch Cool', nameHe: 'שורדיץ׳ המגניבה',
            desc: 'Street art, vintage markets and food.', descHe: 'אומנות רחוב, שוקי וינטג׳ ואוכל טוב.',
            pois: [
                { en: 'Brick Lane', he: 'בריק ליין' },
                { en: 'Spitalfields Market', he: 'שוק ספיטלפילדס' },
                { en: 'Boxpark', he: 'בוקספארק' },
                { en: 'Columbia Road Flower Market', he: 'שוק הפרחים בקולומביה רואד' },
                { en: 'Old Street Art', he: 'אומנות רחוב באולד סטריט' }
            ]
        }
    ],
    // ... Adding more data structures, keeping it concise for the example but scaling this logic
    'New York': [
        { name: 'Midtown Magic', nameHe: 'קסם המידטאון', desc: 'Skyscrapers and neon lights.', descHe: 'גורדי שחקים ואורות ניאון.', pois: [{ en: 'Times Square', he: 'טיימס סקוור' }, { en: 'Empire State Building', he: 'בניין האמפייר סטייט' }, { en: 'Rockefeller Center', he: 'מרכז רוקפלר' }, { en: 'Grand Central Terminal', he: 'תחנת גרנד סנטרל' }, { en: 'Museum of Modern Art', he: 'מוזיאון MOMA' }] },
        { name: 'Village Boheme', nameHe: 'הכפר הבוהמי', desc: 'Jazz clubs, brownstones and history.', descHe: 'מועדוני ג׳אז, בתים היסטוריים ואווירה.', pois: [{ en: 'Washington Square Park', he: 'פארק וושינגטון סקוור' }, { en: 'Stonewall Inn', he: 'סטונוול אין' }, { en: 'Blue Note Jazz Club', he: 'מועדון הג׳אז בלו נוט' }, { en: 'Friends Apartment', he: 'הדירה של חברים' }, { en: 'Magnolia Bakery', he: 'מאפיית מגנוליה' }] }
    ],
    'Tokyo': [
        { name: 'Neon Tokyo', nameHe: 'טוקיו בניאון', desc: 'The electric energy of Shibuya and Shinjuku.', descHe: 'האנרגיה החשמלית של שיבויה ושינג׳וקו.', pois: [{ en: 'Shibuya Crossing', he: 'מעבר החצייה בשיבויה' }, { en: 'Hachiko Statue', he: 'פסל האצ׳יקו' }, { en: 'Takeshita Street', he: 'רחוב טקשיטה' }, { en: 'Meiji Shrine', he: 'מקדש מייג׳י' }, { en: 'Shinjuku Gyoen', he: 'גן שינג׳וקו' }] },
        { name: 'Old Edo', nameHe: 'אדו העתיקה', desc: 'Temples and traditional vibes in Asakusa.', descHe: 'מקדשים ואווירה מסורתית באסקוסה.', pois: [{ en: 'Senso-ji Temple', he: 'מקדש סנסו-ג׳י' }, { en: 'Nakamise Shopping Street', he: 'רחוב הקניות נקמיסה' }, { en: 'Tokyo Skytree', he: 'עץ השמיים טוקיו' }, { en: 'Ueno Park', he: 'פארק אואנו' }, { en: 'Tokyo National Museum', he: 'המוזיאון הלאומי של טוקיו' }] }
    ],
    'Jerusalem': [
        { name: 'Holy City', nameHe: 'עיר הקודש', desc: 'Sacred sites of the Old City.', descHe: 'האתרים הקדושים בעיר העתיקה.', pois: [{ en: 'Western Wall', he: 'הכותל המערבי' }, { en: 'Church of the Holy Sepulchre', he: 'כנסיית הקבר' }, { en: 'Dome of the Rock', he: 'כיפת הסלע' }, { en: 'Tower of David', he: 'מגדל דוד' }, { en: 'Via Dolorosa', he: 'ויה דולורוזה' }] },
        { name: 'Market Flavors', nameHe: 'טעמי השוק', desc: 'The tastes of Machane Yehuda.', descHe: 'הטעמים והריחות של שוק מחנה יהודה.', pois: [{ en: 'Machane Yehuda Market', he: 'שוק מחנה יהודה' }, { en: 'Nahlaot Neighborhood', he: 'שכונת נחלאות' }, { en: 'Ben Yehuda Street', he: 'מדרחוב בן יהודה' }, { en: 'Great Synagogue', he: 'בית הכנסת הגדול' }, { en: 'Mamilla Mall', he: 'קניון ממילא' }] }
    ],
    'Tel Aviv': [
        { name: 'Bauhaus & Beach', nameHe: 'באוהאוס וחוף', desc: 'White City architecture and sea.', descHe: 'אדריכלות העיר הלבנה והים.', pois: [{ en: 'Dizengoff Square', he: 'כיכר דיזנגוף' }, { en: 'Habima Square', he: 'כיכר הבימה' }, { en: 'Rothschild Boulevard', he: 'שדרות רוטשילד' }, { en: 'Gordon Beach', he: 'חוף גורדון' }, { en: 'Tel Aviv Museum of Art', he: 'מוזיאון תל אביב לאמנות' }] },
        { name: 'Jaffa Tales', nameHe: 'סיפורי יפו', desc: 'Ancient port and winding alleys.', descHe: 'נמל עתיק וסמטאות ציוריות.', pois: [{ en: 'Jaffa Clock Tower', he: 'מגדל השעון ביפו' }, { en: 'Jaffa Flea Market', he: 'שוק הפשפשים' }, { en: 'St. Peter\'s Church', he: 'כנסיית סנט פיטר' }, { en: 'Jaffa Port', he: 'נמל יפו' }, { en: 'Suspended Orange Tree', he: 'עץ התפוז התלוי' }] }
    ],
    'Rome': [
        { name: 'Ancient Rome', nameHe: 'רומא העתיקה', desc: 'Walk through history.', descHe: 'הליכה דרך ההיסטוריה.', pois: [{ en: 'Colosseum', he: 'קולוסאום' }, { en: 'Roman Forum', he: 'הפורום הרומאי' }, { en: 'Pantheon', he: 'פנתיאון' }, { en: 'Trevi Fountain', he: 'מזרקת טרווי' }, { en: 'Spanish Steps', he: 'המדרגות הספרדיות' }] },
        { name: 'Trastevere Foodie', nameHe: 'קולינריה בטרסטוורה', desc: 'Authentic Roman dining and cobblestones.', descHe: 'אוכל רומאי אותנטי וסמטאות אבן.', pois: [{ en: 'Piazza di Santa Maria', he: 'כיכר סנטה מריה' }, { en: 'Villa Farnesina', he: 'וילה פרנזינה' }, { en: 'Porta Portese', he: 'פורטה פורטזה' }, { en: 'Janiculum Hill', he: 'גבעת ג׳אניקולו' }, { en: 'Tiber Island', he: 'אי הטיבר' }] }
    ],
    'Barcelona': [
        { name: 'Gaudi\'s Masterpieces', nameHe: 'יצירות המופת של גאודי', desc: 'The architectural wonders of Gaudi.', descHe: 'הפלאים האדריכליים של גאודי.', pois: [{ en: 'Sagrada Familia', he: 'סגרדה פמיליה' }, { en: 'Park Guell', he: 'פארק גואל' }, { en: 'Casa Batllo', he: 'קאזה באטיו' }, { en: 'Casa Mila', he: 'קאזה מילה' }, { en: 'Palau Guell', he: 'ארמון גואל' }] },
        { name: 'Gothic Mystery', nameHe: 'מסתורין גותי', desc: 'Medieval streets and hidden squares.', descHe: 'רחובות ימי הביניים וכיכרות נסתרות.', pois: [{ en: 'Barcelona Cathedral', he: 'קתדרלת ברצלונה' }, { en: 'Placa Reial', he: 'פלאסה ריאל' }, { en: 'Picasso Museum', he: 'מוזיאון פיקאסו' }, { en: 'El Born Centre', he: 'מרכז אל בורן' }, { en: 'Ciutadella Park', he: 'פארק המצודה' }] }
    ],
    'Dubai': [
        { name: 'Future City', nameHe: 'עיר העתיד', desc: 'Skyscrapers and malls.', descHe: 'גורדי שחקים וקניונים ענקיים.', pois: [{ en: 'Burj Khalifa', he: 'בורג׳ חליפה' }, { en: 'Dubai Mall', he: 'קניון דובאי' }, { en: 'Dubai Fountain', he: 'מזרקת דובאי' }, { en: 'Museum of the Future', he: 'מוזיאון העתיד' }, { en: 'Dubai Opera', he: 'האופרה של דובאי' }] },
        { name: 'Old Dubai', nameHe: 'דובאי העתיקה', desc: 'Souks and heritage.', descHe: 'שווקים ומורשת.', pois: [{ en: 'Gold Souk', he: 'שוק הזהב' }, { en: 'Spice Souk', he: 'שוק התבלינים' }, { en: 'Dubai Creek', he: 'נחל דובאי' }, { en: 'Al Fahidi Fort', he: 'מבצר אל פהידי' }, { en: 'Bastakiya Quarter', he: 'רובע בסטקיה' }] }
    ],
    'Amsterdam': [
        { name: 'Canal Ring', nameHe: 'טבעת התעלות', desc: 'Classic canals and museums.', descHe: 'תעלות קלאסיות ומוזיאונים.', pois: [{ en: 'Rijksmuseum', he: 'רייקסמוזיאום' }, { en: 'Van Gogh Museum', he: 'מוזיאון ואן גוך' }, { en: 'Anne Frank House', he: 'בית אנה פרנק' }, { en: 'Dam Square', he: 'כיכר דאם' }, { en: 'Vondelpark', he: 'וונדלפארק' }] },
        { name: 'Jordaan Charm', nameHe: 'קסם הג׳ורדן', desc: 'Art galleries and cozy cafes.', descHe: 'גלריות אמנות ובתי קפה נעימים.', pois: [{ en: 'Westerkerk', he: 'כנסיית המערב' }, { en: 'Noordermarkt', he: 'נורדרמרקט' }, { en: 'Houseboat Museum', he: 'מוזיאון בתי הסירה' }, { en: 'The 9 Streets', he: 'תשעת הרחובות' }, { en: 'Homomonument', he: 'הומומונומנט' }] }
    ],
    'Berlin': [
        { name: 'Historic Berlin', nameHe: 'ברלין ההיסטורית', desc: 'The Wall and beyond.', descHe: 'החומה ומעבר לה.', pois: [{ en: 'Brandenburg Gate', he: 'שער ברנדנבורג' }, { en: 'Reichstag', he: 'הרייכסטאג' }, { en: 'Checkpoint Charlie', he: 'צ׳ק פוינט צ׳ארלי' }, { en: 'Holocaust Memorial', he: 'אנדרטת השואה' }, { en: 'Berlin Wall Memorial', he: 'אתר ההנצחה לחומת ברלין' }] },
        { name: 'Kreuzberg Cool', nameHe: 'קרויצברג המגניבה', desc: 'Street art and nightlife.', descHe: 'אומנות רחוב וחיי לילה.', pois: [{ en: 'East Side Gallery', he: 'איסט סייד גלרי' }, { en: 'Markthalle Neun', he: 'מרקט האלה נוין' }, { en: 'Görlitzer Park', he: 'פארק גורליצר' }, { en: 'Oberbaum Bridge', he: 'גשר אוברבאום' }, { en: 'Urban Spree', he: 'מתחם אורבן ספרי' }] }
    ],
    'Istanbul': [
        { name: 'Sultanahmet Classics', nameHe: 'הקלאסיקות של סולטנאחמט', desc: 'The heart of historic Istanbul.', descHe: 'הלב ההיסטורי של איסטנבול.', pois: [{ en: 'Hagia Sophia', he: 'איה סופיה' }, { en: 'Blue Mosque', he: 'המסגד הכחול' }, { en: 'Topkapi Palace', he: 'ארמון טופקאפי' }, { en: 'Basilica Cistern', he: 'בור הבזיליקה' }, { en: 'Grand Bazaar', he: 'הבזאר הגדול' }] },
        { name: 'Beyoglu Nights', nameHe: 'לילות ביוגלו', desc: 'Modern Istanbul and nightlife.', descHe: 'איסטנבול המודרנית וחיי לילה.', pois: [{ en: 'Galata Tower', he: 'מגדל גלטה' }, { en: 'Istiklal Street', he: 'רחוב איסטיקלל' }, { en: 'Taksim Square', he: 'כיכר טקסים' }, { en: 'Pera Museum', he: 'מוזיאון פרה' }, { en: 'Karakoy Pier', he: 'מזח קראקוי' }] }
    ],
    'Prague': [
        { name: 'Fairytale Prague', nameHe: 'פראג מהאגדות', desc: 'Castles and bridges.', descHe: 'טירות וגשרים.', pois: [{ en: 'Prague Castle', he: 'מצודת פראג' }, { en: 'Charles Bridge', he: 'גשר קארל' }, { en: 'Old Town Square', he: 'כיכר העיר העתיקה' }, { en: 'Astronomical Clock', he: 'השעון האסטרונומי' }, { en: 'St. Vitus Cathedral', he: 'קתדרלת ויטוס הקדוש' }] },
        { name: 'Mala Strana', nameHe: 'מאלה סטרנה', desc: 'The Lesser Town charm.', descHe: 'הקסם של העיר הקטנה.', pois: [{ en: 'Lennon Wall', he: 'קיר לנון' }, { en: 'Kampa Island', he: 'האי קמפה' }, { en: 'Petrin Hill', he: 'גבעת פטרין' }, { en: 'St. Nicholas Church', he: 'כנסיית ניקולאס הקדוש' }, { en: 'Nerudova Street', he: 'רחוב נרודובה' }] }
    ],
    'Budapest': [
        { name: 'Pearl of Danube', nameHe: 'פנינת הדנובה', desc: 'Parliament and Pest side.', descHe: 'הפרלמנט והצד של פשט.', pois: [{ en: 'Hungarian Parliament', he: 'הפרלמנט ההונגרי' }, { en: 'St. Stephen\'s Basilica', he: 'בזיליקת סטיבן הקדוש' }, { en: 'Shoes on the Danube', he: 'אנדרטת הנעליים על הדנובה' }, { en: 'Heroes Square', he: 'כיכר הגיבורים' }, { en: 'Szechenyi Baths', he: 'מרחצאות סצ׳ני' }] },
        { name: 'Buda Hills', nameHe: 'גבעות בודה', desc: 'Castle District and views.', descHe: 'רובע הטירה ותצפיות.', pois: [{ en: 'Buda Castle', he: 'טירת בודה' }, { en: 'Fisherman\'s Bastion', he: 'מבצר הדייגים' }, { en: 'Matthias Church', he: 'כנסיית מתיאש' }, { en: 'Gellert Hill', he: 'גבעת גלרט' }, { en: 'Citadella', he: 'סיטדלה' }] }
    ],
    'Vienna': [
        { name: 'Imperial Vienna', nameHe: 'וינה האימפריאלית', desc: 'Palaces of the Habsburgs.', descHe: 'ארמונות בית המלוכה הבסבורג.', pois: [{ en: 'Schonbrunn Palace', he: 'ארמון שנברון' }, { en: 'Hofburg', he: 'ארמון הופבורג' }, { en: 'St. Stephen\'s Cathedral', he: 'קתדרלת סטיפנוס הקדוש' }, { en: 'Belvedere Palace', he: 'ארמון בלוודר' }, { en: 'Vienna State Opera', he: 'האופרה של וינה' }] },
        { name: 'Museum Quarter', nameHe: 'רובע המוזיאונים', desc: 'Art and culture hub.', descHe: 'מרכז תרבות ואמנות.', pois: [{ en: 'MuseumsQuartier', he: 'רובע המוזיאונים' }, { en: 'Kunsthistorisches Museum', he: 'המוזיאון לתולדות האמנות' }, { en: 'Albertina', he: 'אלברטינה' }, { en: 'Naschmarkt', he: 'נאשמרקט' }, { en: 'Karlskirche', he: 'כנסיית קארל' }] }
    ],
    'Lisbon': [
        { name: 'Alfama Hills', nameHe: 'גבעות אלפמה', desc: 'Trams and Fado music.', descHe: 'חשמליות ומוזיקת פאדו.', pois: [{ en: 'Castelo de Sao Jorge', he: 'מבצר סאו ז׳ורז׳ה' }, { en: 'Lisbon Cathedral', he: 'קתדרלת ליסבון' }, { en: 'Miradouro de Santa Luzia', he: 'תצפית סנטה לוזיה' }, { en: 'Tram 28 Stops', he: 'תחנות חשמלית 28' }, { en: 'Fado Museum', he: 'מוזיאון הפאדו' }] },
        { name: 'Belem Discovery', nameHe: 'תגליות בבלם', desc: 'Age of Discoveries monuments.', descHe: 'אנדרטאות עידן התגליות.', pois: [{ en: 'Belem Tower', he: 'מגדל בלם' }, { en: 'Jeronimos Monastery', he: 'מנזר ז׳רונימוס' }, { en: 'Pasteis de Belem', he: 'פשטייס דה בלם' }, { en: 'Discoveries Monument', he: 'אנדרטת התגליות' }, { en: 'MAAT Museum', he: 'מוזיאון MAAT' }] }
    ],
    'Singapore': [
        { name: 'Marina Magic', nameHe: 'קסם המרינה', desc: 'Modern wonders of Singapore.', descHe: 'פלאי העיר המודרנית.', pois: [{ en: 'Marina Bay Sands', he: 'מרינה ביי סנדס' }, { en: 'Gardens by the Bay', he: 'גנים ליד המפרץ' }, { en: 'Superjoy Grove', he: 'חורשת עצי העל' }, { en: 'Merlion Park', he: 'פארק המרליון' }, { en: 'Singapore Flyer', he: 'הגלגל הענק' }] },
        { name: 'Heritage Walk', nameHe: 'סיור מורשת', desc: 'Chinatown and culture.', descHe: 'צ׳יינה טאון ותרבות.', pois: [{ en: 'Buddha Tooth Relic Temple', he: 'מקדש שן הבודהה' }, { en: 'Chinatown Heritage Centre', he: 'מרכז המורשת בצ׳יינה טאון' }, { en: 'Sri Mariamman Temple', he: 'מקדש סרי מריאמן' }, { en: 'Maxwell Food Centre', he: 'מרכז המזון מקסוול' }, { en: 'Thian Hock Keng Temple', he: 'מקדש תיאן הוק קנג' }] }
    ],
    'Bangkok': [
        { name: 'Temple Run', nameHe: 'סובב מקדשים', desc: 'Golden Buddhas and wats.', descHe: 'בודהה מזהב ומקדשים.', pois: [{ en: 'Grand Palace', he: 'הארמון הגדול' }, { en: 'Wat Arun', he: 'מקדש השחר' }, { en: 'Wat Pho', he: 'מקדש הבודהה השוכב' }, { en: 'Temple of the Emerald Buddha', he: 'מקדש בודהה האמרלד' }, { en: 'Golden Mount', he: 'הר הזהב' }] },
        { name: 'Street Life', nameHe: 'חיי רחוב', desc: 'Markets and chaotic charm.', descHe: 'שווקים וקסם אורבני.', pois: [{ en: 'Khaosan Road', he: 'קוואסן רואד' }, { en: 'Chatuchak Market', he: 'שוק צ׳אטוצ׳אק' }, { en: 'Chinatown (Yaowarat)', he: 'צ׳יינה טאון' }, { en: 'Jim Thompson House', he: 'בית ג׳ים תומפסון' }, { en: 'Lumpini Park', he: 'פארק לומפיני' }] }
    ],
    'Seoul': [
        { name: 'Royal Seoul', nameHe: 'סיאול המלכותית', desc: 'Palaces and tradition.', descHe: 'ארמונות ומסורת.', pois: [{ en: 'Gyeongbokgung Palace', he: 'ארמון גיונגבוקגונג' }, { en: 'Bukchon Hanok Village', he: 'כפר בוקצ׳ון האנוק' }, { en: 'Changdeokgung Palace', he: 'ארמון צ׳אנגדוקגונג' }, { en: 'Insadong', he: 'אינסאדונג' }, { en: 'Jogyesa Temple', he: 'מקדש ג׳וגייסה' }] },
        { name: 'Gangnam Style', nameHe: 'גנגנאם סטייל', desc: 'Modern K-Pop and shopping.', descHe: 'קיי-פופ מודרני ושופינג.', pois: [{ en: 'COEX Mall', he: 'קניון COEX' }, { en: 'Bongeunsa Temple', he: 'מקדש בונגאונסה' }, { en: 'Lotte World Tower', he: 'מגדל לוטה וורלד' }, { en: 'Garosu-gil', he: 'גארוסו-גיל' }, { en: 'Gangnam Station', he: 'תחנת גנגנאם' }] }
    ],
    'Los Angeles': [
        { name: 'Hollywood Glitz', nameHe: 'הזוהר של הוליווד', desc: 'Stars and movies.', descHe: 'כוכבים וסרטים.', pois: [{ en: 'Hollywood Walk of Fame', he: 'שדרת הכוכבים' }, { en: 'Dolby Theatre', he: 'תיאטרון דולבי' }, { en: 'TCL Chinese Theatre', he: 'התיאטרון הסיני' }, { en: 'Hollywood Sign View', he: 'תצפית לשלט הוליווד' }, { en: 'Griffith Observatory', he: 'מצפה גריפית\'' }] },
        { name: 'Beach Vibes', nameHe: 'אווירת חוף', desc: 'Santa Monica and Venice.', descHe: 'סנטה מוניקה ווניס.', pois: [{ en: 'Santa Monica Pier', he: 'מזח סנטה מוניקה' }, { en: 'Venice Beach Boardwalk', he: 'טיילת וניס ביץ\'' }, { en: 'Muscle Beach', he: 'חוף השרירים' }, { en: 'Venice Canals', he: 'תעלות וניס' }, { en: 'Third Street Promenade', he: 'מדרחוב השדרה השלישית' }] }
    ],
    'San Francisco': [
        { name: 'Bay City', nameHe: 'עיר המפרץ', desc: 'Bridges and piers.', descHe: 'גשרים ומזחים.', pois: [{ en: 'Golden Gate Bridge', he: 'גשר שער הזהב' }, { en: 'Fisherman\'s Wharf', he: 'רציף הדייגים' }, { en: 'Pier 39', he: 'רציף 39' }, { en: 'Alcatraz View', he: 'תצפית לאלקטרז' }, { en: 'Palace of Fine Arts', he: 'ארמון האמנויות היפות' }] },
        { name: 'Mission Cool', nameHe: 'מישן המגניבה', desc: 'Murals and parks.', descHe: 'ציורי קיר ופארקים.', pois: [{ en: 'Mission Dolores Park', he: 'פארק מישן דולורס' }, { en: 'Clarion Alley Murals', he: 'ציורי הקיר בסמטת קלריון' }, { en: 'Valencia Street', he: 'רחוב ולנסיה' }, { en: 'Painted Ladies', he: 'הגברות הצבועות' }, { en: 'Castro Theatre', he: 'תיאטרון קסטרו' }] }
    ],
    'Chicago': [
        { name: 'Windy City', nameHe: 'עיר הרוחות', desc: 'Architecture and huge parks.', descHe: 'אדריכלות ופארקים ענקיים.', pois: [{ en: 'Millennium Park', he: 'פארק המילניום' }, { en: 'The Bean (Cloud Gate)', he: 'השעועית (שער העננים)' }, { en: 'Willis Tower', he: 'מגדל ויליס' }, { en: 'Navy Pier', he: 'נייבי פיר' }, { en: 'Art Institute of Chicago', he: 'המכון לאמנות של שיקגו' }] },
        { name: 'River Walk', nameHe: 'טיילת הנהר', desc: 'Skyscrapers along the water.', descHe: 'גורדי שחקים על המים.', pois: [{ en: 'Chicago Riverwalk', he: 'טיילת נהר שיקגו' }, { en: 'Magnificent Mile', he: 'המייל המופלא' }, { en: 'Tribune Tower', he: 'מגדל טריביון' }, { en: 'Wrigley Building', he: 'בניין ריגלי' }, { en: 'DuSable Bridge', he: 'גשר דוסאבל' }] }
    ],
    'Miami': [
        { name: 'Art Deco & Beach', nameHe: 'ארט דקו וחוף', desc: 'Ocean Drive classics.', descHe: 'הקלאסיקות של שדרות האוקיינוס.', pois: [{ en: 'Ocean Drive', he: 'שדרות האוקיינוס' }, { en: 'Art Deco Welcome Center', he: 'מרכז המבקרים ארט דקו' }, { en: 'Lummus Park', he: 'פארק לומוס' }, { en: 'Gianni Versace Mansion', he: 'אחוזת ג׳יאני ורסצ׳ה' }, { en: 'South Pointe Park', he: 'פארק סאות\' פוינט' }] },
        { name: 'Wynwood Art', nameHe: 'אמנות בווינווד', desc: 'Street art district.', descHe: 'רובע אמנות הרחוב.', pois: [{ en: 'Wynwood Walls', he: 'קירות וינווד' }, { en: 'Miami Design District', he: 'רובע העיצוב של מיאמי' }, { en: 'Perez Art Museum', he: 'מוזיאון פרז לאמנות' }, { en: 'Little Havana', he: 'הוואנה הקטנה' }, { en: 'Calle Ocho', he: 'רחוב שמונה' }] }
    ],
    'Las Vegas': [
        { name: 'The Strip', nameHe: 'הסטריפ', desc: 'Casinos and lights.', descHe: 'בתי קזינו ואורות.', pois: [{ en: 'Bellagio Fountains', he: 'מזרקות בלאג׳יו' }, { en: 'Caesars Palace', he: 'סיזרס פאלאס' }, { en: 'The Venetian', he: 'הונציאני' }, { en: 'Paris Las Vegas', he: 'פריז לאס וגאס' }, { en: 'High Roller', he: 'הגלגל הענק' }] },
        { name: 'Vintage Vegas', nameHe: 'וגאס הוינטג׳ית', desc: 'Fremont Street and history.', descHe: 'רחוב פרמונט והיסטוריה.', pois: [{ en: 'Fremont Street Experience', he: 'חוויית רחוב פרמונט' }, { en: 'Mob Museum', he: 'מוזיאון המאפיה' }, { en: 'Neon Museum', he: 'מוזיאון הניאון' }, { en: 'Golden Nugget', he: 'גולדן נאגט' }, { en: 'Container Park', he: 'פארק המכולות' }] }
    ],
    'Sydney': [
        { name: 'Harbour Icons', nameHe: 'אייקונים בנמל', desc: 'Opera House and bridge.', descHe: 'בית האופרה והגשר.', pois: [{ en: 'Sydney Opera House', he: 'בית האופרה של סידני' }, { en: 'Sydney Harbour Bridge', he: 'גשר נמל סידני' }, { en: 'The Rocks', he: 'הרוקס' }, { en: 'Royal Botanic Garden', he: 'הגנים הבוטניים המלכותיים' }, { en: 'Circular Quay', he: 'סירקולר קי' }] },
        { name: 'Beach Life', nameHe: 'חיי חוף', desc: 'Bondi to Coogee.', descHe: 'מבונדאי לקוג׳י.', pois: [{ en: 'Bondi Beach', he: 'חוף בונדאי' }, { en: 'Bondi Icebergs', he: 'בריכות הקרחונים בונדאי' }, { en: 'Tamarama Beach', he: 'חוף תמראמה' }, { en: 'Bronte Beach', he: 'חוף ברונטה' }, { en: 'Coogee Beach', he: 'חוף קוג׳י' }] }
    ],
    'Melbourne': [
        { name: 'Laneways', nameHe: 'סמטאות מלבורן', desc: 'Coffee and street art.', descHe: 'קפה ואמנות רחוב.', pois: [{ en: 'Hosier Lane', he: 'סמטת הוזייר' }, { en: 'Flinders Street Station', he: 'תחנת פלינדרס' }, { en: 'Federation Square', he: 'כיכר הפדרציה' }, { en: 'Degraves Street', he: 'רחוב דגרייבס' }, { en: 'Bourke Street Mall', he: 'מדרחוב בורק' }] },
        { name: 'St Kilda', nameHe: 'סנט קילדה', desc: 'Beach and Luna Park.', descHe: 'חוף ולונה פארק.', pois: [{ en: 'St Kilda Beach', he: 'חוף סנט קילדה' }, { en: 'Luna Park Melbourne', he: 'לונה פארק מלבורן' }, { en: 'Acland Street', he: 'רחוב אקלנד' }, { en: 'St Kilda Pier', he: 'מזח סנט קילדה' }, { en: 'Royal Botanic Gardens', he: 'הגנים הבוטניים' }] }
    ],
    'Cape Town': [
        { name: 'City Bowl', nameHe: 'קערת העיר', desc: 'Mountain views and history.', descHe: 'נופי הרים והיסטוריה.', pois: [{ en: 'Table Mountain Cableway', he: 'רכבל הר השולחן' }, { en: 'V&A Waterfront', he: 'רציף ויקטוריה ואלפרד' }, { en: 'Zeitz MOCAA', he: 'מוזיאון צייץ לאמנות' }, { en: 'Greenmarket Square', he: 'כיכר גרינמרקט' }, { en: 'Company\'s Garden', he: 'גני החברה' }] },
        { name: 'Bo-Kaap Colors', nameHe: 'הצבעים של בו-קאפ', desc: 'Colorful houses and culture.', descHe: 'בתים צבעוניים ותרבות.', pois: [{ en: 'Bo-Kaap Museum', he: 'מוזיאון בו-קאפ' }, { en: 'Auwal Mosque', he: 'מסגד אוואל' }, { en: 'Rose Corner', he: 'פינת הוורדים' }, { en: 'Chiappini Street', he: 'רחוב צ׳יאפיני' }, { en: 'Noon Gun', he: 'תותח הצהריים' }] }
    ],
    'Rio de Janeiro': [
        { name: 'Marvelous City', nameHe: 'העיר המופלאה', desc: 'Beaches and Christ.', descHe: 'חופים וישו הגואל.', pois: [{ en: 'Copacabana Beach', he: 'חוף קופקבנה' }, { en: 'Christ the Redeemer', he: 'פסל ישו הגואל' }, { en: 'Sugarloaf Mountain', he: 'הר הסוכר' }, { en: 'Ipanema Beach', he: 'חוף איפנמה' }, { en: 'Selaron Steps', he: 'מדרגות סלרון' }] },
        { name: 'Santa Teresa', nameHe: 'סנטה תרזה', desc: 'Bohemian hills.', descHe: 'גבעות בוהמיות.', pois: [{ en: 'Santa Teresa Tram', he: 'החשמלית של סנטה תרזה' }, { en: 'Parque das Ruinas', he: 'פארק ההריסות' }, { en: 'Museu da Chacara do Ceu', he: 'מוזיאון שאקרה דו סאו' }, { en: 'Largo dos Guimaraes', he: 'לארגו דוס גימאראייש' }, { en: 'Sambadrome', he: 'סמבודרומו' }] }
    ],
    'Buenos Aires': [
        { name: 'Paris of South', nameHe: 'פריז של הדרום', desc: 'Grand avenues.', descHe: 'שדרות רחבות וארכיטקטורה.', pois: [{ en: 'Obelisco', he: 'האובליסק' }, { en: 'Teatro Colon', he: 'תיאטרון קולון' }, { en: 'Plaza de Mayo', he: 'פלאסה דה מאיו' }, { en: 'Casa Rosada', he: 'הבית הוורוד' }, { en: 'Café Tortoni', he: 'קפה טורטוני' }] },
        { name: 'Palermo Soho', nameHe: 'פלרמו סוהו', desc: 'Trendy shops and parks.', descHe: 'חנויות טרנדיות ופארקים.', pois: [{ en: 'Plaza Serrano', he: 'פלאסה סראנו' }, { en: 'Botanical Garden', he: 'הגן הבוטני' }, { en: 'Japanese Garden', he: 'הגן היפני' }, { en: 'MALBA Museum', he: 'מוזיאון MALBA' }, { en: 'Floralis Generica', he: 'הפרח המתכתי' }] }
    ],
    'Mexico City': [
        { name: 'Historic Center', nameHe: 'המרכז ההיסטורי', desc: 'Aztec ruins and cathedrals.', descHe: 'עתיקות אצטקיות וקתדרלות.', pois: [{ en: 'Zocalo', he: 'כיכר זוקאלו' }, { en: 'Metropolitan Cathedral', he: 'הקתדרלה המטרופוליטנית' }, { en: 'Templo Mayor', he: 'טמפלו מאיור' }, { en: 'Palacio de Bellas Artes', he: 'ארמון האמנויות היפות' }, { en: 'Latin American Tower', he: 'המגדל הלטינו-אמריקאי' }] },
        { name: 'Roma & Condesa', nameHe: 'רומא וקונדסה', desc: 'Hipster avenues and parks.', descHe: 'שדרות היפסטריות ופארקים.', pois: [{ en: 'Parque Mexico', he: 'פארק מקסיקו' }, { en: 'Parque Espana', he: 'פארק אספניה' }, { en: 'Alvaro Obregon Avenue', he: 'שדרות אלברו אוברגון' }, { en: 'Casa Lamm', he: 'קאזה לאם' }, { en: 'Cibeles Fountain', he: 'מזרקת סיבלס' }] }
    ]
};

const getRandomOffset = () => (Math.random() - 0.5) * 0.02;

async function seed() {
    console.log('🌱 Starting seed with LOCALIZATION...');

    // Optional: Clean up existing seed routes from this user to avoid duplicates if logic allows
    // For now, we rely on the DB ID generation to just create new ones, logic should handle dedupe or just live with it for seed dev
    // Ideally: Delete all routes where user_id = SYSTEM_USER_ID AND preferences->>'theme' = 'seed'

    const { error: deleteError } = await supabase.from('routes').delete().match({ user_id: SYSTEM_USER_ID });
    if (deleteError) console.log('Notice: Could not clean old routes (RLS probably prevented it), creating new ones anyway.');
    else console.log('🧹 Cleaned old system routes.');

    for (const city of CITIES) {
        const routes = ROUTES_DATA[city.name];
        if (!routes) {
            console.log(`⚠️ No routes for ${city.name} ...`);
            continue;
        }

        console.log(`📍 Processing ${city.name} (${city.nameHe})...`);

        for (const routeDef of routes) {
            // 1. Construct POIs
            const pois = routeDef.pois.map((poiItem: any, idx: number) => ({
                id: `seed-poi-${city.name}-${idx}-${Date.now()}`,
                name: poiItem.en,
                lat: city.lat + getRandomOffset(),
                lng: city.lng + getRandomOffset(),
                order_index: idx,
                travel_data: null,
                data: {
                    description: `Visit ${poiItem.en}, a highlight of ${city.name}.`,
                    description_he: `ביקור ב${poiItem.he}, אחד משיאי הביקור ב${city.nameHe}.`,
                    category: 'history',
                    name_he: poiItem.he,
                    name_en: poiItem.en // Explicitly save EN as well in data for easy fallback
                }
            }));

            // 2. Call RPC
            const { data, error } = await supabase.rpc('save_generated_route', {
                p_user_id: SYSTEM_USER_ID,
                p_city: city.name,
                p_name: routeDef.name,
                p_description: routeDef.desc,
                p_duration: pois.length * 30, // Approx 30 mins per stop
                p_preferences: {
                    theme: 'seed',
                    interests: ['Highlights'],
                    names: { en: routeDef.name, he: routeDef.nameHe },
                    descriptions: { en: routeDef.desc, he: routeDef.descHe }
                },
                p_pois: pois,
                p_is_public: true,
                p_parent_route_id: null
            });

            if (error) {
                console.error(`❌ Failed to save ${routeDef.name}:`, error.message);
            } else {
                console.log(`✅ Saved ${routeDef.name} / ${routeDef.nameHe}`);
            }
        }
    }

    console.log('✨ Seed complete!');
}

seed();
