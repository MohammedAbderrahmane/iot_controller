package com.iot_controller.Services

import android.os.Handler
import android.os.Looper
import android.widget.TextView
import com.iot_controller.Model.IoTObject
import org.eclipse.californium.core.CoapClient
import org.eclipse.californium.core.coap.CoAP
import org.eclipse.californium.core.coap.Request

fun handleGetSpeed(device: IoTObject?, token:String, textView: TextView, errorView: TextView) {
    if (device == null) {
        errorView.text = "device is not connected"
        val handler = Handler(Looper.getMainLooper())
        handler.postDelayed({
            errorView.text = ""
        }, 1000L)
        return
    }
    try {
        val coapClient = CoapClient("coap://${device.ipAddress}:${device.port}/get_speed")
        coapClient.setTimeout(500)

        val request = Request(CoAP.Code.POST)
        request.payload = token.encodeToByteArray()

        val response = coapClient.advanced(request)
        if (response != null && response.isSuccess) {
            textView.text = response.responseText
        } else {
            errorView.text = response.responseText
        }
        coapClient.shutdown()
    } catch (exception: Exception) {
        errorView.text = exception.message
        val handler = Handler(Looper.getMainLooper())
        handler.postDelayed({
            errorView.text = ""
        }, 1000L)
    }
}

fun handleSetSpeed(device: IoTObject?,token: String, speed: Int, errorView: TextView) {
    if (device == null) {
        errorView.text = "device is not connected"
        val handler = Handler(Looper.getMainLooper())
        handler.postDelayed({
            errorView.text = ""
        }, 1000L)
        return
    }
    var coapClient = CoapClient("coap://${device.ipAddress}:${device.port}/set_speed")
    coapClient.setTimeout(500)

    val request = Request(CoAP.Code.POST)
    request.payload = (token + (speed.toString())).encodeToByteArray()

    try {
        val response = coapClient.advanced(request)
        if (response != null && response.isSuccess) {
            errorView.text = response.responseText
        } else {
            errorView.text = response.responseText
        }
        coapClient.shutdown()
    } catch (exception: Exception) {
        errorView.text = exception.toString()
        val handler = Handler(Looper.getMainLooper())
        handler.postDelayed({
            errorView.text = ""
        }, 1000L)
    }
}