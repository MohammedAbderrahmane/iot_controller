//package com.iot_controller.RecyclerViews.Compteur
//
//import android.view.LayoutInflater
//import android.view.View
//import android.view.ViewGroup
//import androidx.recyclerview.widget.RecyclerView
//import com.iot_controller.R
//import java.util.Date
//
//data class Compteur(
//    val id: Int,
//    val curent_index: Long,
//    val numero: String,
//    val past_index: Long,
//    val revealDate: Date,
//    val address: String,
//    val owner: String,
//)
//
//
//class CompteurAdapter(private val compteurList: List<Compteur>) :
//    RecyclerView.Adapter<CompteurAdapter.CompteurViewHolder>() {
//
//    class CompteurViewHolder(compteurView: View) : RecyclerView.ViewHolder(compteurView) {
//        val compteurView: View = compteurView.findViewById(R.id.textView)
//    }
//
//    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CompteurViewHolder {
//        val view =
//            LayoutInflater.from(parent.context).inflate(R.layout.login, parent, false)
//        return
//    }
//
//    override fun onBindViewHolder(holder: CompteurViewHolder, position: Int) {
//
//    }
//
//    override fun getItemCount(): Int {
//        return compteurList.size
//    }
//}
//
//
//
//
