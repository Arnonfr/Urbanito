package com.urbanito.walk.data

import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.selects.select
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Builds walking tours with zero paid calls — Kotlin port of services/openDataRouteEngine.ts.
 *
 *  - Wikipedia geosearch: real, geotagged places near the start (+ image, article size)
 *  - Wikidata: what each place is and hard facts (year, architect, style, heritage, website)
 *  - Wikipedia extracts: intros now, the full article when a stop is opened
 *
 * Ordering (nearest neighbour + 2-opt) and walking estimates are local.
 */
object OpenDataEngine {
    private const val WALK_FACTOR = 1.25
    private const val WALK_M_PER_MIN = 80.0
    private const val MIN_PER_STOP = 12
    private const val MIN_SPACING_M = 60.0

    // ------------------------------------------------------------ geometry

    fun distance(a: LatLng, b: LatLng): Double {
        val r = 6371000.0
        val rad = Math.PI / 180
        val dLat = (b.lat - a.lat) * rad
        val dLng = (b.lng - a.lng) * rad
        val h = sin(dLat / 2).pow(2) + cos(a.lat * rad) * cos(b.lat * rad) * sin(dLng / 2).pow(2)
        return 2 * r * asin(sqrt(h))
    }

    private fun pathLength(start: LatLng, pts: List<LatLng>): Double {
        var total = 0.0
        var prev = start
        for (p in pts) { total += distance(prev, p); prev = p }
        return total
    }

    /** Open path from a fixed start: nearest neighbour, then 2-opt until no improvement. */
    private fun <T> order(start: LatLng, items: List<T>, pos: (T) -> LatLng): List<T> {
        val remaining = items.toMutableList()
        val ordered = mutableListOf<T>()
        var cur = start
        while (remaining.isNotEmpty()) {
            val next = remaining.minBy { distance(cur, pos(it)) }
            remaining.remove(next)
            ordered += next
            cur = pos(next)
        }
        var improved = true
        while (improved) {
            improved = false
            for (i in 0 until ordered.size - 1) for (j in i + 1 until ordered.size) {
                val candidate = ordered.subList(0, i) + ordered.subList(i, j + 1).reversed() + ordered.subList(j + 1, ordered.size)
                if (pathLength(start, candidate.map(pos)) + 0.5 < pathLength(start, ordered.map(pos))) {
                    ordered.clear(); ordered += candidate; improved = true
                }
            }
        }
        return ordered
    }

    fun walk(meters: Double): Walk {
        val walked = meters * WALK_FACTOR
        return Walk(walked.roundToInt(), max(1, (walked / WALK_M_PER_MIN).roundToInt()))
    }

    // ------------------------------------------------------------ classification

    private data class Rule(val re: Regex, val category: Category, val score: Double, val religious: Boolean = false)

    // Matched against English labels of Wikidata "instance of" (P31) classes. Order matters: specific first.
    private val RULES = listOf(
        Rule(Regex("synagogue"), Category.HERITAGE, 0.8, true),
        Rule(Regex("cathedral|basilica|church|chapel|mosque|temple|monastery|abbey|convent|shrine|minaret"), Category.HERITAGE, 0.8, true),
        Rule(Regex("museum"), Category.CULTURE, 1.0),
        Rule(Regex("theatre|theater|opera|concert hall|cinema|library|cultural (center|centre)|arts? (center|centre)"), Category.CULTURE, 0.85),
        Rule(Regex("art gallery|gallery"), Category.ART, 0.85),
        Rule(Regex("sculpture|statue|mural|mosaic|artwork|public art|work of art|graffiti|fountain"), Category.ART, 0.85),
        Rule(Regex("viewpoint|observation|lookout|belvedere"), Category.VIEWPOINT, 0.9),
        Rule(Regex("market|food hall|bazaar|souk|shuk"), Category.MARKET, 0.85),
        Rule(Regex("restaurant|caf[eé]|coffeehouse|bakery|brewery|pub\\b|bar\\b|tavern"), Category.MARKET, 0.6),
        Rule(Regex("memorial|monument|archaeological|castle|fortress|fortification|\\bfort\\b|ruins|city gate|city wall|gate|tomb|mausoleum|cemetery|historic site|battlefield|tower house"), Category.HISTORY, 1.0),
        Rule(Regex("palace|mansion|villa|townhouse|hôtel particulier|house|building|tower|skyscraper|city hall|town hall|bridge|lighthouse|arcade|covered passage|clock tower|hall|structure|edifice|courthouse|bathhouse|hammam|water tower|well"), Category.ARCHITECTURE, 0.8),
        Rule(Regex("square|plaza|piazza|boulevard|promenade|esplanade"), Category.ARCHITECTURE, 0.7),
        Rule(Regex("park|garden|beach|zoo|botanical|nature reserve|island|pond|lake|spring"), Category.NATURE, 0.75),
        Rule(Regex("shopping|department store|passage|mall"), Category.SHOPPING, 0.5),
        Rule(Regex("street|avenue|road|alley|lane"), Category.ARCHITECTURE, 0.45),
        Rule(Regex("university|college|school|hospital|hotel|station"), Category.ARCHITECTURE, 0.4),
    )

