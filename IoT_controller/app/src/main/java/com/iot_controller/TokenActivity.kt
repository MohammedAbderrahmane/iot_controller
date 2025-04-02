package com.iot_controller

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.AdapterView
import android.widget.Button
import android.widget.CheckBox
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import maabe_tools.Maabe_tools
import org.eclipse.californium.core.CoapClient
import org.eclipse.californium.core.CoapResponse
import org.eclipse.californium.core.coap.CoAP
import org.eclipse.californium.core.coap.MediaTypeRegistry
import org.eclipse.californium.core.coap.Request
import org.eclipse.californium.oscore.HashMapCtxDB
import org.eclipse.californium.oscore.OSCoreCoapStackFactory
import org.eclipse.californium.oscore.OSCoreCtx


class TokenActivity : AppCompatActivity() {

    private var cypheredToken: String? = null
    private var token: String? = null
    private var selectedObject: String? = null


    lateinit var btn_token: Button
    lateinit var btn_iot: Button
    lateinit var btn_decrypt: Button
    lateinit var text_token: TextView
    lateinit var text_result: TextView
    lateinit var checkbox_oscore: CheckBox
    lateinit var spinner_object_choice: Spinner


    lateinit var coapClient: CoapClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_token)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        btn_token = findViewById(R.id.btn_token)
        btn_iot = findViewById(R.id.btn_iot)
        btn_decrypt = findViewById(R.id.btn_decrypt)
        text_token = findViewById(R.id.text_token)
        text_result = findViewById(R.id.text_iot_result)
        checkbox_oscore = findViewById(R.id.checkbox_oscore)
        spinner_object_choice = findViewById(R.id.spinner_object_choice)

        btn_token.setOnClickListener { handleGetToken() }
        btn_iot.setOnClickListener { handleGetRessource() }
        btn_decrypt.setOnClickListener { handleDecryptToken() }
        spinner_object_choice.setOnItemSelectedListener(object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(
                parent: AdapterView<*>,
                view: View,
                position: Int,
                id: Long,
            ) {
                selectedObject = parent.getItemAtPosition(position).toString()
                Toast.makeText(this@TokenActivity, "Selected: $selectedObject", Toast.LENGTH_SHORT)
                    .show()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {
                // Another interface callback
            }
        })

        val masterSecret: ByteArray = "0000".toByteArray(Charsets.US_ASCII)
        val clientId: ByteArray = "client".toByteArray(Charsets.US_ASCII)
        val serverId: ByteArray = "fog".toByteArray(Charsets.US_ASCII)
        val iotId: ByteArray = "iot".toByteArray(Charsets.US_ASCII)

        val withIot: OSCoreCtx = OSCoreCtx(
            masterSecret,
            true,
            null,
            clientId,
            iotId,
            null,
            32,
            null,
            null,
            1024
        )
        val withFog: OSCoreCtx = OSCoreCtx(
            masterSecret,
            true,
            null,
            clientId,
            serverId,
            null,
            32,
            null,
            null,
            1024
        )
        val db: HashMapCtxDB = HashMapCtxDB()
        db.addContext("coap://192.168.1.12:5683", withIot)
        db.addContext("coap://192.168.1.100:5684", withFog)
        OSCoreCoapStackFactory.useAsDefault(db)
    }

    fun handleGetToken() {
        text_token.text = "sending request ..."

        coapClient = CoapClient("coap://192.168.1.100:5683/objects")
        coapClient.setTimeout(5000)

        val request = Request(CoAP.Code.POST)
        request.options.contentFormat = MediaTypeRegistry.TEXT_PLAIN
        request.payload = selectedObject?.toByteArray()
        if (checkbox_oscore.isChecked)
            request.options.setOscore(byteArrayOf(0))


        val response: CoapResponse? = coapClient.advanced(request)
        if (response != null && response.isSuccess) {
            cypheredToken = response.payload.decodeToString()
            if (cypheredToken == null) {
                text_token.text = "received cyphered token is null"
                return
            }
            text_token.text = "received cyphered token : ${cypheredToken}"

        } else text_token.text = "${response?.code} ${response?.responseText}"
        coapClient.shutdown()
    }

    fun handleGetRessource() {

        text_result.text = "sending request ..."


        coapClient = CoapClient("coap://192.168.1.12:5684/")
        coapClient.setTimeout(5000)

        val request = Request(CoAP.Code.POST)
        request.payload = token?.encodeToByteArray()
        if (checkbox_oscore.isChecked) {
            request.options.setOscore(byteArrayOf(0))
            request.options.oscore
        }


        val response: CoapResponse? = coapClient.advanced(request)
        runOnUiThread {
            if (response != null && response.isSuccess) {
                text_result.text = "${response.responseText}"
            } else text_result.text = "${response?.code} ${response?.responseText}"
        }
        coapClient.shutdown()
    }

    fun handleDecryptToken(){

        val maabePublicParameters: String =
            "{\"P\":\"j7UB40qjh/mqb+y4YYTcIS6NjhL4KzkkGi70W1escmE=\",\"G1\":\"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGPtQHjSqOH+apv7LhhhNwh7luI0SC1tZ4YXKxsXgiWZQ==\",\"G2\":\"AS7MpEb/bz1NA8dum1x1Lyi8N7NkywWsSjfrMuHDJFlwjyU4b3LJRiuBWX1lriCSxLl3khVdzarTK4pt1BeSU0wtsQ71IzsP45Yrnuaku8K1veAaVPNRPULfly4SjzG/EidOV0foyvrMNxbMhpnbebIvDk/zwj6Jj2lEIKO+MIel\",\"Gt\":\"Ltzr5bSo0lY4xO2nLlF1Rzn9KFMQLxvUc6hNVzn4upJf5qyNFlXGOcQCYmAJmVyDKYxJXXvm6KXlMg9CFjc6iA5p/LgYJAIx764tNRH9fkDZNCXqmm+/Xq2Hz6zP+RJybLPHTV7aQrGgMjrRNHdsPkyTLJFbHiBzIYR4cy/ej54uHdzewL+zYYEMO/eFX4zED291gqduyoo6y+Vw/7h0h3h25PCNm3+6wgUZ1zx9bWyZX0mxGVoleaiOC0shgIplVvU6o4SqXvHP2pcoS82BnNumDvbdWFpgV0yw5z5A/IZ1Yia6uuz9clABpO7FWUSKEHTaOKuJxykMAYgcoBlC60PyTA6892h9NU0v/SepFOd7pZ06nj+a++OZEhTke6W7Hfsl5+pCFK9WAbCnmJFt/M+YkFpkQi3xAhapOs9izz1+MlwBVaMZ2Km36Ctt512nGpDwzEcdVmeTDI88Ox2/Q4S6Fg/VwO/PAZqzzYugE9rTGedosSicQNLC4YyFHhTr\"}"
        val userKeys: String =
            "[{\"Gid\":\"mohammed\",\"Attrib\":\"tlemcen:etudiant\",\"Key\":\"YXEwp0XzIpg1k+ZW/qtA/OD2iFnUP/ZZROSfjrFicjuHoHjjadzHWhdvFTc+MQYro8bBUohGUkiiYDz4g4ktpg==\"},{\"Gid\":\"mohammed\",\"Attrib\":\"tlemcen:prof\",\"Key\":\"VfGuszHqz9uyM1mAQV4aLqha9U/N0AlJSqgaZDeDtNN+4czQTm14vBQMgyfIGgPOze3nozc5la5ROpefN6aopQ==\"},{\"Gid\":\"mohammed\",\"Attrib\":\"oran:assistant\",\"Key\":\"iGQAtxnS9NYjM7POiyw8SInJPqhIqdvQ4Hz4EES8GTAxduicvBdauStPPyLU+hHAFz5itMkzs+U3qG30GRp6eg==\"}]"

        Log.i("\uD83D\uDCDB", cypheredToken.toString())

        val plaintext = Maabe_tools.decryptCypherText(
            maabePublicParameters.encodeToByteArray(),
            cypheredToken,
            userKeys.encodeToByteArray()
        )

        if (plaintext == null || plaintext.isEmpty()) {
            text_token.text = "failed to decrypt : wrong keys"
            return
        }
        text_token.text = "token : ${plaintext}"
        token = plaintext
    }
}