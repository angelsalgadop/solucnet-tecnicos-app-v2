#!/usr/bin/env python3
"""
Chatbot Application with Auto-Recovery
A robust chatbot that automatically restarts on errors
"""

import json
import logging
import os
import sys
import time
import traceback
from datetime import datetime
from typing import Dict, Any
import signal
import requests

class ChatBot:
    def __init__(self, config_path: str = "/etc/chatbot/config.json"):
        self.config_path = config_path
        self.config = self.load_config()
        self.setup_logging()
        self.running = True
        self.restart_count = 0
        self.max_restarts = self.config.get('max_restarts', 10)
        
        # Setup signal handlers
        signal.signal(signal.SIGTERM, self.signal_handler)
        signal.signal(signal.SIGINT, self.signal_handler)
        
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            # Default configuration
            return {
                "name": "ChatBot",
                "port": 5000,
                "log_level": "INFO",
                "max_restarts": 10,
                "restart_delay": 5,
                "responses": {
                    "greeting": ["Hola!", "¡Hola! ¿En qué puedo ayudarte?", "¡Bienvenido!"],
                    "goodbye": ["¡Hasta luego!", "¡Que tengas un buen día!", "¡Nos vemos!"],
                    "default": "Lo siento, no entiendo tu pregunta. ¿Puedes ser más específico?",
                    "help": "Puedes saludarme, despedirte o hacer preguntas. Estoy aquí para ayudarte.",
                    "status": "Estoy funcionando correctamente y listo para ayudarte."
                }
            }
    
    def setup_logging(self):
        """Setup logging configuration"""
        log_dir = "/var/log/chatbot"
        os.makedirs(log_dir, exist_ok=True)
        
        log_file = os.path.join(log_dir, "chatbot.log")
        
        logging.basicConfig(
            level=getattr(logging, self.config.get('log_level', 'INFO')),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        self.logger = logging.getLogger('ChatBot')
        self.logger.info(f"ChatBot initialized - PID: {os.getpid()}")
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        self.logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.running = False
    
    def process_message(self, message: str) -> str:
        """Process incoming message and return response"""
        message = message.lower().strip()
        responses = self.config.get('responses', {})
        
        # Greeting detection
        greetings = ['hola', 'hello', 'hi', 'buenos dias', 'buenas tardes', 'buenas noches']
        if any(greeting in message for greeting in greetings):
            import random
            return random.choice(responses.get('greeting', ['¡Hola!']))
        
        # Goodbye detection
        goodbyes = ['adios', 'bye', 'hasta luego', 'nos vemos', 'chao']
        if any(goodbye in message for goodbye in goodbyes):
            import random
            return random.choice(responses.get('goodbye', ['¡Hasta luego!']))
        
        # Help request
        help_words = ['ayuda', 'help', 'que puedes hacer', 'comandos']
        if any(help_word in message for help_word in help_words):
            return responses.get('help', 'Puedo ayudarte con varias cosas.')
        
        # Status check
        status_words = ['estado', 'status', 'como estas', 'funciona']
        if any(status_word in message for status_word in status_words):
            return responses.get('status', 'Funcionando correctamente.')
        
        # Default response
        return responses.get('default', 'No entiendo tu pregunta.')
    
    def health_check(self) -> bool:
        """Perform self health check"""
        try:
            # Basic functionality test
            test_response = self.process_message("hola")
            return len(test_response) > 0
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False
    
    def save_state(self):
        """Save current state to file"""
        state = {
            'last_restart': datetime.now().isoformat(),
            'restart_count': self.restart_count,
            'pid': os.getpid(),
            'status': 'running' if self.running else 'stopped'
        }
        
        try:
            with open('/var/log/chatbot/state.json', 'w') as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            self.logger.error(f"Failed to save state: {e}")
    
    def run_interactive(self):
        """Run chatbot in interactive mode"""
        print(f"🤖 {self.config.get('name', 'ChatBot')} iniciado")
        print("Escribe 'quit' para salir")
        print("-" * 50)
        
        try:
            while self.running:
                try:
                    user_input = input("\nTú: ").strip()
                    
                    if user_input.lower() in ['quit', 'exit', 'salir']:
                        print("Bot: ¡Hasta luego!")
                        break
                    
                    if user_input:
                        response = self.process_message(user_input)
                        print(f"Bot: {response}")
                        
                except KeyboardInterrupt:
                    print("\nBot: ¡Hasta luego!")
                    break
                except Exception as e:
                    self.logger.error(f"Error in interactive mode: {e}")
                    print("Bot: Disculpa, ocurrió un error. Inténtalo de nuevo.")
                    
        except Exception as e:
            self.logger.error(f"Fatal error in interactive mode: {e}")
            raise
    
    def run_server(self):
        """Run chatbot as HTTP server"""
        from flask import Flask, request, jsonify
        
        app = Flask(__name__)
        
        @app.route('/health', methods=['GET'])
        def health():
            is_healthy = self.health_check()
            return jsonify({
                'status': 'healthy' if is_healthy else 'unhealthy',
                'timestamp': datetime.now().isoformat(),
                'restart_count': self.restart_count
            }), 200 if is_healthy else 500
        
        @app.route('/chat', methods=['POST'])
        def chat():
            try:
                data = request.get_json()
                message = data.get('message', '')
                
                if not message:
                    return jsonify({'error': 'Message is required'}), 400
                
                response = self.process_message(message)
                
                return jsonify({
                    'response': response,
                    'timestamp': datetime.now().isoformat()
                })
                
            except Exception as e:
                self.logger.error(f"Error processing chat request: {e}")
                return jsonify({'error': 'Internal server error'}), 500
        
        @app.route('/status', methods=['GET'])
        def status():
            return jsonify({
                'name': self.config.get('name', 'ChatBot'),
                'status': 'running',
                'restart_count': self.restart_count,
                'uptime': time.time(),
                'pid': os.getpid()
            })
        
        port = self.config.get('port', 5000)
        self.logger.info(f"Starting HTTP server on port {port}")
        
        try:
            app.run(host='0.0.0.0', port=port, debug=False)
        except Exception as e:
            self.logger.error(f"Server error: {e}")
            raise
    
    def run(self, mode='server'):
        """Main run method with error recovery"""
        self.logger.info(f"Starting ChatBot in {mode} mode")
        
        while self.running and self.restart_count < self.max_restarts:
            try:
                self.save_state()
                
                if mode == 'interactive':
                    self.run_interactive()
                else:
                    self.run_server()
                    
                # If we get here, it means clean shutdown
                break
                
            except Exception as e:
                self.restart_count += 1
                self.logger.error(f"Error occurred (restart #{self.restart_count}): {e}")
                self.logger.error(f"Traceback: {traceback.format_exc()}")
                
                if self.restart_count >= self.max_restarts:
                    self.logger.critical(f"Max restarts ({self.max_restarts}) reached. Shutting down.")
                    break
                
                # Wait before restarting
                restart_delay = self.config.get('restart_delay', 5)
                self.logger.info(f"Restarting in {restart_delay} seconds...")
                time.sleep(restart_delay)
        
        self.logger.info("ChatBot shutdown complete")

def main():
    """Main entry point"""
    mode = 'server'
    if len(sys.argv) > 1:
        mode = sys.argv[1]
    
    chatbot = ChatBot()
    chatbot.run(mode)

if __name__ == "__main__":
    main()