    // Geotagged articles that are not places you can visit.
    private val EXCLUDE = Regex(
        "\\bhuman\\b|\\bevent\\b|battle|siege|\\bwar\\b|riot|\\bfire$|disaster|attack|massacre|shooting|fusillade|bombing|explosion|robbery|heist|theft|crime|murder|assassination|pogrom|incident|accident|\\bfilm\\b|\\bbook\\b|novel|album|company|business|enterprise|organi[sz]ation|political party|association|sports (club|team)|newspaper|magazine|record label|website|^ship$|aircraft|neighbo(u)?rhood|^quarter$|district|arrondissement|urban (area|ensemble)|^(city|big city|capital|commune|municipality|town|village|human settlement)$|administrative|metro station|subway station|tram stop|bus station|bus stop|embassy|consulate|ministry|government agency|^bank$|insurance|demonstration|protest|election|treaty|occupation|uprising"
    )

    // ------------------------------------------------------------ candidate discovery

    private data class Page(val lat: Double, val lng: Double, val titles: MutableMap<String, String>, var length: Int, var thumbnail: String?)

    private data class EntityInfo(val classesEn: List<String>, val facts: Facts, val titles: Map<String, String>)

    private data class Candidate(
        val qid: String,
        val pos: LatLng,
        val titles: Map<String, String>,
        val articleLength: Int,
        val thumbnail: String?,
        val category: Category,
        val primaryClass: String,
        val typeScore: Double,
        val isReligious: Boolean,
        val isJewish: Boolean,
        val facts: Facts,
        var score: Double = 0.0,
    )

    private val candidateCache = mutableMapOf<String, List<Candidate>>()

    private fun JsonElement?.str(): String? = (this as? kotlinx.serialization.json.JsonPrimitive)?.contentOrNull
    private fun JsonObject.obj(key: String) = this[key] as? JsonObject
    private fun JsonObject.arr(key: String) = this[key] as? JsonArray

    private suspend fun geosearch(lang: String, center: LatLng, radiusM: Int): List<JsonObject> {
        val data = Http.getJson(
            "https://$lang.wikipedia.org/w/api.php",
            mapOf(
                "action" to "query", "format" to "json", "formatversion" to "2",
                "generator" to "geosearch", "ggscoord" to "${center.lat}|${center.lng}",
                "ggsradius" to min(10000, radiusM).toString(), "ggslimit" to "100",
                "prop" to "coordinates|pageimages|pageprops|info", "piprop" to "thumbnail",
                "pithumbsize" to "800", "pilimit" to "max", "colimit" to "max", "ppprop" to "wikibase_item",
            )
        )
        return data.jsonObject.obj("query")?.arr("pages")?.map { it.jsonObject } ?: emptyList()
    }

    private fun yearOf(time: String?): String? {
        val m = Regex("^([+-]?)0*(\\d+)-").find(time ?: return null) ?: return null
        return if (m.groupValues[1] == "-") "${m.groupValues[2]} לפנה\"ס" else m.groupValues[2]
    }

