import psycopg2
from datetime import datetime

conn_params = {
    'dbname': 'syntaxdb',
    'user': 'syntax',
    'password': 'PjZqyvUWXgmp6g3gMqJPYqZz5YpnhXbCjVsAMdoyuuvmCKNxtE7EQgGWUTFXNtJsoKf73w9hHNFRM6fFqGmH946cbJLNjAjaUQ0z',
    'host': '127.0.0.1',
    'port': '5432'
}
# dat aint my db pass so its calm
def modify_database_schema():
    try:
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = False
        cur = conn.cursor()

        
        print("Adding full_3dcontenthash column to user_thumbnail table...")
        try:
            cur.execute("""
            ALTER TABLE user_thumbnail 
            ADD COLUMN IF NOT EXISTS full_3dcontenthash VARCHAR(512);
            """)
            print("Added full_3dcontenthash column")
        except Exception as e:
            print(f"Error adding full_3dcontenthash column: {e}")
        
        conn.commit()
        print(f"Successfully updated database schema at {datetime.now()}")
    
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == '__main__':
    modify_database_schema()