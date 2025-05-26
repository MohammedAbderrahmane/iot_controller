package com.iot_controller

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.iot_controller.db.MaabeKeyDbHelper
import java.net.InetAddress
import java.util.concurrent.Executors


class MainActivity : AppCompatActivity() {
    private lateinit var sharedPref: SharedPreferences


    lateinit var rootLayout: View
    lateinit var text_user: TextView
    lateinit var text_connected_status: TextView
    lateinit var text_fog_node: TextView
    lateinit var btn_main_to_authorities_page: View
    lateinit var btn_main_to_iots_page: View

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.activity_main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        val toolbar: Toolbar? = findViewById(R.id.main_toolbar)
        setSupportActionBar(toolbar)

        rootLayout = findViewById(R.id.activity_main)
        text_user = findViewById(R.id.text_user)
        text_connected_status = findViewById(R.id.a_main_connected_status)
        btn_main_to_authorities_page = findViewById(R.id.a_btn_main_to_authorities_page)
        btn_main_to_iots_page = findViewById(R.id.a_btn_main_to_iots_page)
        text_fog_node = findViewById(R.id.text_fog_node)

        sharedPref = this.getSharedPreferences("IoTController", MODE_PRIVATE)

        pingFogNode()

        val username = sharedPref.getString("username", "")
        if (username == null) {
            val intent = Intent(this, LoginActivity::class.java)
            startActivity(intent)
        }
        text_user.text = "Welcome ${username}"

        btn_main_to_authorities_page.setOnClickListener {
            val intent = Intent(
                this,
                AuthoritiesActivity::class.java
            )
            startActivity(intent)
        }
        btn_main_to_iots_page.setOnClickListener {
            val intent = Intent(
                this,
                IoTListActivity::class.java
            )
            startActivity(intent)
        }

    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        val id = item.itemId

        if (id == R.id.action_logout) {
            val editor = sharedPref.edit()  
            editor.clear()
            editor.apply()

            val dbHelper = MaabeKeyDbHelper(this)
            dbHelper.deleteAllAuthEntries()

            val intent = Intent(
                this,
                LoginActivity::class.java
            )
            startActivity(intent)
            finish()
            return true
        } else if (id == R.id.action_out) {
            finish()
            return true
        }

        return super.onOptionsItemSelected(item)
    }

    fun pingFogNode() {
        setConnectedStatus("connecting...", R.color.warning)
        val executor = Executors.newSingleThreadExecutor()

        val fogNodeURI = sharedPref.getString("fogNodeURI", "")
        val fogNodeHost = sharedPref.getString("fogNodeHost", "")
        if (fogNodeURI == null || fogNodeHost == null) {
            val intent = Intent(this, LoginActivity::class.java)
            startActivity(intent)
        }
        Handler(Looper.getMainLooper()).post{
            text_fog_node.text = "fog node uri = ${fogNodeURI}"
        }

        executor.execute {
            try {
                val address = InetAddress.getByName(fogNodeHost)
                address.isReachable(3000)
            } catch (e: Exception) {
                Log.e("ping-error" , e.message.toString()   )
                setConnectedStatus("Not connected", R.color.error)
                return@execute
            }
            setConnectedStatus("Connected", R.color.success)

        }
    }


    private fun setConnectedStatus(
        text: String,
        color: Int = R.color.black,
        durration: Long? = null,
    ) {
        Handler(Looper.getMainLooper()).post {
            if (color != null) {
                val chosenColor = resources.getColor(color, null)
                text_connected_status.setBackgroundColor(chosenColor)
            }
            text_connected_status.text = text
            if (durration != null) {
                Handler(Looper.getMainLooper()).postDelayed({
                    text_connected_status.text = ""
                }, durration)
            }
        }
    }

}