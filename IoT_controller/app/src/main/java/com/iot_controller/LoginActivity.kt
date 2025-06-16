package com.iot_controller

import android.app.AlertDialog
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.Switch
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.gson.GsonBuilder
import com.google.gson.JsonParser
import com.iot_controller.Model.Authority
import com.iot_controller.components.showLoadingDialog
import org.bouncycastle.crypto.generators.SCrypt
import org.eclipse.californium.core.CoapClient
import org.eclipse.californium.core.coap.CoAP
import java.net.InetAddress
import java.util.Base64
import java.util.concurrent.Executors
import kotlin.math.ln


class LoginActivity : AppCompatActivity() {

    private val FOG_NODE_DEFAULT_DOMAIN = "Louriachi-PC"

    private lateinit var text_status: TextView
    private lateinit var input_username: EditText
    private lateinit var input_password: EditText
    private lateinit var btn_login: Button

    private lateinit var input_fog_ip: EditText
    private lateinit var input_fog_port: EditText
    private lateinit var switch_fog_automode: Switch

    private lateinit var sharedPref: SharedPreferences

    private fun setStatus(text: String, color: Int = R.color.black, durration: Long? = null) {
        Handler(Looper.getMainLooper()).post {
            if (color != null) {
                val chosenColor = resources.getColor(color, null)
                text_status.setTextColor(chosenColor)
            }
            text_status.text = text
            if (durration != null) {
                Handler(Looper.getMainLooper()).postDelayed({
                    text_status.text = ""
                }, durration)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {

        super.onCreate(savedInstanceState)
        enableEdgeToEdge()



        setContentView(R.layout.activity_login)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.activity_login)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        sharedPref = this.getSharedPreferences("IoTController", MODE_PRIVATE)
        val username = sharedPref.getString("username", "")

        if (username != null && !username.isEmpty()) {
            Log.e("e", username)
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
            finish();
        }

        text_status = findViewById(R.id.a_text_login_status)
        input_username = findViewById(R.id.a_input_login_username)
        btn_login = findViewById(R.id.a_btn_login)
        input_password = findViewById(R.id.a_input_login_password)
        switch_fog_automode = findViewById(R.id.a_login_switch_fog_auto_mode)
        input_fog_ip = findViewById(R.id.a_login_input_fog_ip)
        input_fog_port = findViewById(R.id.a_login_input_fog_port)

        btn_login.setOnClickListener {
            handleLogin(input_username.text.toString(), input_password.text.toString())
        }

        switch_fog_automode.setOnCheckedChangeListener { buttonView, isChecked ->
            val view = findViewById<View>(R.id.a_login_layout_ip_port_layout)

            if (isChecked) {
                view.visibility = View.GONE
            } else {
                view.visibility = View.VISIBLE
            }
        }
    }


    private fun handleLogin(username: String, password: String) {
        val executor = Executors.newSingleThreadExecutor()
        val handler = Handler(Looper.getMainLooper())

        if (input_username.text.isEmpty() || input_password.text.isEmpty()) {
            setStatus("Failed to proceed : username/password is empty", R.color.error)
            return
        }
        if (!switch_fog_automode.isChecked && input_fog_ip.text.isEmpty()) {
            setStatus("Failed to proceed : domain/ip is empty", R.color.error)
            return
        }

        val host =
            if (switch_fog_automode.isChecked) FOG_NODE_DEFAULT_DOMAIN else "${input_fog_ip.text}"
        val port = input_fog_port.text.toString().trim()
        val uri = if (port == "5683" || port.isEmpty()) {
            "coap://$host"
        } else {
            "coap://$host:$port"
        }
        Log.e("zzzz",uri)
        executor.execute {

            var loadingDialog: AlertDialog? = null
            handler.post {
                loadingDialog = showLoadingDialog(this, "pinging fog node...")
            }

            val coapClient = CoapClient("$uri/ping")
            coapClient.setTimeout(2000)

            val request = org.eclipse.californium.core.coap.Request(CoAP.Code.GET)

            try {
                val response = coapClient.advanced(request)
                if (response != null && response.isSuccess) {
                    handler.post {
                        loadingDialog!!.dismiss()
                    }
                } else {
                    handler.post {
                        loadingDialog!!.dismiss()
                    }
                    setStatus("Fog node is unreachable", R.color.error)
                    return@execute
                }
            } catch (e: Exception) {
                Log.e("eee",e.toString())
                handler.post {
                    loadingDialog!!.dismiss()
                }
                setStatus("Fog node is unreachable", R.color.error)
                return@execute
            }


            setStatus("Found the fog node, Proceeding to home page ...", R.color.success)
            val inputPassword = "${input_password.text}"
            val username = "${input_username.text}"

            val N = 16384;
            val r = 8
            val p = 1
            val keylen = 64

            val derivedPasswordBytes = SCrypt.generate(
                inputPassword.encodeToByteArray(),
                username.encodeToByteArray(),
                N, r, p, keylen
            )
            val derivedPassword = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Base64.getEncoder().encodeToString(derivedPasswordBytes)
            } else {
                "impossible"
            }

            handler.postDelayed({
                val editor = sharedPref.edit()
                editor.putString("username", username)
                editor.putString("password", derivedPassword)
                editor.putString("fogNodeHost", host)
                if (!switch_fog_automode.isChecked) {
                    editor.putString("fogNodeURI", uri)
                } else {
                    editor.putString("fogNodeURI", "coap://$host")
                }
                editor.apply()

                val intent = Intent(this, MainActivity::class.java)
                startActivity(intent)
                finish();
            }, 1500)
        }
    }

}