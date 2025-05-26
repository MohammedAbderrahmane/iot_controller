package com.iot_controller

import android.content.SharedPreferences
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.iot_controller.Model.Authority
import com.iot_controller.RecycleViews.AuthorityAdapter
import com.iot_controller.RecycleViews.Credential
import com.iot_controller.Services.getAssociatedAuthorities
import com.iot_controller.Services.getAuthorities
import com.iot_controller.db.MaabeKey
import java.util.concurrent.Executors

class AuthoritiesActivity : AppCompatActivity() {
    private lateinit var sharedPref: SharedPreferences

    private var authorityList: ArrayList<Authority> = ArrayList()
    private var maabeKeysList: ArrayList<MaabeKey> = ArrayList<MaabeKey>()

    private lateinit var recycleview_authorities: RecyclerView
    private lateinit var text_authorities_status: TextView
    private lateinit var text_authorities_logged_in: TextView
    private lateinit var progressbar_authorities: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_authorities)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.activity_authorities)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        sharedPref = this.getSharedPreferences("IoTController", MODE_PRIVATE)

        recycleview_authorities = findViewById(R.id.a_recycleview_authorities)
        text_authorities_status = findViewById(R.id.a_text_authorities_status)
        text_authorities_logged_in = findViewById(R.id.a_text_authorities_logedin)
        progressbar_authorities = findViewById(R.id.a_progressbar_authorities)

        setupRecycleView();
    }


    private fun setupRecycleView() {
        val context = this

        val executor = Executors.newSingleThreadExecutor()
        val handler = Handler(Looper.getMainLooper())

        val fogNodeURI = sharedPref.getString("fogNodeURI", "") ?: "impossible outcome"


        executor.execute {

            try {
                authorityList = getAuthorities(fogNodeURI)

                maabeKeysList = getAssociatedAuthorities(context)
                text_authorities_logged_in.text =
                    "have keys of ${maabeKeysList.size}/${authorityList.size} authorities"

                if (authorityList.isEmpty()) {
                    handler.post {
                        text_authorities_status.visibility = View.VISIBLE
                        progressbar_authorities.visibility = View.GONE
                    }

                } else {
                    handler.post {
                        recycleview_authorities.layoutManager = LinearLayoutManager(context)
                        recycleview_authorities.adapter =
                            AuthorityAdapter(authorityList, maabeKeysList)

                        recycleview_authorities.visibility = View.VISIBLE
                        text_authorities_logged_in.visibility = View.VISIBLE
                        progressbar_authorities.visibility = View.GONE
                    }
                }

            } catch (error: Exception) {
                handler.post {
                    text_authorities_status.text = error.message
                    text_authorities_status.visibility = View.VISIBLE
                    progressbar_authorities.visibility = View.GONE

                    val chosenColor = resources.getColor(R.color.error, null)
                    text_authorities_status.setTextColor(chosenColor)
                }

            }
        }
    }

}