    private fun JsonObject.binding(key: String) = obj(key)?.get("value").str()
    private fun splitList(v: String?) = v?.split('|')?.filter { it.isNotBlank() }?.distinct() ?: emptyList()

    /** One SPARQL request (~50KB) for classes, facts and he/en titles of all candidates. */
    private suspend fun entityInfoSparql(ids: List<String>, lang: String): Map<String, EntityInfo> {
        fun localized(v: String, prop: String) = """OPTIONAL { ?item wdt:$prop ?${v}E .
            OPTIONAL { ?${v}E rdfs:label ?${v}L FILTER(LANG(?${v}L) = "$lang") }
            OPTIONAL { ?${v}E rdfs:label ?${v}N FILTER(LANG(?${v}N) = "en") }
            BIND(COALESCE(?${v}L, ?${v}N) AS ?$v) }"""
        val query = """SELECT ?item
            (GROUP_CONCAT(DISTINCT ?clsEn; separator="|") AS ?classesEn) (GROUP_CONCAT(DISTINCT ?cls; separator="|") AS ?classes)
            (SAMPLE(?inc) AS ?inception) (SAMPLE(?web) AS ?website) (SAMPLE(?heT) AS ?he) (SAMPLE(?enT) AS ?en)
            (GROUP_CONCAT(DISTINCT ?arch; separator="|") AS ?architects) (GROUP_CONCAT(DISTINCT ?sty; separator="|") AS ?styles)
            (GROUP_CONCAT(DISTINCT ?her; separator="|") AS ?heritage)
          WHERE {
            VALUES ?item { ${ids.joinToString(" ") { "wd:$it" }} }
            OPTIONAL { ?item wdt:P31 ?clsE . ?clsE rdfs:label ?clsEn FILTER(LANG(?clsEn) = "en")
              OPTIONAL { ?clsE rdfs:label ?clsL FILTER(LANG(?clsL) = "$lang") } BIND(COALESCE(?clsL, ?clsEn) AS ?cls) }
            ${localized("arch", "P84")}
            ${localized("sty", "P149")}
            ${localized("her", "P1435")}
            OPTIONAL { ?item wdt:P571 ?inc }
            OPTIONAL { ?item wdt:P856 ?web }
            OPTIONAL { ?heA schema:about ?item; schema:isPartOf <https://he.wikipedia.org/>; schema:name ?heT }
            OPTIONAL { ?enA schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?enT }
          } GROUP BY ?item"""
        val res = Http.postForm("https://query.wikidata.org/sparql", mapOf("query" to query, "format" to "json"), "application/sparql-results+json")
        val out = mutableMapOf<String, EntityInfo>()
        res.jsonObject.obj("results")?.arr("bindings")?.forEach { el ->
            val b = el.jsonObject
            val qid = b.binding("item")?.substringAfterLast('/') ?: return@forEach
            out[qid] = EntityInfo(
                classesEn = splitList(b.binding("classesEn")).map { it.lowercase() },
                titles = buildMap { b.binding("he")?.let { put("he", it) }; b.binding("en")?.let { put("en", it) } },
                facts = Facts(
                    inception = yearOf(b.binding("inception")),
                    architects = splitList(b.binding("architects")),
                    styles = splitList(b.binding("styles")),
                    heritage = splitList(b.binding("heritage")),
                    website = b.binding("website"),
                    instanceOf = splitList(b.binding("classes")).take(2),
                ),
            )
        }
        return out
    }

