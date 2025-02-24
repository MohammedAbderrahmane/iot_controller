package com.iot_controller.Services

import okhttp3.Call
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

val URL = "http://192.168.1.100:3000/api"

fun login(userJSON: String): Call {
    val client = OkHttpClient()

    val body = userJSON.toRequestBody("application/json".toMediaType())

    val request = Request.Builder()
        .url("${URL}/releveur/login")
        .post(body)
        .build()

    return client.newCall(request)
}