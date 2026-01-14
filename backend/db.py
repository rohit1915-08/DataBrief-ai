import sqlite3

DB_NAME = "vizwiz.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Create table if not exists
    c.execute('''CREATE TABLE IF NOT EXISTS history
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  role TEXT, 
                  content TEXT)''')
    conn.commit()
    conn.close()

def add_message(role, content):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("INSERT INTO history (role, content) VALUES (?, ?)", (role, content))
    conn.commit()
    conn.close()

def get_history_text(limit=6):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Get last N messages
    c.execute("SELECT role, content FROM history ORDER BY id DESC LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    # Reverse them to be chronological (Old -> New)
    return "\n".join([f"{row[0].capitalize()}: {row[1]}" for row in reversed(rows)])

def get_all_history():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row # Allows accessing columns by name
    c = conn.cursor()
    c.execute("SELECT role, content FROM history ORDER BY id ASC")
    rows = [dict(row) for row in c.fetchall()]
    conn.close()
    return rows

def clear_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("DELETE FROM history")
    conn.commit()
    conn.close()

# Initialize DB when this file is imported
init_db()