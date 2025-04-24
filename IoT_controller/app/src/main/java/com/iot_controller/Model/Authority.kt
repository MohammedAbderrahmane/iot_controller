package com.iot_controller.Model

import android.util.Log
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import java.lang.reflect.Type

class Authority {
    val name: String
    val ipAddress: String
    val port: String

    class JSONDeserializer : JsonDeserializer<Authority> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type,
            context: JsonDeserializationContext
        ): Authority {
            val jsonObj = json.asJsonObject

            val name = jsonObj["ID"].asString
            val ipAddress = jsonObj["host"].asString
            val port = jsonObj["port"].asInt

            return Authority(
                authorityName = name,
                port = port.toString(),
                ipAddress = ipAddress,
            )
        }
    }


    constructor(
        authorityName: String,
        ipAddress: String,
        port: String,
    ) {
        this.name = authorityName
        this.ipAddress = ipAddress
        this.port = port
    }
}
