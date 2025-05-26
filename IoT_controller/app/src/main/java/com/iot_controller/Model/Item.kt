package com.iot_controller.Model

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

data class Item(
    val Gid: String,
    val Attrib: String,
    val Key: String
)

fun getAttribListFromJson(jsonString: String): List<String> {
    // Create a Gson instance
    val gson = Gson()

    // Define the type of the target object (List of Item)
    val listType = object : TypeToken<List<Item>>() {}.type

    // Deserialize the JSON string into a List of Item objects
    val itemList: List<Item> = gson.fromJson(jsonString, listType)

    // Extract the "Attrib" value from each Item and collect into a new List<String>
    val attribList: List<String> = itemList.map { it.Attrib }

    return attribList
}