    /** Fallback when SPARQL is slow or down: the regular Wikidata API (heavier). */
    private suspend fun entityInfoApi(ids: List<String>, lang: String): Map<String, EntityInfo> {
        suspend fun get(chunk: List<String>, props: String): Map<String, JsonObject> {
            val out = mutableMapOf<String, JsonObject>()
            chunk.chunked(50).forEach { part ->
                val data = Http.getJson(
                    "https://www.wikidata.org/w/api.php",
                    mapOf("action" to "wbgetentities", "format" to "json", "ids" to part.joinToString("|"), "props" to props, "languages" to "$lang|en", "sitefilter" to "hewiki|enwiki")
                )
                data.jsonObject.obj("entities")?.forEach { (k, v) -> out[k] = v.jsonObject }
            }
            return out
        }
        fun claimIds(e: JsonObject, p: String) = e.obj("claims")?.arr(p)?.mapNotNull {
            it.jsonObject.obj("mainsnak")?.obj("datavalue")?.obj("value")?.get("id").str()
        } ?: emptyList()
        fun claimValue(e: JsonObject, p: String) = e.obj("claims")?.arr(p)?.firstOrNull()?.jsonObject?.obj("mainsnak")?.obj("datavalue")?.get("value")

        val entities = get(ids.take(50), "claims|sitelinks")
        val refIds = entities.values.flatMap { e -> listOf("P31", "P84", "P149", "P1435").flatMap { claimIds(e, it) } }.distinct()
        val refs = runCatching { get(refIds, "labels") }.getOrDefault(emptyMap())
        fun label(id: String, l: String = lang) = refs[id]?.obj("labels")?.let { it.obj(l) ?: it.obj("en") }?.get("value").str()

        return entities.mapValues { (_, e) ->
            EntityInfo(
                classesEn = claimIds(e, "P31").mapNotNull { label(it, "en")?.lowercase() },
                titles = buildMap {
                    e.obj("sitelinks")?.obj("hewiki")?.get("title").str()?.let { put("he", it) }
                    e.obj("sitelinks")?.obj("enwiki")?.get("title").str()?.let { put("en", it) }
                },
                facts = Facts(
                    inception = yearOf((claimValue(e, "P571") as? JsonObject)?.get("time").str()),
                    architects = claimIds(e, "P84").mapNotNull { label(it) },
                    styles = claimIds(e, "P149").mapNotNull { label(it) },
                    heritage = claimIds(e, "P1435").mapNotNull { label(it) },
                    website = claimValue(e, "P856").str(),
                    instanceOf = claimIds(e, "P31").mapNotNull { label(it) }.take(2),
                ),
            )
        }
    }

    /** SPARQL latency varies (1–10s): after 3.5s race it against the API; first success wins. */
    private suspend fun entityInfoFastest(ids: List<String>, lang: String): Map<String, EntityInfo> = coroutineScope {
        val sparql = async { runCatching { entityInfoSparql(ids, lang) }.getOrNull() }
        withTimeoutOrNull(3500) { sparql.await() }?.let { return@coroutineScope it }
        val api = async { runCatching { entityInfoApi(ids, lang) }.getOrNull() }
        val first = select<Map<String, EntityInfo>?> {
            sparql.onAwait { it }
            api.onAwait { it }
        }
        val result = first ?: (if (sparql.isCompleted) api.await() else sparql.await())
        sparql.cancel(); api.cancel()
        result ?: throw IllegalStateException("Wikidata unavailable")
    }

