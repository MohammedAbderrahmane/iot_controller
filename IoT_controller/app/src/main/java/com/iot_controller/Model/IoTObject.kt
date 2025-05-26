package com.iot_controller.Model

import android.graphics.Color
import android.util.Log
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import maabe_tools.Maabe_tools
import java.io.Serializable
import java.lang.reflect.Type

class IoTObject : Serializable {
    var ipAddress: String? = null
    var port: String? = null
    var accessPolicy: String? = null
    var name: String
    var description: String
    var encryptedToken: String? = null
//    var endpoints: Map<String, String>?

    class IoTObjectDeserializer : JsonDeserializer<IoTObject> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type,
            context: JsonDeserializationContext,
        ): IoTObject {
            val jsonObj = json.asJsonObject

            val name = jsonObj["name"].asString
            val description = jsonObj["description"].asString
            if (jsonObj["ipAddress"] == null) {
                return IoTObject(
                    name = name,
                    descryption = description,
                )
            }
            val accessPolicy = jsonObj["accessPolicy"].asString
            val ipAddress = jsonObj["ipAddress"].asString
            val port = jsonObj["port"].asString


            val iotObject = IoTObject(
                port = port,
                name = name,
                ipAddress = ipAddress,
                descryption = description,
                accessPolicy = accessPolicy,
            )

            if (!jsonObj["encryptedToken"].isJsonNull) {
                iotObject.encryptedToken = jsonObj["encryptedToken"].asString
            }

            return iotObject
        }
    }

    constructor(
        name: String,
        descryption: String,
        ipAddress: String?,
        port: String?,
        accessPolicy: String?,
    ) {
        this.port = port
        this.name = name
        this.ipAddress = ipAddress
        this.description = descryption
        this.accessPolicy = accessPolicy
    }

    constructor(
        name: String,
        descryption: String,
    ) {
        this.name = name
        this.description = descryption
    }
}