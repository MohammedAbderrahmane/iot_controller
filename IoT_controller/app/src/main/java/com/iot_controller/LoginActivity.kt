package com.iot_controller

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class LoginActivity : AppCompatActivity() {

    private lateinit var text_IotController: TextView
    private lateinit var text_login: TextView
    private lateinit var text_rememberMe: TextView
    private lateinit var text_status: TextView
    private lateinit var input_username: EditText
    private lateinit var input_password: EditText
    private lateinit var input_rememberMe: CheckBox
    private lateinit var btn_login: Button

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

        text_login = findViewById(R.id.text_login)
        text_IotController = findViewById(R.id.text_IotController)
        text_rememberMe = findViewById(R.id.text_rememberMe)
        text_status = findViewById(R.id.text_status)

        input_password = findViewById(R.id.input_password)
        input_username = findViewById(R.id.input_username)
        input_rememberMe = findViewById(R.id.input_rememberMe)

        btn_login = findViewById(R.id.btn_login)
    }

    fun handleLogin(view: View) {
        /*
        try {


            val username: String = input_username.text.toString()
            val password: String = input_password.text.toString()
            val rememberMe: Boolean = input_rememberMe.isChecked

            if (username.isBlank() || password.isBlank()) {
                setStatus("username/password is blank", R.color.error)
                return
            }

            setStatus("logging...")

            @Serializable
            data class UserObject(
                val username: String,
                val password: String,
                val rememberMe: Boolean,
            )

            @Serializable
            data class ErrorObject(val code: Int, val message: String)


            val user: String = Json.encodeToString(UserObject(username, password, rememberMe))

            login(user).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    setStatus(e.message.toString(), R.color.error, 15000)
                }

                override fun onResponse(call: Call, response: Response) {
                    if (response.isSuccessful) {

                        val responseBody = response.body?.string()
                        println("Response: $responseBody")
                        setStatus("logged in successfully", R.color.success, 3000)

                        return
                    }

                    val error: ErrorObject = ErrorObject(response.code, response.message)
                    setStatus(
                        "Failed : ${error.code} : ${error.message}",
                        R.color.error,
                        3000
                    )

                }

            })

        } catch (error: Exception) {
            Log.e("ERROR", error.toString())
            Toast.makeText(this@MainActivity, error.toString(), Toast.LENGTH_LONG).show()
        }
*/
        val intent = Intent(this, TokenActivity::class.java)
        startActivity(intent)
    }


}