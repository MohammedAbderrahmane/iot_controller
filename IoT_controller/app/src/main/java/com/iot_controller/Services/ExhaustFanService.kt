package com.iot_controller.Services

import android.R.bool
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.provider.CalendarContract.Colors
import android.widget.TextView
import com.iot_controller.Model.IoTObject
import org.eclipse.californium.core.CoapClient
import org.eclipse.californium.core.coap.CoAP
import org.eclipse.californium.core.coap.Request

fun handleGetTemp(device: IoTObject?,token:String, textView: TextView, errorView: TextView) {
    if (device == null) {
        errorView.text = "device is not connected"
        val handler = Handler(Looper.getMainLooper())
        handler.postDelayed({
            errorView.text = ""
        }, 1000L)
        return
    }
    try {
        val coapClient = CoapClient("coap://${device.ipAddress}:${device.port}/temperature")
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


fun handleONOff(device: IoTObject?,token: String, isON: Boolean, errorView: TextView) {
    if (device == null) {
        errorView.text = "device is not connected"
        val handler = Handler(Looper.getMainLooper())
        handler.postDelayed({
            errorView.text = ""
        }, 1000L)
        return
    }
    var coapClient = CoapClient("coap://${device.ipAddress}:${device.port}/set_led")
    coapClient.setTimeout(500)

    val request = Request(CoAP.Code.POST)
    request.payload = (token + (if (isON) "ON" else "OFF")).encodeToByteArray()

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