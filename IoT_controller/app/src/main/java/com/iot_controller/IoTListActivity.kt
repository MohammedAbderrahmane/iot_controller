package com.iot_controller

import android.content.SharedPreferences
import com.iot_controller.RecycleViews.IoTAdapter
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.ProgressBar
import android.widget.Spinner
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.iot_controller.Model.FogNode
import com.iot_controller.Model.IoTObject
import getIotObjects
import java.util.concurrent.Executors

class IoTListActivity : AppCompatActivity() {
    private lateinit var sharedPref: SharedPreferences

    var iotObjectsList: ArrayList<IoTObject> = ArrayList()


    private lateinit var recycleview_iots: RecyclerView
    private lateinit var text_iots_status: TextView
    private lateinit var progressbar_iots: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_iot_list)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.activity_iots)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        sharedPref = this.getSharedPreferences("IoTController", MODE_PRIVATE)


        progressbar_iots = findViewById(R.id.a_progressbar_iots)
        text_iots_status = findViewById(R.id.a_text_iots_status)
        recycleview_iots = findViewById(R.id.a_recycleview_iots)

        retreiveFogNodesAndObjects()

    }

    private fun retreiveFogNodesAndObjects() {
        val executor = Executors.newSingleThreadExecutor()
        val handler = Handler(Looper.getMainLooper())

        executor.execute {

            try {
                val fogNodeURI = sharedPref.getString("fogNodeURI", "") ?: "impossible outcome"
                iotObjectsList = getIotObjects(fogNodeURI)

                if (iotObjectsList.isEmpty()) {
                    handler.post {
                        text_iots_status.visibility = View.VISIBLE
                        text_iots_status.text = "There are no iot objects available"
                        recycleview_iots.visibility = View.GONE
                        progressbar_iots.visibility = View.GONE
                    }
                } else {
                    handler.post {
                        text_iots_status.visibility = View.GONE
                        progressbar_iots.visibility = View.GONE
                        setupRecycleView()
                    }

                }

            } catch (error: Exception) {
                Log.e("ee", error.toString())
                handler.post {
                    text_iots_status.visibility = View.VISIBLE
                    recycleview_iots.visibility = View.GONE
                    progressbar_iots.visibility = View.GONE

                    text_iots_status.text = error.toString()
                    val chosenColor = resources.getColor(R.color.error, null)
                    text_iots_status.setTextColor(chosenColor)
                }

            }
        }
    }

    private fun setupRecycleView() {
        val context = this

        recycleview_iots.layoutManager = LinearLayoutManager(context)
        recycleview_iots.adapter = IoTAdapter(iotObjectsList)

        recycleview_iots.visibility = View.VISIBLE
        text_iots_status.visibility = View.GONE
    }

}