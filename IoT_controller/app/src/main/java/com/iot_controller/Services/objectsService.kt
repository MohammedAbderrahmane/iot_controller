import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast
import com.google.gson.GsonBuilder
import com.google.gson.JsonParser
import com.iot_controller.IoTActivities.ExhaustFan_Activity
import com.iot_controller.Model.IoTObject
import com.iot_controller.IoTActivities.Object2Activity
import com.iot_controller.Services.getAssociatedAuthorities
import maabe_tools.Maabe_tools
import org.eclipse.californium.core.CoapClient
import org.eclipse.californium.core.coap.CoAP
import org.eclipse.californium.core.coap.Request
import org.json.JSONArray

const val MAABE_PUBLIC_PARAMETERS: String =
    "{\"P\":\"j7UB40qjh/mqb+y4YYTcIS6NjhL4KzkkGi70W1escmE=\"," +
            "\"G1\":\"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGPtQHjSqOH+apv7LhhhNwh7luI0SC1tZ4YXKxsXgiWZQ==\"," +
            "\"G2\":\"AS7MpEb/bz1NA8dum1x1Lyi8N7NkywWsSjfrMuHDJFlwjyU4b3LJRiuBWX1lriCSxLl3khVdzarTK4pt1BeSU0wtsQ71IzsP45Yrnuaku8K1veAaVPNRPULfly4SjzG/EidOV0foyvrMNxbMhpnbebIvDk/zwj6Jj2lEIKO+MIel\"," +
            "\"Gt\":\"Ltzr5bSo0lY4xO2nLlF1Rzn9KFMQLxvUc6hNVzn4upJf5qyNFlXGOcQCYmAJmVyDKYxJXXvm6KXlMg9CFjc6iA5p/LgYJAIx764tNRH9fkDZNCXqmm+/Xq2Hz6zP+RJybLPHTV7aQrGgMjrRNHdsPkyTLJFbHiBzIYR4cy/ej54uHdzewL+zYYEMO/eFX4zED291gqduyoo6y+Vw/7h0h3h25PCNm3+6wgUZ1zx9bWyZX0mxGVoleaiOC0shgIplVvU6o4SqXvHP2pcoS82BnNumDvbdWFpgV0yw5z5A/IZ1Yia6uuz9clABpO7FWUSKEHTaOKuJxykMAYgcoBlC60PyTA6892h9NU0v/SepFOd7pZ06nj+a++OZEhTke6W7Hfsl5+pCFK9WAbCnmJFt/M+YkFpkQi3xAhapOs9izz1+MlwBVaMZ2Km36Ctt512nGpDwzEcdVmeTDI88Ox2/Q4S6Fg/VwO/PAZqzzYugE9rTGedosSicQNLC4YyFHhTr\"}"


fun decryptToken(context: Context, cypherToken: String): String? {
    var userKeys: String

    val userCredentials = getAssociatedAuthorities(context)
    val combinedJsonKeys = JSONArray()
    for (authCredentials in userCredentials) {
        val currentArray = JSONArray(authCredentials.keys)
        for (i in 0 until currentArray.length()) {
            // Get the JSONObject at the current index
            val jsonObject = currentArray.getJSONObject(i)
            combinedJsonKeys.put(jsonObject)
        }
    }
    userKeys = combinedJsonKeys.toString()

    val plaintext = Maabe_tools.decryptCypherText(
        MAABE_PUBLIC_PARAMETERS.encodeToByteArray(),
        cypherToken,
        userKeys.encodeToByteArray()
    )
    Log.e("e", cypherToken)
    Log.e("e", plaintext)
    Log.e("e", userKeys)

    if (plaintext == null || plaintext.isEmpty()) {
        return null
    }
    return plaintext;
}


fun goToObjectActivity(device: IoTObject, token: String, context: Context) {

    if (token == null) {
        Toast.makeText(context, "There is no token for this object !", Toast.LENGTH_LONG).show()
        return;
    }

    val intent = when (device.name) {
        "object_1" -> Intent(
            context,
            ExhaustFan_Activity::class.java
        )

        "object_2" -> Intent(
            context,
            Object2Activity::class.java
        )

        else -> Intent()
    }
    intent.putExtra("device", device)
    intent.putExtra("token", token)
    context.startActivity(intent)
}

fun getIotObjects(fogNodeURI:String): ArrayList<IoTObject> {
    var ioTObjects = ArrayList<IoTObject>()
    val coapClient = CoapClient("${fogNodeURI}/objects")
    coapClient.setTimeout(2000)

    val request = Request(CoAP.Code.GET)

    val response = coapClient.advanced(request)
    if (response != null && response.isSuccess) {
        var iotObjectsJson = response.payload.decodeToString()
        val gson =
            GsonBuilder().registerTypeAdapter(IoTObject::class.java, IoTObject.IoTObjectDeserializer())
                .create()
        val jsonArray = JsonParser.parseString(iotObjectsJson).asJsonArray
        ioTObjects =
            jsonArray.map { gson.fromJson(it, IoTObject::class.java) } as ArrayList<IoTObject>
        return ioTObjects
    } else if (response == null) {
        throw Exception("Failed to get authorities : Fog node didn't respond")
    }
    throw Exception("Failed to get authorities\n${response.responseText}")
}

fun requestEncryptedToken(fogNodeUrl: String, iotName: String): String? {
    val coapClient = CoapClient("${fogNodeUrl}/register")
    coapClient.setTimeout(500)

    val request = Request(CoAP.Code.PUT)
    request.payload = iotName.encodeToByteArray()

    val response = coapClient.advanced(request)
    if (response != null && response.isSuccess) {
        return response.responseText
    } else {
        return null
    }
}