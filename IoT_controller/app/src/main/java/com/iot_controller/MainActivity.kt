package com.iot_controller

import IoTAdapter
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.snackbar.Snackbar
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonParser
import com.google.gson.reflect.TypeToken
import com.iot_controller.Model.Authority
import com.iot_controller.Model.IoTObject
import com.iot_controller.RecycleViews.Compteur.AuthorityAdapter
import com.iot_controller.Services.getAuthorities
import com.iot_controller.Services.getLogedInAuthorities
import com.iot_controller.db.AuthEntry
import com.iot_controller.db.AuthorityDbHelper
import org.eclipse.californium.core.CoapClient
import org.eclipse.californium.core.coap.CoAP
import org.eclipse.californium.core.coap.Request

class MainActivity : AppCompatActivity() {

    var iotList: ArrayList<IoTObject> = ArrayList()
    var authorityList: ArrayList<Authority> = ArrayList()
    var localLogins: ArrayList<AuthEntry> = ArrayList<AuthEntry>()

    lateinit var rootLayout: View
    lateinit var recycleview_iot: RecyclerView
    lateinit var recycleview_authorities: RecyclerView
    lateinit var text_main_iot_not_found: TextView
    lateinit var text_main_authorities_not_found: TextView
    lateinit var text_main_logedin_auths: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.activity_main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        rootLayout = findViewById(R.id.activity_main)
        recycleview_iot = findViewById(R.id.recycleview_iot)
        recycleview_authorities = findViewById(R.id.recycleview_authorities)
        text_main_iot_not_found = findViewById(R.id.text_main_iot_not_found)
        text_main_authorities_not_found = findViewById(R.id.text_main_authorities_not_found)
        text_main_logedin_auths = findViewById(R.id.text_main_logedin_auths)

        getIotObjects();
        fillAuthorities();


        if (iotList.isEmpty()) {
            text_main_iot_not_found.visibility = View.VISIBLE
            recycleview_iot.visibility = View.GONE
        } else {
            text_main_iot_not_found.visibility = View.GONE
            recycleview_iot.visibility = View.VISIBLE

            recycleview_iot.layoutManager = LinearLayoutManager(this)
            recycleview_iot.adapter = IoTAdapter(iotList)
        }



    }

    fun fillAuthorities (){
        Log.e("zzz","-------------------------")
        try {
            authorityList = getAuthorities()

            Log.e("zzz",authorityList.size.toString())
//            Log.e("zzz",authorityList.ame)

            localLogins = getLogedInAuthorities(this)
            text_main_logedin_auths.text = "You are loged to ${localLogins.size} authority"


            if (authorityList.isEmpty()) {
                text_main_authorities_not_found.visibility = View.VISIBLE
                recycleview_authorities.visibility = View.GONE
            } else {
                text_main_authorities_not_found.visibility = View.GONE
                recycleview_authorities.visibility = View.VISIBLE

                recycleview_authorities.layoutManager = LinearLayoutManager(this)
                recycleview_authorities.adapter = AuthorityAdapter(authorityList, localLogins)
            }

        } catch (error: Exception) {
            text_main_authorities_not_found.text = error.message
        }
    }

    private fun getIotObjects() {
        try {

            var ioTObjectsJson: String
            var coapClient = CoapClient("coap://192.168.1.100:5683/objects/all")
            coapClient.setTimeout(5000)

            val request = Request(CoAP.Code.GET)

            val response = coapClient.advanced(request)
            if (response != null && response.isSuccess) {
                ioTObjectsJson = response.payload.decodeToString()
            } else return
            coapClient.shutdown()


            val gson = GsonBuilder()
                .registerTypeAdapter(IoTObject::class.java, IoTObject.IoTObjectDeserializer())
                .create()

            val jsonArray = JsonParser.parseString(ioTObjectsJson).asJsonArray
            iotList =
                jsonArray.map { gson.fromJson(it, IoTObject::class.java) } as ArrayList<IoTObject>

            Snackbar.make(rootLayout, "objects loaded : ${iotList.size}", Snackbar.LENGTH_SHORT)
                .show()
        } catch (exception: Exception) {
            Log.e("zzz",exception.message.toString())
            Snackbar.make(
                rootLayout,
                "Failed to get List : ${exception.message}",
                Snackbar.LENGTH_SHORT
            ).show()
        }
    }
}