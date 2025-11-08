#!/usr/bin/env python3
"""
Chatbot Test Script
Tests the chatbot functionality and API endpoints
"""

import json
import requests
import sys
import time
from datetime import datetime

def test_health_endpoint(base_url="http://localhost:5000"):
    """Test the health endpoint"""
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Health endpoint: PASS")
            return True
        else:
            print(f"❌ Health endpoint: FAIL (Status: {response.status_code})")
            return False
    except requests.RequestException as e:
        print(f"❌ Health endpoint: FAIL (Error: {e})")
        return False

def test_chat_endpoint(base_url="http://localhost:5000"):
    """Test the chat endpoint with various messages"""
    test_messages = [
        "hola",
        "¿cómo estás?",
        "ayuda",
        "adiós",
        "esto es una prueba"
    ]
    
    passed = 0
    total = len(test_messages)
    
    for message in test_messages:
        try:
            response = requests.post(
                f"{base_url}/chat",
                json={"message": message},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'response' in data:
                    print(f"✅ Chat '{message}': {data['response'][:50]}...")
                    passed += 1
                else:
                    print(f"❌ Chat '{message}': Missing response field")
            else:
                print(f"❌ Chat '{message}': Status {response.status_code}")
                
        except requests.RequestException as e:
            print(f"❌ Chat '{message}': Error {e}")
    
    print(f"\nChat endpoint: {passed}/{total} tests passed")
    return passed == total

def test_status_endpoint(base_url="http://localhost:5000"):
    """Test the status endpoint"""
    try:
        response = requests.get(f"{base_url}/status", timeout=10)
        if response.status_code == 200:
            data = response.json()
            required_fields = ['name', 'status', 'restart_count', 'pid']
            
            if all(field in data for field in required_fields):
                print("✅ Status endpoint: PASS")
                print(f"   - Name: {data['name']}")
                print(f"   - Status: {data['status']}")
                print(f"   - PID: {data['pid']}")
                return True
            else:
                print("❌ Status endpoint: Missing required fields")
                return False
        else:
            print(f"❌ Status endpoint: FAIL (Status: {response.status_code})")
            return False
    except requests.RequestException as e:
        print(f"❌ Status endpoint: FAIL (Error: {e})")
        return False

def test_interactive_mode():
    """Test interactive mode (basic import test)"""
    try:
        import sys
        import os
        sys.path.insert(0, '/opt/chatbot')
        
        from app import ChatBot
        
        # Create chatbot instance
        chatbot = ChatBot()
        
        # Test message processing
        test_messages = [
            "hola",
            "help",
            "estado",
            "adiós"
        ]
        
        for msg in test_messages:
            response = chatbot.process_message(msg)
            if response:
                print(f"✅ Interactive '{msg}': {response[:50]}...")
            else:
                print(f"❌ Interactive '{msg}': Empty response")
                return False
        
        print("✅ Interactive mode: PASS")
        return True
        
    except Exception as e:
        print(f"❌ Interactive mode: FAIL ({e})")
        return False

def main():
    """Main test function"""
    print("🤖 Chatbot Test Suite")
    print("=" * 50)
    print(f"Test started at: {datetime.now()}")
    print()
    
    tests_passed = 0
    total_tests = 4
    
    # Test 1: Health endpoint
    print("Test 1: Health Endpoint")
    if test_health_endpoint():
        tests_passed += 1
    print()
    
    # Test 2: Chat endpoint
    print("Test 2: Chat Endpoint")
    if test_chat_endpoint():
        tests_passed += 1
    print()
    
    # Test 3: Status endpoint
    print("Test 3: Status Endpoint")
    if test_status_endpoint():
        tests_passed += 1
    print()
    
    # Test 4: Interactive mode
    print("Test 4: Interactive Mode")
    if test_interactive_mode():
        tests_passed += 1
    print()
    
    # Summary
    print("=" * 50)
    print(f"Test Summary: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Chatbot is working correctly.")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Check the chatbot configuration.")
        sys.exit(1)

if __name__ == "__main__":
    main()