    private suspend fun discover(center: LatLng, radiusM: Int, lang: String): List<Candidate> {
        val key = "%s-%.3f-%.3f-%d".format(lang, center.lat, center.lng, radiusM / 100)
        candidateCache[key]?.let { return it }

        val langs = if (lang == "he") listOf("he", "en") else listOf("en")
        val lists = coroutineScope { langs.map { l -> async { runCatching { geosearch(l, center, radiusM) }.getOrDefault(emptyList()) } }.map { it.await() } }

        val byQid = linkedMapOf<String, Page>()
        lists.forEachIndexed { i, pages ->
            val l = langs[i]
            for (p in pages) {
                val qid = p.obj("pageprops")?.get("wikibase_item").str() ?: continue
                val coord = p.arr("coordinates")?.firstOrNull()?.jsonObject ?: continue
                val lat = coord["lat"]?.jsonPrimitive?.doubleOrNull ?: continue
                val lon = coord["lon"]?.jsonPrimitive?.doubleOrNull ?: continue
                val page = byQid.getOrPut(qid) { Page(lat, lon, mutableMapOf(), 0, null) }
                p["title"].str()?.let { page.titles[l] = it }
                page.length = max(page.length, p["length"]?.jsonPrimitive?.intOrNull ?: 0)
                if (page.thumbnail == null) page.thumbnail = p.obj("thumbnail")?.get("source").str()
            }
        }
        if (byQid.isEmpty()) return emptyList()

        val ids = byQid.entries.sortedByDescending { it.value.length }.map { it.key }.take(60)
        val info = entityInfoFastest(ids, lang)

        val result = byQid.mapNotNull { (qid, page) ->
            val entity = info[qid] ?: return@mapNotNull null
            if (entity.classesEn.isEmpty()) return@mapNotNull null
            var best: Rule? = null
            var primary = ""
            var excluded = false
            for (cl in entity.classesEn) {
                if (EXCLUDE.containsMatchIn(cl)) { excluded = true; continue }
                val rule = RULES.firstOrNull { it.re.containsMatchIn(cl) } ?: continue
                if (best == null || rule.score > best.score) { best = rule; primary = cl }
            }
            val rule = best ?: return@mapNotNull null
            if (excluded && rule.score < 0.8) return@mapNotNull null
            val titles = entity.titles + page.titles
            val text = "${entity.classesEn.joinToString(" ")} ${titles.values.joinToString(" ")}"
            Candidate(
                qid = qid, pos = LatLng(page.lat, page.lng), titles = titles, articleLength = page.length,
                thumbnail = page.thumbnail, category = rule.category, primaryClass = primary, typeScore = rule.score,
                isReligious = rule.religious, isJewish = Regex("synagogue|jewish|בית כנסת|יהוד", RegexOption.IGNORE_CASE).containsMatchIn(text),
                facts = entity.facts,
            )
        }
        candidateCache[key] = result
        return result
    }

    // ------------------------------------------------------------ scoring & selection

    private fun score(cands: List<Candidate>, prefs: Preferences, lang: String, start: LatLng, radiusM: Int): List<Candidate> {
        val wantsReligion = Category.HERITAGE in prefs.interests
        return cands
            .filter { c ->
                !c.isReligious || prefs.includeReligious || wantsReligion || (prefs.jewishHeritage && c.isJewish) || c.articleLength > 50000
            }
            .map { c ->
                val fame = min(1.0, ln(max(1000, c.articleLength).toDouble()) / ln(10.0) / 5)
                val local = if (c.titles.containsKey(lang)) 1.0 else 0.0
                val facts = listOf(c.facts.inception != null, c.facts.architects.isNotEmpty(), c.facts.styles.isNotEmpty(), c.facts.heritage.isNotEmpty()).count { it }
                val proximity = 1 - min(1.0, distance(start, c.pos) / radiusM)
                var s = c.typeScore * 2 + fame * (1.6 - prefs.hiddenGems) + local * (if (lang == "he") 1.2 else 0.4) +
                    (if (c.thumbnail != null) 0.5 else 0.0) + facts * 0.15 + proximity * 0.6
                if (c.category in prefs.interests) s += 1.2
                if (prefs.jewishHeritage && c.isJewish) s += 1.5
                c.copy(score = s)
            }
            .sortedByDescending { it.score }
    }

    /** Greedy pick under the walking budget; each pick lowers the appeal of more of the same. */
    private fun select(ranked: List<Candidate>, start: LatLng, count: Int, budgetM: Double): List<Candidate> {
        val chosen = mutableListOf<Candidate>()
        val pool = ranked.take(80)
        while (chosen.size < count) {
            var pick: Candidate? = null
            var pickScore = Double.NEGATIVE_INFINITY
            for (c in pool) {
                if (c in chosen || chosen.any { distance(it.pos, c.pos) < MIN_SPACING_M }) continue
                val adjusted = c.score - chosen.count { it.primaryClass == c.primaryClass } * 0.9 - chosen.count { it.category == c.category } * 0.35
                if (adjusted <= pickScore) continue
                if (pathLength(start, order(start, chosen + c) { it.pos }.map { it.pos }) * WALK_FACTOR > budgetM) continue
                pick = c; pickScore = adjusted
            }
            chosen += pick ?: break
        }
        return order(start, chosen) { it.pos }
    }

