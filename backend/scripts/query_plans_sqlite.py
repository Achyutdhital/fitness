import sqlite3, json
DB = 'backend/db.sqlite3'
conn = sqlite3.connect(DB)
cur = conn.cursor()
try:
    cur.execute("SELECT id, name, price, billing_cycle FROM subscriptions_subscriptionplan")
    rows = cur.fetchall()
    plans = []
    for r in rows:
        plans.append({'id': r[0], 'name': r[1], 'price': r[2], 'billing_cycle': r[3]})
    print(json.dumps(plans, indent=2))
except Exception as e:
    print('ERROR', e)
finally:
    conn.close()
