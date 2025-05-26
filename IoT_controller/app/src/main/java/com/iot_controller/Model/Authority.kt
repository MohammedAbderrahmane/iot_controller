package com.iot_controller.Model

import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import java.lang.reflect.Type

class Authority {
    val name: String
    val url: String

    class JSONDeserializer : JsonDeserializer<Authority> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type,
            context: JsonDeserializationContext,
        ): Authority {
            val jsonObj = json.asJsonObject

            val name = jsonObj["authority"].asString
            val url = jsonObj["url"].asString

            return Authority(
                authorityName = name,
                url = url,
            )
        }
    }


    constructor(
        authorityName: String,
        url: String,
    ) {
        this.name = authorityName
        this.url = url
    }
}
