package com.iot_controller.db

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper


object DbConstants {
    const val DATABASE_NAME = "auth_database.db"
    const val DATABASE_VERSION = 1

    const val TABLE_NAME = "authorities"
    const val COLUMN_AUTHORITY_NAME = "authority_name"
    const val COLUMN_KEYS = "keys"
}

data class AuthEntry(
    val authorityName: String,
    val keys: String
)

class AuthorityDbHelper(context: Context) : SQLiteOpenHelper(
    context,
    DbConstants.DATABASE_NAME,
    null,
    DbConstants.DATABASE_VERSION
) {



    private val SQL_CREATE_ENTRIES =
        "CREATE TABLE ${DbConstants.TABLE_NAME} (" +
                "${DbConstants.COLUMN_AUTHORITY_NAME} TEXT PRIMARY KEY," +
                "${DbConstants.COLUMN_KEYS} TEXT NOT NULL" +
                ")"

    // Called when the database is created for the first time
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(SQL_CREATE_ENTRIES)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
    }
    override fun onDowngrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
    }

    // --- CRUD Operations ---

    /**
     * Inserts a new authority entry into the database.
     * @param authorityName The name of the authority.
     * @param keysJson The keys as a JSON string.
     * @return The row ID of the newly inserted row, or -1 if an error occurred.
     */
    fun insertAuthEntry(authorityName: String, keysJson: String): Long {
        val db = this.writableDatabase

        val values = ContentValues().apply {
            put(DbConstants.COLUMN_AUTHORITY_NAME, authorityName)
            put(DbConstants.COLUMN_KEYS, keysJson)
        }

        val newRowId = db.insert(DbConstants.TABLE_NAME, null, values)

        db.close()
        return newRowId
    }

    /**
     * Retrieves all authority entries from the database.
     * @return A list of AuthEntry objects.
     */
    fun getAllAuthEntries(): ArrayList<AuthEntry> {
        val entriesList = ArrayList<AuthEntry>()
        val db = this.readableDatabase // Get the database in read mode

        // Define the columns you want to retrieve
        val projection = arrayOf(
            DbConstants.COLUMN_AUTHORITY_NAME,
            DbConstants.COLUMN_KEYS
        )

        val cursor: Cursor? = db.query(
            DbConstants.TABLE_NAME, // The table to query
            projection,                          // The columns to return
            null,                                // The columns for the WHERE clause
            null,                                // The values for the WHERE clause
            null,                                // Don't group the rows
            null,                                // Don't filter by row groups
            null                                 // The sort order (null for default)
        )

        // Iterate through the cursor and build the list
        cursor?.use { // Use 'use' to automatically close the cursor
            while (it.moveToNext()) {
                val name = it.getString(it.getColumnIndexOrThrow(DbConstants.COLUMN_AUTHORITY_NAME))
                val keys = it.getString(it.getColumnIndexOrThrow(DbConstants.COLUMN_KEYS))
                entriesList.add(AuthEntry(name,keys))
            }
        }
        db.close()
        return entriesList
    }

    fun deleteAuthEntry(authorityName: String): Int {
        val db = this.writableDatabase // Get the database in write mode

        val deletedRows = db.delete(
            DbConstants.TABLE_NAME,                // The table
            "${DbConstants.COLUMN_AUTHORITY_NAME} LIKE ?",                         // The WHERE clause
            arrayOf(authorityName)                          // The WHERE arguments
        )

        db.close()
        return deletedRows
    }


    // You can add more methods here for get by name, update, delete, etc.
}