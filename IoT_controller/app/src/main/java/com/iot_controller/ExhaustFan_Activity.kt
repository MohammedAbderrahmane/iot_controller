package com.iot_controller

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.CompoundButton
import android.widget.TextView
import android.widget.ToggleButton
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.iot_controller.Model.IoTObject
import com.iot_controller.Services.handleGetTemp
import com.iot_controller.Services.handleONOff


class ExhaustFan_Activity : AppCompatActivity() {

    var device: IoTObject? = null
    var token: String? = null

    lateinit var toggle_fan: ToggleButton
    lateinit var toggle_auto_mode: ToggleButton
    lateinit var text_temperture: TextView
    lateinit var text_error: TextView


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_exhaust_fan)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        device = intent.getSerializableExtra("device") as IoTObject?
        token = intent.getSerializableExtra("token") as String?


        toggle_fan = findViewById(R.id.toggle_fan)
        toggle_auto_mode = findViewById(R.id.toggle_auto_mode)
        text_temperture = findViewById(R.id.text_temperture)
        text_error = findViewById(R.id.text_error)

        val handler = Handler(Looper.getMainLooper())
        val runnable = object : Runnable {
            override fun run() {
                handleGetTemp(device, token!!, text_temperture, text_error)
                handler.postDelayed(this, 1000L)
            }
        }
        handler.postDelayed(runnable, 500L)

        toggle_fan.setOnCheckedChangeListener(CompoundButton.OnCheckedChangeListener { buttonView, isChecked ->
            if (isChecked) {
                handleONOff(device, token!!, true, text_error)
            } else {
                handleONOff(device, token!!, false, text_error)
            }
        })

    }
}