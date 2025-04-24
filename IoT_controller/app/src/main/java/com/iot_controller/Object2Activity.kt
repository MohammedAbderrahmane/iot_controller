package com.iot_controller

import android.os.Bundle
import android.widget.Button
import android.widget.SeekBar
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.iot_controller.Model.IoTObject
import com.iot_controller.Services.handleGetSpeed
import com.iot_controller.Services.handleSetSpeed

class Object2Activity : AppCompatActivity() {

    var device: IoTObject? = null
    var token: String? = null
    var interval:Int = 1000

    lateinit var btn_send_interval: Button
    lateinit var btn_default_interval: Button
    lateinit var text_interval: TextView
    lateinit var text_error: TextView
    lateinit var seekbar_interval:SeekBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_object2)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        device = intent.getSerializableExtra("device") as IoTObject?
        token = intent.getSerializableExtra("token") as String?

        text_interval = findViewById(R.id.text_interval)
        text_error = findViewById(R.id.text_error)
        btn_send_interval = findViewById(R.id.btn_send_interval)
        btn_default_interval = findViewById(R.id.btn_default_interval)
        seekbar_interval = findViewById(R.id.seekbar_interval)

        handleGetSpeed(device!!,token!!,text_interval,text_error)

        seekbar_interval.setOnSeekBarChangeListener(
            object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                    text_interval.text = "interval: $progress ms"
                    interval = progress
                }

                override fun onStartTrackingTouch(seekBar: SeekBar?) {}

                override fun onStopTrackingTouch(seekBar: SeekBar?) {}
            }
        )

        btn_send_interval.setOnClickListener { handleSetSpeed(device,token!!,interval,text_error) }
        btn_default_interval.setOnClickListener { handleSetSpeed(device,token!!,1000,text_error) }
    }
}