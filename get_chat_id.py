import requests
import time

TOKEN = "8758639842:AAGweDOKzPxa8EoOR8noIJdyPLOqyG0JyVo"
URL = f"https://api.telegram.org/bot{TOKEN}/getUpdates"

print("🔍 Waiting for your message to Telegram Bot...")
print("👉 Open Telegram App, search for your bot, and send any message like 'hi' or press 'START'.\n")

for _ in range(30):
    try:
        res = requests.get(URL, timeout=3).json()
        if res.get("ok") and len(res.get("result", [])) > 0:
            for item in res["result"]:
                if "message" in item:
                    chat_id = str(item["message"]["chat"]["id"])
                    first_name = item["message"]["chat"].get("first_name", "User")
                    print(f"🎉 FOUND CHAT ID FOR {first_name}!")
                    print(f"👉 CHAT ID: {chat_id}")

                    # Auto update server.py
                    with open("backend/server.py", "r") as f:
                        content = f.read()
                    content = content.replace('TELEGRAM_CHAT_ID = "YOUR_TELEGRAM_CHAT_ID"', f'TELEGRAM_CHAT_ID = "{chat_id}"')
                    with open("backend/server.py", "w") as f:
                        f.write(content)
                    print(f"✅ Automatically updated backend/server.py with your Chat ID ({chat_id})!")
                    exit(0)
    except Exception as e:
        pass
    time.sleep(2)

print("Timeout waiting for message. Please send a message to your bot on Telegram and try again!")
