package com.iot_controller

import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.eclipse.californium.core.CoapClient
import org.eclipse.californium.core.CoapHandler
import org.eclipse.californium.core.CoapResponse
import org.eclipse.californium.core.coap.CoAP.Code
import org.eclipse.californium.core.coap.MediaTypeRegistry
import org.eclipse.californium.core.coap.Request
import org.eclipse.californium.oscore.HashMapCtxDB
import org.eclipse.californium.oscore.OSCoreCoapStackFactory
import org.eclipse.californium.oscore.OSCoreCtx


class HomeActivity : AppCompatActivity() {

    private lateinit var input_ip: EditText
    private lateinit var input_port: EditText
    private lateinit var input_url: EditText
    private lateinit var input_body: EditText
    private lateinit var btn_request: Button
    private lateinit var btn_stop_observing: Button
    private lateinit var text_result: TextView
    private lateinit var spinner_choice: Spinner

    lateinit var coapClient: CoapClient
    private var choice = "GET"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_home)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.activity_home)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        input_ip = findViewById(R.id.input_ip)
        input_port = findViewById(R.id.input_port)
        input_url = findViewById(R.id.input_url_post)
        spinner_choice = findViewById(R.id.input_choice)
        input_body = findViewById(R.id.input_body)
        btn_request = findViewById(R.id.btn_send_request)
        btn_stop_observing = findViewById(R.id.btn_stop_observing)
        text_result = findViewById(R.id.text_result)


        val options = listOf("GET", "GET (OBSERVE)", "POST")
        val adapter = ArrayAdapter(
            this, android.R.layout.simple_spinner_item, options
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinner_choice.adapter = adapter

        spinner_choice.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(
                parent: AdapterView<*>?, view: View?, position: Int, id: Long,
            ) {
                choice = options[position];

                if (choice == "POST") {
                    input_body.visibility = View.VISIBLE
                    return
                }
                if (choice == "GET (OBSERVE)") {
                    btn_stop_observing.visibility = View.VISIBLE
                    return
                }
                input_body.visibility = View.GONE
                btn_stop_observing.visibility = View.GONE

            }

            override fun onNothingSelected(parent: AdapterView<*>?) {
                choice = "GET";
            }
        }
    }

    fun handleRequest(view: View) {
        val ip = input_ip.text.toString()
        val port = if (input_port.text.isBlank()) "9583" else input_port.text.toString()
        val resource = input_url.text.toString()

        val url = "coap://$ip:$port/$resource"

        val masterSecret: ByteArray = "0000".toByteArray(Charsets.US_ASCII)
        val clientId: ByteArray = "client".toByteArray(Charsets.US_ASCII)
        val serverId: ByteArray = "iot".toByteArray(Charsets.US_ASCII)

        val context: OSCoreCtx = OSCoreCtx(
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
        db.addContext(url, context)
        OSCoreCoapStackFactory.useAsDefault(db)

        coapClient = CoapClient(url)
        coapClient.setTimeout(5000)

        if (choice == "GET") {
            val request = Request(Code.GET)
            request.options.setOscore(byteArrayOf(0))

            Thread {
                val response: CoapResponse? = coapClient.advanced(request)
                runOnUiThread {
                    if (response != null && response.isSuccess)
                        text_result.text =
                            "${response?.code} : ${response.responseText} \npayload size=${response.payloadSize} : ${response.payload.toString()}"
                    else text_result.text = "${response?.code}"
                }
                coapClient.shutdown()
            }.start()


        } else if (choice == "POST") {
            val body = input_body.text.toString()

            val request = Request(Code.POST)
            request.options.setOscore(byteArrayOf(0))
            request.options.contentFormat = MediaTypeRegistry.TEXT_PLAIN
            request.payload = body.toByteArray()

            Thread {
                val response: CoapResponse? = coapClient.advanced(request)
                runOnUiThread {
                    if (response != null && response.isSuccess)
                        text_result.text =
                            "${response?.code} : ${response.responseText} \npayload size=${response.payloadSize} : ${response.payload.toString()}"
                    else text_result.text = "${response?.code}"
                }
                coapClient.shutdown()
            }.start()

        } else {
            val request = Request(Code.GET)
            request.options.setOscore(byteArrayOf(0))
            request.setObserve()


            Thread {
                coapClient.advanced(object : CoapHandler {
                    override fun onLoad(response: CoapResponse) {
                        runOnUiThread {
                            text_result.text = "${response?.code} : ${response.responseText}"
                        }
                    }

                    override fun onError() {
                        runOnUiThread {
                            text_result.text = "Observation failed"
                        }
                    }
                }, request)
            }.start()
        }

    }

    fun createOscoreContext(url: String): HashMapCtxDB {
        val masterSecret: ByteArray = "0000".toByteArray(Charsets.US_ASCII)
        val clientId: ByteArray = "client".toByteArray(Charsets.US_ASCII)
        val serverId: ByteArray = "iot".toByteArray(Charsets.US_ASCII)

        val context: OSCoreCtx = OSCoreCtx(
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
        db.addContext(context)
        OSCoreCoapStackFactory.useAsDefault(db)
        return db
    }

    fun handleStopObserving(view: View) {
        coapClient.shutdown()
    }


}