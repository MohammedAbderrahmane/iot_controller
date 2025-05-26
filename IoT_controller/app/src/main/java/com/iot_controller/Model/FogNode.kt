package com.iot_controller.Model

import android.util.Log
import com.google.gson.GsonBuilder
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import com.google.gson.JsonParser
import java.lang.reflect.Type

class FogNode {
    val name: String
    val id: String
    val ipAddress: String
    val port: String
    val ioTObjects: ArrayList<IoTObject>

    class JSONDeserializer : JsonDeserializer<FogNode> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type,
            context: JsonDeserializationContext,
        ): FogNode {
            val jsonObj = json.asJsonObject

            val id = jsonObj["id"].asString
            val name = jsonObj["name"].asString
            val ipAddress = jsonObj["ipAddress"].asString
            val port = jsonObj["port"].asInt
            val objectsJson = jsonObj["iotObjects"].asJsonArray

            Log.e("aaz", objectsJson.size().toString())
            val gson = GsonBuilder()
                .registerTypeAdapter(IoTObject::class.java, IoTObject.IoTObjectDeserializer())
                .create()

            val ioTObjects =
                objectsJson.map { gson.fromJson(it, IoTObject::class.java) } as ArrayList<IoTObject>

            Log.e("aaz", ioTObjects.size.toString())

            return FogNode(
                name = name,
                port = port.toString(),
                ipAddress = ipAddress,
                id = id,
                ioTObjects = ioTObjects
            )
        }
    }

    constructor(
        name: String,
        ipAddress: String,
        id: String,
        port: String,
        ioTObjects: ArrayList<IoTObject>,
    ) {
        this.name = name
        this.ipAddress = ipAddress
        this.port = port
        this.id = id
        this.ioTObjects = ioTObjects
    }
}