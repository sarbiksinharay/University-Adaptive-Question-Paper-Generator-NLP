#!/usr/bin/env python3
"""
LLM Bridge Script - Handles LLM calls via emergentintegrations
Called from Node.js via child_process
Reads JSON from stdin, writes JSON to stdout
"""
import sys
import json
import asyncio
import os

async def generate(system_prompt, user_prompt, api_key, model="gpt-4.1-mini", provider="openai"):
    """Generate LLM response using emergentintegrations"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"rag-generation-{os.getpid()}",
        system_message=system_prompt
    )
    chat.with_model(provider, model)
    
    user_message = UserMessage(text=user_prompt)
    response = await chat.send_message(user_message)
    return response

def main():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        system_prompt = input_data.get("system_prompt", "You are a helpful assistant.")
        user_prompt = input_data.get("user_prompt", "")
        api_key = input_data.get("api_key", "")
        model = input_data.get("model", "gpt-4.1-mini")
        provider = input_data.get("provider", "openai")
        
        if not api_key:
            print(json.dumps({"error": "No API key provided"}))
            sys.exit(1)
        
        if not user_prompt:
            print(json.dumps({"error": "No user prompt provided"}))
            sys.exit(1)
        
        # Run async generation
        result = asyncio.run(generate(system_prompt, user_prompt, api_key, model, provider))
        
        # Output result as JSON
        print(json.dumps({"response": result}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