    // ------------------------------------------------------------ content

    private fun cleanExtract(text: String) = text
        .replace(Regex("\\b(UK|US|listen)\\s*:\\s*[,;]?\\s*"), "")
        .replace(Regex("\\(\\s*[,;]\\s*"), "(")
        .replace(Regex("\\(\\s*\\)\\s*"), "")
        .replace(Regex("[ \\t]{2,}"), " ")
        .trim()

    fun firstSentences(text: String, n: Int): String {
        val parts = Regex("[^.!?]+[.!?]+(\\s|$)").findAll(text.replace(Regex("\\s+"), " ")).map { it.value }.toList()
        return if (parts.isEmpty()) text else parts.take(n).joinToString("").trim()
    }

    private suspend fun intros(lang: String, titles: List<String>): Map<String, String> {
        val out = mutableMapOf<String, String>()
        titles.chunked(20).forEach { chunk ->
            val data = runCatching {
                Http.getJson(
                    "https://$lang.wikipedia.org/w/api.php",
                    mapOf("action" to "query", "format" to "json", "formatversion" to "2", "prop" to "extracts", "exintro" to "1", "explaintext" to "1", "exlimit" to "20", "redirects" to "1", "titles" to chunk.joinToString("|"))
                )
            }.getOrNull() ?: return@forEach
            val q = data.jsonObject.obj("query") ?: return@forEach
            val redirects = q.arr("redirects")?.associate { it.jsonObject["to"].str() to it.jsonObject["from"].str() } ?: emptyMap()
            q.arr("pages")?.forEach { p ->
                val o = p.jsonObject
                val title = o["title"].str() ?: return@forEach
                val extract = o["extract"].str() ?: return@forEach
                out[redirects[title] ?: title] = cleanExtract(extract)
            }
        }
        return out
    }

    // "Great Synagogue (Tel Aviv)" → "Great Synagogue"
    private fun displayName(title: String?) = title?.replace(Regex("\\s*\\([^)]*\\)\\s*$"), "")?.trim()

    private fun toStop(c: Candidate, lang: String, intro: String?, introLang: String?, prev: LatLng?): Stop {
        val he = displayName(c.titles["he"])
        val en = displayName(c.titles["en"])
        val name = (if (lang == "he") he ?: en else en ?: he) ?: c.qid
        val original = if (lang == "he") en?.takeIf { it != name } else he?.takeIf { it != name }
        val wikiLang = if (c.titles.containsKey(lang)) lang else if (lang == "he") "en" else "he"
        return Stop(
            id = "od-${c.qid}", qid = c.qid, name = name, originalName = original, lat = c.pos.lat, lng = c.pos.lng,
            category = c.category, summary = intro?.let { firstSentences(it, 2) } ?: "", intro = intro ?: "",
            imageUrl = c.thumbnail, facts = c.facts, wikiLang = wikiLang, wikiTitle = c.titles[wikiLang] ?: name,
            introLang = introLang, walkFromPrevious = prev?.let { walk(distance(it, c.pos)) },
        )
    }

    private val AI_ONLY = setOf(Category.MARKET, Category.SHOPPING)

