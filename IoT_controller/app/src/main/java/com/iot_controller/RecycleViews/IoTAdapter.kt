import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.iot_controller.Model.IoTObject
import com.iot_controller.R


class IoTAdapter(
    private val iotList: List<IoTObject>,
) : RecyclerView.Adapter<IoTAdapter.IoTViewHolder>() {

    class IoTViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val text_object_name: TextView = itemView.findViewById(R.id.text_object_name)
        val text_object_ip_port: TextView = itemView.findViewById(R.id.text_object_ip_port)
        val text_object_description: TextView = itemView.findViewById(R.id.text_object_description)
        val btn_object_action: Button = itemView.findViewById(R.id.btn_object_action)
        val status_object_online: View = itemView.findViewById(R.id.status_object_online)
        val text_object_status: TextView = itemView.findViewById(R.id.text_object_status)


    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): IoTViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.iot_layout, parent, false)
        return IoTViewHolder(view)
    }

    override fun onBindViewHolder(holder: IoTViewHolder, position: Int) {
        val device = iotList[position]
        holder.text_object_name.text = device.name
        holder.text_object_ip_port.text = (if (device.ipAddress!=null) "coap://${device.ipAddress}:${device.port}/" else "not yet connected")
        holder.text_object_description.text = device.description
        val statusColor = Color.parseColor("#F44336")
        holder.status_object_online.background.setTint(statusColor)

        if (device.encryptedToken==null){
            holder.btn_object_action.visibility = View.GONE
            holder.text_object_status.visibility = View.VISIBLE
            holder.text_object_status.text = "object not connected\nto the netwrok"
                return
        }
        val token = getToken(device, holder)
        holder.btn_object_action.setOnClickListener {
            goToObjectActivity(
                device,
                token!!,
                holder.itemView.context
            )
        }
    }

    override fun getItemCount(): Int = iotList.size

    fun getToken(device: IoTObject, holder: IoTViewHolder): String? {
        var token = decryptToken(holder.itemView.context, device.encryptedToken!!)

        if (token != null) {
            val statusColor = Color.parseColor("#4CAF50")
            holder.status_object_online.background.setTint(statusColor)
            return token
        }

        holder.btn_object_action.visibility = View.GONE
        holder.text_object_status.visibility = View.VISIBLE
        holder.text_object_status.text = "you have \nno access"
        return token;
    }
}
