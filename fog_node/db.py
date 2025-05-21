import mysql.connector
import os
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()  # Loads from .env by default


DB_USER = os.getenv("DB_USER")
DB_PASSWORD=os.getenv("DB_PASSWORD")
DB_NAME=os.getenv("DB_NAME")

def connect_to_mysql():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )

        return connection

    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
        exit(1)

def close_connection(connection):
    """ Closes the database connection """
    if connection and connection.is_connected():
        connection.close()
        print("Database connection closed")

def create_iot_object(id,name, description, access_policy, date_enters=None):
    """
    Inserts a new IoTObject record into the database.
    id and date_enters are optional.
    """
    sql = """
    INSERT INTO IoTObject (id, name, description, accessPolicy, date_enters)
    VALUES (%s, %s, %s, %s, %s)
    """
    # If id is not provided, MySQL will generate one if the column is set up for auto-increment
    # However, your schema defines id as VARCHAR(255) PRIMARY KEY, so it should likely be provided.
    # We'll include it as an optional parameter, but be mindful of your application's ID generation strategy.
    values = (id, name, description, access_policy, date_enters)

    connection = connect_to_mysql()
    if connection:
        cursor = connection.cursor()
        try:
            cursor.execute(sql, values)
            connection.commit()
            print(f"IoTObject '{name}' created successfully.")
            # If ID was auto-generated and you need it, you might fetch it here
            # For VARCHAR ID, you would likely already have it.
        except Error as e:
            print(f"Error creating IoTObject: {e}")
            connection.rollback() # Rollback in case of error
        finally:
            cursor.close()
            close_connection(connection)

def read_iot_objects(object_name=None):
    """
    Reads IoTObject records from the database.
    If object_id is provided, reads a single record. Otherwise, reads all records.
    """
    connection = connect_to_mysql()
    records = []
    if connection:
        cursor = connection.cursor(dictionary=True) # Use dictionary=True to fetch rows as dictionaries
        try:
            if object_name:
                sql = "SELECT * FROM IoTObject WHERE name = %s"
                cursor.execute(sql, (object_name,))
                record = cursor.fetchone() # Fetch single row
                if record:
                    records.append(record)
            else:
                sql = "SELECT * FROM IoTObject"
                cursor.execute(sql)
                records = cursor.fetchall() # Fetch all rows

            print(f"Successfully read {len(records)} record(s).")
        except Error as e:
            print(f"Error reading IoTObject(s): {e}")
        finally:
            cursor.close()
            close_connection(connection)
    return records

def update_iot_object(object_name, description=None, access_policy=None, date_enters=None):
    """
    Updates an existing IoTObject record by id.
    Only updates fields for which a non-None value is provided.
    """
    connection = connect_to_mysql()
    if connection:
        cursor = connection.cursor()
        updates = []
        values = []

        if description is not None:
            updates.append("description = %s")
            values.append(description)
        if access_policy is not None:
            updates.append("accessPolicy = %s")
            values.append(access_policy)
        if date_enters is not None:
             updates.append("date_enters = %s")
             values.append(date_enters)

        if not updates:
            print("No fields to update.")
            close_connection(connection)
            return

        sql = f"UPDATE IoTObject SET {', '.join(updates)} WHERE name = %s"
        values.append(object_name) # Add the ID to the values tuple

        try:
            cursor.execute(sql, tuple(values)) # Convert list to tuple for execute
            connection.commit()
            print(f"IoTObject with id '{object_name}' updated successfully.")
        except Error as e:
            print(f"Error updating IoTObject with id '{object_name}': {e}")
            connection.rollback()
        finally:
            cursor.close()
            close_connection(connection)

def delete_iot_object(object_name):
    """ Deletes an IoTObject record by id """
    sql = "DELETE FROM IoTObject WHERE name = %s"
    connection = connect_to_mysql   ()
    if connection:
        cursor = connection.cursor()
        try:
            cursor.execute(sql, (object_name,))
            connection.commit()
            if cursor.rowcount > 0:
                print(f"IoTObject with id '{object_name}' deleted successfully.")
            else:
                print(f"No IoTObject found with id '{object_name}'.")
        except Error as e:
            print(f"Error deleting IoTObject with id '{object_name}': {e}")
            connection.rollback()
        finally:
            cursor.close()
            close_connection(connection)
