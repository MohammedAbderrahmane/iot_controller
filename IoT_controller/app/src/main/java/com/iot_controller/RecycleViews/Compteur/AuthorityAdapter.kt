package com.iot_controller.RecycleViews.Compteur

import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.iot_controller.Model.Authority
import com.iot_controller.R
import com.iot_controller.Services.loginToAuthority
import com.iot_controller.db.AuthEntry
import com.iot_controller.db.AuthorityDbHelper
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Response
import org.json.JSONObject
import java.io.IOException


class AuthorityAdapter(
    private val authCredentialsList: List<Authority>,
    private val localLogins: ArrayList<AuthEntry>,
) :
    RecyclerView.Adapter<AuthorityAdapter.AuthorityViewHolder>() {

    // ViewHolder inner class
    inner class AuthorityViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val authority_text_name: TextView = itemView.findViewById(R.id.authority_text_name)
        val authority_text_is_authenticated: TextView =
            itemView.findViewById(R.id.authority_text_is_authenticated)
        val authority_text_url: TextView = itemView.findViewById(R.id.authority_text_url)
        val authority_input_username: EditText =
            itemView.findViewById(R.id.authority_input_username)
        val authority_input_password: EditText =
            itemView.findViewById(R.id.authority_input_password)
        val authority_btn_logn: Button = itemView.findViewById(R.id.authority_btn_logn)
        val authority_text_status: TextView = itemView.findViewById(R.id.authority_text_status)


        fun bind(authority: Authority) {
            authority_text_name.text = authority.name
            authority_text_url.text =
                "http://${authority.ipAddress}:${authority.port}/api/user/generate_keys"

            for (entry in localLogins) {
                Log.e("eee", entry.authorityName)
                if (entry.authorityName == authority.name) {
                    authority_text_is_authenticated.visibility = View.VISIBLE
                    authority_input_username.visibility = View.GONE
                    authority_input_password.visibility = View.GONE
                    authority_text_status.visibility = View.GONE
                    authority_btn_logn.visibility = View.GONE
                    break
                }
            }

            authority_btn_logn.setOnClickListener {
                handleLogin(authority)
            }


        }

        fun handleLogin(authority: Authority) {
            try {
                loginToAuthority(
                    authority_input_username.text.toString(),
                    authority_input_password.text.toString(),
                    authority_text_url.text.toString()
                ).enqueue(object : Callback {
                    override fun onFailure(call: Call, e: IOException) {
                        itemView.post {
                            authority_text_status.text = e.message
                        }
                    }

                    override fun onResponse(call: Call, response: Response) {
                        val responsePayload = response.body?.string()
                        try {
                            if (response.isSuccessful) {
                                val dbHelper = AuthorityDbHelper(itemView.context)
                                dbHelper.insertAuthEntry(authority.name, responsePayload!!)
                                itemView.post {
                                    authority_text_status.text = "connected successfully"
                                }
                                return
                            }
                            val jsonResponse = JSONObject(responsePayload!!)
                            val errorMessage = jsonResponse.getString("message")
                            itemView.post {
                                authority_text_status.text =
                                    "${response.message}  : ${errorMessage}"
                            }
                        } catch (error: Exception) {
                            itemView.post {
                                authority_text_status.text = error.message
                            }
                        }


                    }
                }
                )
            } catch (error: Exception) {
                authority_text_status.text = error.message
            }
        }
    }

    // Called when the RecyclerView needs a new ViewHolder
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AuthorityViewHolder {
        val itemView = LayoutInflater.from(parent.context)
            .inflate(R.layout.authority_layout, parent, false)
        return AuthorityViewHolder(itemView)
    }

    // Called to display the data at the specified position
    override fun onBindViewHolder(holder: AuthorityViewHolder, position: Int) {
        val credential = authCredentialsList[position]
        holder.bind(credential)
    }

    // Returns the total number of items in the data set
    override fun getItemCount(): Int {
        return authCredentialsList.size
    }
}