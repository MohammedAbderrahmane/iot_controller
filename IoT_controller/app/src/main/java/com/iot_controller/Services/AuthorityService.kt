package com.iot_controller.Services

import android.content.Context
import android.util.Log
import com.google.gson.GsonBuilder
import com.google.gson.JsonParser
import com.iot_controller.Model.Authority
import com.iot_controller.db.MaabeKey
import com.iot_controller.db.MaabeKeyDbHelper
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.eclipse.californium.core.CoapClient
import org.eclipse.californium.core.coap.CoAP
import org.json.JSONObject
import java.util.concurrent.TimeUnit

fun retrieveAuthority(
    userJson: JSONObject,
    url: String,
    authorityName: String,
    context: Context,
): MaabeKey {
    val client = OkHttpClient.Builder().connectTimeout(5L, TimeUnit.SECONDS)
        .readTimeout(10L, TimeUnit.SECONDS).build()

    val body = userJson.toString().toRequestBody("application/json".toMediaType())
    val request = Request.Builder().url(url).post(body).build()

    client.newCall(request).execute().use { response ->
        val responsePayload = response.body?.string()
                
        Log.e("e", responsePayload!!)

        if (!response.isSuccessful) {
            val jsonResponse = JSONObject(responsePayload!!)
            val errorMessage = jsonResponse.getString("message")

            throw Exception("Falled : ${errorMessage}")
        }


        val dbHelper = MaabeKeyDbHelper(context)
        return dbHelper.insertAuthEntry(authorityName, responsePayload)
    }
}

fun getAuthorities(fogNodeURI: String): ArrayList<Authority> {
    var authoritiesList = ArrayList<Authority>()

    val coapClient = CoapClient("${fogNodeURI}/authorities")
    coapClient.setTimeout(2000)

    val request = org.eclipse.californium.core.coap.Request(CoAP.Code.GET)

    val response = coapClient.advanced(request)
    if (response != null && response.isSuccess) {
        var authorityJson = response.payload.decodeToString()
        val gson =
            GsonBuilder().registerTypeAdapter(Authority::class.java, Authority.JSONDeserializer())
                .create()
        val jsonArray = JsonParser.parseString(authorityJson).asJsonArray
        authoritiesList =
            jsonArray.map { gson.fromJson(it, Authority::class.java) } as ArrayList<Authority>
        return authoritiesList
    } else if (response == null) {
        throw Exception("Failed to get authorities : Fog node didn't respond")
    }
    throw Exception("Failed to get authorities\n${response.responseText}")
}

fun getAssociatedAuthorities(context: Context): ArrayList<MaabeKey> {
    val dbHelper = MaabeKeyDbHelper(context)
    return dbHelper.getAllAuthEntries()
}

fun deleteAssociatedAuthority(context: Context, authName: String): Boolean {
    val dbHelper = MaabeKeyDbHelper(context)
    return dbHelper.deleteAuthEntry(authName) == 1
}