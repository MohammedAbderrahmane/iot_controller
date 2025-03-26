package com.iot_controller

import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.CheckBox
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import maabe_tools.Maabe_tools
import org.eclipse.californium.core.CoapClient
import org.eclipse.californium.core.CoapResponse
import org.eclipse.californium.core.coap.CoAP
import org.eclipse.californium.core.coap.MediaTypeRegistry
import org.eclipse.californium.core.coap.Option
import org.eclipse.californium.core.coap.Request
import org.eclipse.californium.oscore.HashMapCtxDB
import org.eclipse.californium.oscore.OSCoreCoapStackFactory
import org.eclipse.californium.oscore.OSCoreCtx

class TokenActivity : AppCompatActivity() {

    private var cypheredToken: String? = null
    private var token: String? = null


    lateinit var btn_token: Button
    lateinit var btn_iot: Button
    lateinit var text_token: TextView
    lateinit var text_result: TextView
    lateinit var checkbox_oscore: CheckBox


    lateinit var coapClient: CoapClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_token)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        btn_token = findViewById(R.id.btn_token)
        btn_iot = findViewById(R.id.btn_iot)
        text_token = findViewById(R.id.text_token)
        text_result = findViewById(R.id.text_iot_result)
        checkbox_oscore = findViewById(R.id.checkbox_oscore)

        btn_token.setOnClickListener { handleGetToken() }
        btn_iot.setOnClickListener { handleGetRessource() }
    }

    fun handleGetToken() {
        if (checkbox_oscore.isChecked) {
            val masterSecret: ByteArray = "0000".toByteArray(Charsets.US_ASCII)
            val clientId: ByteArray = "client".toByteArray(Charsets.US_ASCII)
            val serverId: ByteArray = "fog".toByteArray(Charsets.US_ASCII)

            val context: OSCoreCtx = OSCoreCtx(
                masterSecret,
                true,
                null,
                clientId,
                serverId,
                null,
                32,
                null,
                null,
                1024
            )
            val db: HashMapCtxDB = HashMapCtxDB()
            db.addContext(context)
            OSCoreCoapStackFactory.useAsDefault(db)
        }
        text_token.text = "sending request ..."

        val body = "1"

        coapClient = CoapClient("coap://192.168.1.100:5684/o")
        coapClient.setTimeout(5000)

        val request = Request(CoAP.Code.POST)
        request.options.contentFormat = MediaTypeRegistry.TEXT_PLAIN
        request.payload = body.toByteArray()
        if (checkbox_oscore.isChecked)
            request.options.setOscore(byteArrayOf(0))


        val response: CoapResponse? = coapClient.advanced(request)
        runOnUiThread {
            if (response != null && response.isSuccess) {
                cypheredToken = response.payload.decodeToString()

            } else text_token.text = "${response?.code} ${response?.responseText}"
        }
        coapClient.shutdown()


        val cyphertext =
            "{\"C0\":\"YZjkJpb0cpjxgYCxbySQXnYUC9zvv9sZ8o+9QThPJp05Yh3uOMQzKTdzbKZplw+2S6gK7fJLeYbNIsZEe3yCNE0LCqwoPV5nT6LJkVkoljfjB9Osa/rd02WWdKWL0EgfITqgAL+O4sCfqUhZQW3MOdUGEUtDgLFROFL+d3smntEKcgWXXY+LhHCiqCI9xyCmART3kVQo4zx5WopOxreUAxm2vaXLAMMyLY03g+22i5Z3rIZlNKT4dJ7jLjJRyzgpfQqtXce7Z8RB5zcf2uBC+V0Qj47YTCOjob1YTWaiiU5Pu6uC8yHSnlWfUNnrOyfLwaF568AKdKsGzRUS5OTHMXJGzM8X4975yT1NOLeUnRk9TY6IFmGRAm4xiP4XzoWWXSQMNNSV+BhGY78KkmWvfHgxt1WWsmQN62xo1LqGAu6JBe1GH7OL9Yezh0suqtZEbqNQHq8yqwbdoh4VzQJj71Gtx7cpciqT4JrORVP4sUePK1QDaYZely4MBVdgXKI7\",\"C1x\":{\"alger:prof\":\"FZkKqO+a3Odje6dOqWu4xxWJ66prYkQnKQ9euRi8+qcaFxevM2bx/g8CunjVqxuQwG54E2z7Dk3FkyPRVa+zd2Cz3H5SjNqpQXam90FcsPxKNdZdflH+Sb8UP5FyNmtCYDxxncqf4Ua705P1V9brlaEvazayMg0/XnYYWDbv9pJIpT4NpB5hJMlYnDP0Hg7RoxnrcrTLbHhghgukWDFdXDKab9atUp1zdrA1DK4IFzVe+WknSnXCli3+mVkgOzSGEynZuI4Ty0rRq79xXvFdua9GbdI75orkZDWF6gT58zdGCziSIktobfDIRAtU/+livR2u4TnymiRWgrf3rGmmn4Ed/gZ3/f7jq5HEcOGxmfkphyb9YDhcizQJ8A7s2gDhQB0DMRcZMSiUt6a2UXXY6VANO50r0ucQ/MnU3H7pymNhm2p4DOx0k36kqhP3pjbx8hdYr1W1bJUoF0SJslhbTXZQNtDz2Wf5erfzK0s83DCbcEqAxEZUx/pYzbFuRjQz\",\"oran:assistant\":\"YKoFLjq0sEi/aGC+l/ar1lLlnvenaFiZnRDNPbOLDUp36mMSAUI0tYROvIgT9zhyCRbiWWdJVf1E7b4/5BdJ0WVgJr+U63VpTXKBufDLimlLMTOkliVYnWyZMptKCIHyeQ0Ys/Q1HomPmHrLSCXtEr6LdRVDyQT5EIm3HEol3IJoCyPQdOnhQvxLwsTQAJVTJ045h/sjnnkmF9adUIaYhVpupE/LM023l0lzZma1qMqW67/WOZZjWTxVAsuy5aF4AG3EUxgfvm18EEMvJt/NZw0AyBepjOjy6MxCs14PdgWCyzm9gUAYuKPHWND+VbXU2b1NjqMgEiT2DYgo1qycuIiNo8WLvX78RNPrdxGYyaVi2nBMelSoW19+tihZ4ku3TfxpF0zE5EiLAskopjEmQysp6EzkJcD9tk78m6gQ+3hwaJjJhAEgQYDCwO/FmZywsF+UGvwV263dGlSabuRFCiwVhA+D21y3l/bYo1HRY8GQSoJztonjxBXs3QumYeP2\",\"oran:prof\":\"fdu1ELoKmGvCrhAHZTsYkg231XXeQWFVTO1BW9IxSdc5EBeR0NgCv/aa2fuDsM1gaCNHEOv2ybH6NLQhrvIXj4MtvA/Ya5AANLByCwdocKp+tA3aLpO3C29+NWBf4UcAe+es3yvwXAjEYwg0KVylEMbcE9g9neiC8TAkAwxIc+to8mXO3aZ0an0HLsLeJfQRPb/IGsVvdua9F2gQEWE4bhqAGNR64Bu5ChKJzvn0SfDdcnczcVmOTxPGYFXfIbwlC/ub2qU9kx1zAlN7kf3Z/NyiYMFJI9EANvV2IPbQjF0lpy0klBW9iq8JqwayEpMIMD1H65vYIY7v4DIE631q3j/PiGjscPFTpoQhDDqLWMFMK+Sh4piZIjvdghiQSU5PZwo57oJsshgPi/iiCrivotthpf+G9ZvFDoDdmMe86LYkrIn+8Wv2UuHP5xm9jLAdEjtIP2n1xFsexbCUU/zmAXh6Xfc7bpt4aAQcsHc4DHZm9mXmqee4jbQ0GujZL293\",\"tlemcen:encadrant\":\"cYjWvARP8Pcrl92enNWp3mIOZwewGxtY2RlTwpPxJRthj8mXBwiP+Dpn/CjGRTaN93BBcqSu29cjEEKc3nNj9hFuHGpmlApGmfVvam6mTKx976zD7mrp98wJobKI784kd2pRoiM83ewJ0OwStbQW5Bvte65CIjWFwsgL+av0FaaIbRoNLVZ2pN+0RRCEN1mt6jS4ZXnD0oYbZS/fNwCsrhHzXsMaI+NS92gsI2Xc/ceWfu97H8GMNdkFogDOK0TzeYzEXYs567JE2eXLhNG3Sb8cStpC6KjfyTO9XhJuWdhNqT2ASANM6zZqb1fSIq5rxVxja4++Kto9NApMHPgykxyLmkEUCVFEDeo4v15USflckvaeUoBttRb+epzpVj+DfW4WPUqzw9VnA8d3d96iyQLnRZRmos1MGmOAbruoDco4ps0akI/2qJwKAfrmyJcnpgiL0zHXZeh082O9CrU3yjUIlkXmk9kc0QsCVC+sf3e4J18R2KkJwmeCnYYpYLCj\",\"tlemcen:etudiant\":\"XJ7X00gyeM6sQucd6FtlReyjumepe1vy2ZDtMOwgaDpSp5ameQksTsUpaqE4kMnadRWlUUqcxfAFzyVZlN70uxeNVLVpSOY6dhBY+7QE2km1bpOsAM+FI9PziLKR3353LgUTQfS+Yh/m69WmosYQYAx36AEyBsdxqiV4VqZUucAZflCyZ8aIBEBSKfIK9qS0gVya5ye9RExMiUvm3VyO31Cqzl4P+oCQ9r8ptcsaYD1zFxvVrjpRcIp5FJgnGCTzITEUW9KUKfGLEk9O56Mto92qdnjBJJfFKlDXdYhodD56ajP59WT0gaXNoVdYYEj+E3m6KFwmQIlSym3FVS+Zc3kijIr0NOpveNlcjNBFx/Rnz1Pwfw18XGKvZ0wObzL6Bh5o0c+JExCuE2M7j5al8Ntp8NgoTHNgdpETGx94ctGEJBxlgbd3atURNe9WjnKZ1hW5GDRna73CSSBV4FRhooUkeJea1QwyKHFfw6YQYGqZ/zkDv3NBwwFU7FjEiiM8\"},\"C2x\":{\"alger:prof\":\"AY+pD0qSAalnUVftLlE9Z5V9acbiS6ae21gAMpicaTuEjAWGpy895BBWgQMCBTMYl3kuEvGDsmPpInBrnmnPTfMD6MovTTwx2E9em3S3AMBGQLOZwuq7AnImhpaW3d9Z6YnTanUJE7ApkxYu/FgD12qYPVHrRwR/m29wp2dtrRsC\",\"oran:assistant\":\"AQlm7WxIoCGYkoKRl9w5ZMaFL6a3qzAwfY3eu7/JaUPuEOJySTh1jfqatELMISj7+aUaSfkLVgopLd4CT3ibW3ptHrkpMehHS3TP+C9gs7j5+n3a+rkK8W7DX1qHkrB6PVCb1NAGoAuBhKwpHDAJaNERojQZ5MP5RBc7PvpnJAeQ\",\"oran:prof\":\"AWXoTIFP5vfkBKtmF4jrBaUzdGVzeHBIKE24zPIrffM0Tx4vJt7EQ6KDGadiHtI+Hsx91N2IxlNVbGqgmJOXe0gFmAwVUT8ErB56HQs6CW9IS++ZXCR+5Vr9izVCi0W5IRqZ7IOl0dKWTSeCK+eUcEN8emddXNZgotJ78cx9qK/W\",\"tlemcen:encadrant\":\"AW119GnuRcjYWWcGI0mn4yEGWH4qLMJLD4WxVXddi4k8gPrLJ/XtX0QuXLi+lL+sPvAGIDv0FFLhh8gHV5LmXTEupJ89UpjwREvavKNIOK8JGLA7v3FO8BXa+AUd56X10WECn3FV2maiyCBfdSO4caseywlJRvVjsnly5RBNu13d\",\"tlemcen:etudiant\":\"AVTDqAzJn8oSXTJqKzc3QlW60l10q/CGCJyZ/jJ5cOz5WCrusxBgI5z3B2+mfS3eQyo7RNUy7H4Iop20aQG3jiCBJelhnZJe2kxgr9qz9/nlzlYpxn3B2/F2uIeD3rU4AzFktOy2mXRM8FicRfgP5MOjnPfo7cyznP5om7zzQe+Y\"},\"C3x\":{\"alger:prof\":\"AQvASK0OQT6rXThpYgo34eYG3H63zUjMLpolx3CAllhHSNMQyxA5bgPhtmyphE50Ck2V/U7uusMtZapQ8vBgG/8mpBeO3QggQDA1WwLOWFoUhht4T2GEUwOBb6he14oWYXwU7UoLn+RaHSijPFiZg5vUPlRVMhuYpl+NwG9jr+KJ\",\"oran:assistant\":\"AXC+lHpM2FAq2gjUr4+HrHoENd4zbQWTsHFUf7rMisB+Arn/i7MHpSXs3EM8MzHxvVXHUllbPxEj85U1Bx5GHsV5sgpBwTF2wCjyoqYRc69UM9RiOohhKWGHTZpaTA4p0TluwKR/CM6Ee5/p40iP9qGyBWe+iZvl+wGexF4fxhxV\",\"oran:prof\":\"AStmqc3pPKTmquDBQLCAtfICNMvytJdx4LVy8xLAaABbFznuM7bMIZDqjy6sw+/sCJYtRVOJt0rccBI67sW9MEIYupakx/ggiO/D3hfKF37uz5XioWYO62Kq81InKGWq6oOskOWii+P38meJ2sdN57hqNFnXtbg7cWOOQ67A07/6\",\"tlemcen:encadrant\":\"ATnIsmEArVcPX5gCqNOiku2ZxFBLbWPJt6V77cZvbMFBFCfTxoRvsEEwO9mSOJojMlkFrrMlse1I1LgbbTtIuZdXkUOPTc/IVlB8wdQ0rAJO7RKyDn11nrfQDPagLlvmKAXDZoEsWnMlIFtxRsMj7C4M8JYKz5hqrsloOMGZ9ePo\",\"tlemcen:etudiant\":\"AXtDGXDQ8vcbX3Bl12h1xPAzs5MsYvx7nAOpbviKU24DR1zytX7zDQylP65bNCRjljnSiDR/OQniWrsvCgN000FdDOmQ04wqBN8OS322YaFlhQ0293n9kQsa3ozImi6Joy+47H92XLSZjcR1XMvCJJEIq1H0/kmusiUD5LvcqaO3\"},\"Msp\":{\"P\":null,\"Mat\":[[0,-1,0],[1,1,0],[0,0,-1],[1,0,1],[1,0,0]],\"RowToAttrib\":[\"tlemcen:encadrant\",\"oran:prof\",\"tlemcen:etudiant\",\"oran:assistant\",\"alger:prof\"]},\"SymEnc\":\"9hVLkAX63/Z8FpGrgdRinw==\",\"Iv\":\"JWa2oi3/8U7cuCz9YbWYhg==\"}"
        val maabePublicParameters: String =
            "{\"P\":\"j7UB40qjh/mqb+y4YYTcIS6NjhL4KzkkGi70W1escmE=\",\"G1\":\"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGPtQHjSqOH+apv7LhhhNwh7luI0SC1tZ4YXKxsXgiWZQ==\",\"G2\":\"AS7MpEb/bz1NA8dum1x1Lyi8N7NkywWsSjfrMuHDJFlwjyU4b3LJRiuBWX1lriCSxLl3khVdzarTK4pt1BeSU0wtsQ71IzsP45Yrnuaku8K1veAaVPNRPULfly4SjzG/EidOV0foyvrMNxbMhpnbebIvDk/zwj6Jj2lEIKO+MIel\",\"Gt\":\"Ltzr5bSo0lY4xO2nLlF1Rzn9KFMQLxvUc6hNVzn4upJf5qyNFlXGOcQCYmAJmVyDKYxJXXvm6KXlMg9CFjc6iA5p/LgYJAIx764tNRH9fkDZNCXqmm+/Xq2Hz6zP+RJybLPHTV7aQrGgMjrRNHdsPkyTLJFbHiBzIYR4cy/ej54uHdzewL+zYYEMO/eFX4zED291gqduyoo6y+Vw/7h0h3h25PCNm3+6wgUZ1zx9bWyZX0mxGVoleaiOC0shgIplVvU6o4SqXvHP2pcoS82BnNumDvbdWFpgV0yw5z5A/IZ1Yia6uuz9clABpO7FWUSKEHTaOKuJxykMAYgcoBlC60PyTA6892h9NU0v/SepFOd7pZ06nj+a++OZEhTke6W7Hfsl5+pCFK9WAbCnmJFt/M+YkFpkQi3xAhapOs9izz1+MlwBVaMZ2Km36Ctt512nGpDwzEcdVmeTDI88Ox2/Q4S6Fg/VwO/PAZqzzYugE9rTGedosSicQNLC4YyFHhTr\"}"
        val userKeys: String =
            "[{\"Gid\":\"mohammed\",\"Attrib\":\"tlemcen:etudiant\",\"Key\":\"YXEwp0XzIpg1k+ZW/qtA/OD2iFnUP/ZZROSfjrFicjuHoHjjadzHWhdvFTc+MQYro8bBUohGUkiiYDz4g4ktpg==\"},{\"Gid\":\"mohammed\",\"Attrib\":\"tlemcen:prof\",\"Key\":\"VfGuszHqz9uyM1mAQV4aLqha9U/N0AlJSqgaZDeDtNN+4czQTm14vBQMgyfIGgPOze3nozc5la5ROpefN6aopQ==\"},{\"Gid\":\"mohammed\",\"Attrib\":\"oran:assistant\",\"Key\":\"iGQAtxnS9NYjM7POiyw8SInJPqhIqdvQ4Hz4EES8GTAxduicvBdauStPPyLU+hHAFz5itMkzs+U3qG30GRp6eg==\"}]"

        Log.i("\uD83D", cypheredToken.toString())

        val plaintext = Maabe_tools.decryptCypherText(
            maabePublicParameters.encodeToByteArray(),
            cypheredToken,
            userKeys.encodeToByteArray()
        )

        if (plaintext == null) {
            text_token.text = "failed : null"
            return
        }
        if (plaintext.isEmpty()) {
            text_token.text = "failed : empty"
            return
        }
        text_token.text = plaintext
        token = plaintext

    }

    fun handleGetRessource() {
        if (checkbox_oscore.isChecked) {
            val masterSecret: ByteArray = "0000".toByteArray(Charsets.US_ASCII)
            val clientId: ByteArray = "client".toByteArray(Charsets.US_ASCII)
            val serverId: ByteArray = "iot".toByteArray(Charsets.US_ASCII)

            val context: OSCoreCtx = OSCoreCtx(
                masterSecret,
                true,
                null,
                clientId,
                serverId,
                null,
                32,
                null,
                null,
                1024
            )
            val db: HashMapCtxDB = HashMapCtxDB()
            db.addContext(context)
            OSCoreCoapStackFactory.useAsDefault(db)
        }

        text_result.text = "sending request ..."


        coapClient = CoapClient("coap://192.168.1.100:5683")
        coapClient.setTimeout(5000)

        val request = Request(CoAP.Code.POST)
        request.payload = ("${token}").encodeToByteArray()
        if (checkbox_oscore.isChecked)
            request.options.setOscore(byteArrayOf(0))



        val response: CoapResponse? = coapClient.advanced(request)
        runOnUiThread {
            if (response != null && response.isSuccess) {
                text_result.text = "${response.responseText}"
            } else text_result.text = "${response?.code} ${response?.responseText}"
        }
        coapClient.shutdown()
    }
}