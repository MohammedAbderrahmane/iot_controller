package com.iot_controller.RecycleViews.Compteur

import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity.MODE_PRIVATE
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.iot_controller.Model.Authority
import com.iot_controller.R
import com.iot_controller.Services.retrieveAuthority
import com.iot_controller.db.AuthEntry
import java.util.concurrent.Executors


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
        val authority_btn_logn: Button = itemView.findViewById(R.id.authority_btn_logn)
        val authority_text_status: TextView = itemView.findViewById(R.id.authority_text_status)


        fun bind(authority: Authority) {
            authority_text_name.text = authority.name
            authority_text_url.text =
                "http://${authority.ipAddress}:${authority.port}/api/users/generate_keys"

            for (entry in localLogins) {
                if (entry.authorityName == authority.name) {
                    authority_text_is_authenticated.visibility = View.VISIBLE
                    authority_text_is_authenticated.text =
                        authority_text_is_authenticated.text.toString()
                    authority_text_status.visibility = View.GONE
                    authority_btn_logn.visibility = View.GONE
                    val greenTint = ContextCompat.getColor(itemView.context, R.color.success)
                    itemView.setBackgroundColor(greenTint)
                    break
                }
            }

            authority_btn_logn.setOnClickListener { handleRetreive(authority.name) }


        }

        fun handleRetreive(authorityName: String) {
            val sharedPref = itemView.context.getSharedPreferences("IoTController", MODE_PRIVATE)
            val username = sharedPref.getString("username", "")

            val executor = Executors.newSingleThreadExecutor()
            val handler = Handler(Looper.getMainLooper())

            executor.execute {
                try {
                    retrieveAuthority(
                        username!!,
                        authority_text_url.text.toString(),
                        authorityName,
                        itemView.context
                    )
                    val chosenColor = ContextCompat.getColor(itemView.context, R.color.success)
                    authority_text_status.setTextColor(chosenColor)
                    handler.post { authority_text_status.text = "keys retreived successfully" }
                } catch (error: Exception) {
                    handler.post {
                        val chosenColor = ContextCompat.getColor(itemView.context, R.color.error)
                        authority_text_status.setTextColor(chosenColor)
                        authority_text_status.text = error.toString()
                    }
                }
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