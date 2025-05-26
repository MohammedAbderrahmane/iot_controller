package com.iot_controller.components

import android.app.AlertDialog
import android.content.Context
import android.view.LayoutInflater
import android.widget.TextView
import com.iot_controller.R

fun showLoadingDialog(context: Context,message:String = "Please wait..."): AlertDialog {
    val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_loading, null)
    dialogView.findViewById<TextView>(R.id.dialog_loading).text = message

    val progressDialog = AlertDialog.Builder(context)
        .setView(dialogView)
        .setCancelable(false)
        .create()
    progressDialog.show()
    return progressDialog
}
