import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitness_project.settings')
django.setup()

def test_keys():
    gemini_keys = [k.strip() for k in str(getattr(settings, 'GEMINI_API_KEY', '')).split(',') if k.strip()]
    openai_keys = [k.strip() for k in str(getattr(settings, 'OPENAI_API_KEY', '')).split(',') if k.strip()]
    claude_keys = [k.strip() for k in str(getattr(settings, 'CLAUDE_API_KEY', '')).split(',') if k.strip()]

    print(f"Found: {len(gemini_keys)} Gemini, {len(openai_keys)} OpenAI, {len(claude_keys)} Claude keys.")

    # Test Gemini 1
    if gemini_keys:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_keys[0])
            client.models.generate_content(model='gemini-1.5-flash', contents='Hi')
            print("✅ Gemini Key 1: OK")
        except Exception as e:
            print(f"❌ Gemini Key 1: {str(e)[:100]}")

    # Test OpenAI 1
    if openai_keys:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_keys[0])
            client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": "Hi"}], max_tokens=5)
            print("✅ OpenAI Key 1: OK")
        except Exception as e:
            print(f"❌ OpenAI Key 1: {str(e)[:100]}")

    # Test Claude 1
    if claude_keys:
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=claude_keys[0])
            client.messages.create(model="claude-3-haiku-20240307", max_tokens=5, messages=[{"role": "user", "content": "Hi"}])
            print("✅ Claude Key 1: OK")
        except Exception as e:
            print(f"❌ Claude Key 1: {str(e)[:100]}")

if __name__ == "__main__":
    test_keys()
