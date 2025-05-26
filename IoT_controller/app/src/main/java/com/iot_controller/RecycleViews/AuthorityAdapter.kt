package com.iot_controller.RecycleViews

import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity.MODE_PRIVATE
import androidx.recyclerview.widget.RecyclerView
import com.iot_controller.Model.Authority
import com.iot_controller.Model.getAttribListFromJson
import com.iot_controller.R
import com.iot_controller.Services.deleteAssociatedAuthority
import com.iot_controller.Services.retrieveAuthority
import com.iot_controller.db.MaabeKey
    import org.bouncycastle.crypto.generators.SCrypt
import org.json.JSONObject
import java.util.Base64
import java.util.concurrent.Executors

data class Credential(
    val username: String,
    val password: String,
    val authority: String
)


class AuthorityAdapter(
    private val authCredentialsList: List<Authority>,
    private val maabeKeys: ArrayList<MaabeKey>,
) :
    RecyclerView.Adapter<AuthorityAdapter.AuthorityViewHolder>() {

    inner class AuthorityViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val authority_text_name: TextView = itemView.findViewById(R.id.authority_text_name)
        val authority_text_url: TextView = itemView.findViewById(R.id.authority_text_url)
        val authority_text_status: TextView = itemView.findViewById(R.id.authority_text_status)

        val authority_text_is_authenticated: TextView =itemView.findViewById(R.id.authority_text_is_authenticated)
        val authority_btn_logn: Button = itemView.findViewById(R.id.authority_btn_logn)

        val authority_img_btn_clear: ImageButton =
            itemView.findViewById(R.id.authority_img_btn_clear)


        fun bind(authority: Authority) {
            authority_text_name.text = "Authority name: ${authority.name}"

            var maabeKey: MaabeKey? = null

            for (key in maabeKeys) {
                if (key.authorityName == authority.name) {
                    maabeKey = key
                    break
                }
            }

            if (maabeKey == null) {
                authority_btn_logn.setOnClickListener {
                    handleRetreive(
                        authority.name,
                        "${authority.url}/api/users/generate_keys"
                    )
                }
                authority_img_btn_clear.visibility = View.GONE
                authority_text_url.text = "url : ${authority.url}"
                return
            }
            val keys = getAttribListFromJson(maabeKey.keys)

            authority_text_is_authenticated.visibility = View.VISIBLE
            authority_img_btn_clear.visibility = View.VISIBLE
            authority_text_url.text = "url : ${authority.url}\nAttributes :"
            for (key in keys) {
                authority_text_url.text = (authority_text_url.text?.toString() ?: "") +
                        "\n\t" + key
            }
            authority_btn_logn.visibility = View.GONE

            authority_img_btn_clear.setOnClickListener {
                handleClean(maabeKey)
            }

        }

        fun handleRetreive(authorityName: String, authUrl: String) {
            val sharedPref = itemView.context.getSharedPreferences("IoTController", MODE_PRIVATE)
            val username = sharedPref.getString("username", "")
            val password = sharedPref.getString("password", "")

            val N = 16384;
            val r = 8
            val p = 1
            val keylen = 64
Log.e("----",password!!)
            val derivedPasswordBytes = SCrypt.generate(
                password!!.encodeToByteArray(),
                authorityName.trim().encodeToByteArray(),
                N, r, p, keylen
            )
            val derivedPassword = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Base64.getEncoder().encodeToString(derivedPasswordBytes)
            } else {
                "impossible"
            }
            Log.e("----",authorityName)
            Log.e("----",derivedPassword!!)

            val executor = Executors.newSingleThreadExecutor()
            val handler = Handler(Looper.getMainLooper())

            executor.execute {
                try {
                    val userJson = JSONObject()
                    userJson.put("username", username)
                    userJson.put("password", derivedPassword)

                    val newEntry = retrieveAuthority(
                        userJson,
                        authUrl,
                        authorityName,
                        itemView.context
                    )
                    maabeKeys.add(newEntry)
                    setStatus("keys retreived", R.color.success)
                    handler.postDelayed({
                        notifyItemChanged(adapterPosition)
                    }, 1000)
                } catch (error: Exception) {
                    setStatus(error.message!!, R.color.error)
                }
            }
        }

        fun handleClean(entry: MaabeKey) {
            val executor = Executors.newSingleThreadExecutor()
            val handler = Handler(Looper.getMainLooper())

            executor.execute {
                try {
                    val result = deleteAssociatedAuthority(itemView.context, entry.authorityName)
                    if (!result) throw Exception("Couldn't delete the keys")
                    maabeKeys.remove(entry)
                    setStatus("keys removed successfully", R.color.success)
                    handler.postDelayed({
                        notifyItemChanged(adapterPosition)
                    }, 1000)
                } catch (error: Exception) {
                    setStatus("Couldn't delete the keys", R.color.error)
                }
            }
        }

        private fun setStatus(text: String, color: Int = R.color.black, durration: Long? = null) {
            Handler(Looper.getMainLooper()).post {
                if (color != null) {
                    val chosenColor = itemView.context.resources.getColor(color, null)
                    authority_text_status.setTextColor(chosenColor)
                }
                authority_text_status.text = text
                if (durration != null) {
                    Handler(Looper.getMainLooper()).postDelayed({
                        authority_text_status.text = ""
                    }, durration)
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