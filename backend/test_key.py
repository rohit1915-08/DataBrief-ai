import os
from openai import OpenAI
from dotenv import load_dotenv

# 1. Load the key
load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")

print(f"🔑 Checking Key: {api_key[:10]}...")

if not api_key:
    print("❌ Error: No OPENROUTER_API_KEY found in .env file")
    exit()

# 2. Connect via OpenRouter (NOT Google SDK)
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
    default_headers={
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "VizWiz Test"
    }
)

# 3. Test a simple "Hello World"
try:
    print("🚀 Sending test request to OpenRouter...")
    
    # We use a reliable free model for the test
    completion = client.chat.completions.create(
        model="meta-llama/llama-3.3-70b-instruct:free",
        messages=[
            {"role": "user", "content": "Say 'Hello! Infinite Access is working!'"}
        ]
    )
    
    print("\n✅ SUCCESS! Response:")
    print(completion.choices[0].message.content)

except Exception as e:
    print(f"\n❌ CONNECTION FAILED: {e}")