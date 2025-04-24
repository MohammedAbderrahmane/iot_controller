package com.iot_controller.Services

import android.content.Context
import android.util.Log
import com.google.gson.GsonBuilder
import com.google.gson.JsonParser
import com.iot_controller.Model.Authority
import com.iot_controller.db.AuthEntry
import com.iot_controller.db.AuthorityDbHelper
import okhttp3.Cache
import okhttp3.Call
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.eclipse.californium.core.CoapClient
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import kotlin.time.Duration


fun loginToAuthority(
    username: String,
    password: String,
    url: String,
): Call {
    val client = OkHttpClient.Builder()
        .connectTimeout(1L, TimeUnit.SECONDS)
        .readTimeout(1L, TimeUnit.SECONDS)
        .build()
    val userJson = JSONObject()
    userJson.put("username", username)
    userJson.put("password", password)

    val body = userJson.toString().toRequestBody("application/json".toMediaType())

    val request = Request.Builder()
        .url(url)
        .post(body)
        .build()
    return client.newCall(request)

}

val FOG_NODE_URL = "coap://192.168.1.100:5683/authorities"

fun getAuthorities(): ArrayList<Authority> {
    var authoritiesList = ArrayList<Authority>()
    var authorityJson = ""
    val coapClient = CoapClient(FOG_NODE_URL)
    coapClient.setTimeout(500)

    val response = coapClient.get()
    if (response != null && response.isSuccess) {
        authorityJson = response.payload.decodeToString()
        Log.e("zzz",authorityJson)
    } else {
    Log.e("zzz",response.responseText)
        return authoritiesList
    }
    coapClient.shutdown()

    val gson = GsonBuilder()
        .registerTypeAdapter(Authority::class.java, Authority.JSONDeserializer())
        .create()

    val jsonArray = JsonParser.parseString(authorityJson).asJsonArray
    authoritiesList =
        jsonArray.map { gson.fromJson(it, Authority::class.java) } as ArrayList<Authority>
    return authoritiesList
}

fun getLogedInAuthorities(context: Context): ArrayList<AuthEntry> {
    val dbHelper = AuthorityDbHelper(context)
    return dbHelper.getAllAuthEntries()
}