    /** Returns null when open data can't produce a good tour (too few documented places). */
    suspend fun buildTour(city: String, start: LatLng, prefs: Preferences, lang: String = "he"): Tour? {
        val count = max(2, prefs.stops)
        val budget = max(800.0, prefs.walkingKm * 1000.0)
        var radius = min(4000.0, max(500.0, budget * 0.4)).toInt()
        var ranked: List<Candidate> = emptyList()
        var stops: List<Candidate> = emptyList()
        for (attempt in 0 until 2) {
            ranked = score(discover(start, radius, lang), prefs.copy(interests = prefs.interests - AI_ONLY), lang, start, radius)
            stops = select(ranked, start, count, budget)
            if (stops.size >= count) break
            radius = min(10000, (radius * 1.8).toInt()) // sparse area: look a bit wider once
        }
        if (stops.size < max(2, (count * 0.6).toInt())) return null

        val byLang = stops.groupBy { if (it.titles.containsKey(lang)) lang else if (lang == "he") "en" else "he" }
        val introMap = coroutineScope {
            byLang.map { (l, list) -> async { l to intros(l, list.mapNotNull { it.titles[l] }) } }.associate { it.await() }
        }
        var prev: LatLng? = start
        val result = stops.map { c ->
            val l = listOf(lang, "en", "he").firstOrNull { c.titles[it] != null && introMap[it]?.get(c.titles[it]) != null }
            val stop = toStop(c, lang, l?.let { introMap[it]?.get(c.titles[it]) }, l, prev)
            prev = c.pos
            stop
        }

        val used = stops.map { it.qid }.toSet()
        val detours = ranked
            .filter { c -> c.qid !in used && stops.any { distance(it.pos, c.pos) < 300 } && stops.none { distance(it.pos, c.pos) < MIN_SPACING_M } }
            .take(3)
            .map { toStop(it, lang, null, null, null) }

        val walkedM = pathLength(start, stops.map { it.pos }) * WALK_FACTOR
        val minutes = (walkedM / WALK_M_PER_MIN + result.size * MIN_PER_STOP).roundToInt()
        return Tour(
            id = "tour-${System.currentTimeMillis()}",
            city = city,
            title = city,
            start = start,
            stops = result,
            detours = detours,
            distanceMeters = walkedM.roundToInt(),
            durationMinutes = minutes,
            path = listOf(start) + result.map { it.position },
        )
    }

    // ------------------------------------------------------------ full article (lazy)

    private val SKIP_SECTIONS = Regex(
        "^(ראו גם|לקריאה נוספת|קישורים חיצוניים|הערות שוליים|גלריה|ביבליוגרפיה|מקורות|See also|References|External links|Further reading|Notes|Gallery|Bibliography|Sources|Citations)$",
        RegexOption.IGNORE_CASE,
    )

    suspend fun details(stop: Stop, lang: String = "he"): StopDetails? {
        val title = stop.wikiTitle
        val wikiLang = stop.wikiLang
        val data = runCatching {
            Http.getJson(
                "https://$wikiLang.wikipedia.org/w/api.php",
                mapOf("action" to "query", "format" to "json", "formatversion" to "2", "prop" to "extracts", "explaintext" to "1", "exsectionformat" to "wiki", "redirects" to "1", "titles" to title)
            )
        }.getOrNull() ?: return null
        val text = cleanExtract(data.jsonObject.obj("query")?.arr("pages")?.firstOrNull()?.jsonObject?.get("extract").str() ?: "")
        if (text.length < 400) return null

        val heading = Regex("\\n(={2,})\\s*(.+?)\\s*\\1\\n")
        val matches = heading.findAll(text).toList()
        val intro = text.substring(0, matches.firstOrNull()?.range?.first ?: text.length).trim()
        val sections = mutableListOf<Section>()
        var skipping = false
        matches.forEachIndexed { i, m ->
            val level = m.groupValues[1].length
            val t = m.groupValues[2]
            val body = text.substring(m.range.last + 1, matches.getOrNull(i + 1)?.range?.first ?: text.length).trim()
            if (level == 2) {
                skipping = SKIP_SECTIONS.matches(t)
                if (!skipping) sections += Section(t, body)
            } else if (!skipping && body.isNotEmpty() && sections.isNotEmpty()) {
                val last = sections.removeAt(sections.lastIndex)
                sections += last.copy(body = "${last.body}\n\n$t\n$body".trim())
            }
        }
        fun clip(s: String, n: Int) = if (s.length > n) s.substring(0, s.lastIndexOf(' ', n).coerceAtLeast(n / 2)) + "…" else s
        var main = intro
        var rest = sections.filter { it.body.isNotBlank() }.take(6).map { it.copy(body = clip(it.body, 1800)) }
        if (main.length < 500 && rest.isNotEmpty()) { main = "$main\n\n${rest.first().body}"; rest = rest.drop(1) }
        return StopDetails(clip(main, 3000), rest, wikiLang)
    }
}
