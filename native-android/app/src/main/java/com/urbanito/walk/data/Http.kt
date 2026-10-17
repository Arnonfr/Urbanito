package com.urbanito.walk.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import okhttp3.FormBody
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

/** One shared client. Wikimedia asks every client to identify itself with a User-Agent. */
object Http {
    const val USER_AGENT = "Urbanito/0.1 (Android; https://github.com/Arnonfr/Urbanito)"

    val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .addInterceptor { chain ->
            chain.proceed(chain.request().newBuilder().header("User-Agent", USER_AGENT).build())
        }
        .build()

    val json = Json { ignoreUnknownKeys = true; isLenient = true }

    suspend fun getJson(url: String, params: Map<String, String> = emptyMap()): JsonElement = withContext(Dispatchers.IO) {
        val httpUrl = url.toHttpUrl().newBuilder().apply { params.forEach { (k, v) -> addQueryParameter(k, v) } }.build()
        client.newCall(Request.Builder().url(httpUrl).build()).execute().use { res ->
            if (!res.isSuccessful) throw IOException("HTTP ${res.code} for ${httpUrl.host}${httpUrl.encodedPath}")
            json.parseToJsonElement(res.body!!.string())
        }
    }

    suspend fun postForm(url: String, form: Map<String, String>, accept: String): JsonElement = withContext(Dispatchers.IO) {
        val body = FormBody.Builder().apply { form.forEach { (k, v) -> add(k, v) } }.build()
        val req = Request.Builder().url(url).post(body).header("Accept", accept).build()
        client.newCall(req).execute().use { res ->
            if (!res.isSuccessful) throw IOException("HTTP ${res.code} for $url")
            json.parseToJsonElement(res.body!!.string())
        }
    }
}
