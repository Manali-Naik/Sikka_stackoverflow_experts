from flask import Flask, request, jsonify
from flask_cors import CORS
import ollama

app = Flask(__name__)
CORS(app)

MODEL_NAME = 'llama3.2'

CLAUDE_SYSTEM_PROMPT = """You are a highly capable AI assistant similar to Claude. Follow these guidelines for responses:

1. Be clear, thorough, and precise while maintaining conciseness
2. Use appropriate Markdown formatting:
   - Use `code` for technical terms, commands, and short code snippets
   - Use ```language for code blocks with proper syntax highlighting
   - Use **bold** for emphasis
   - Use * for bullet points
   - Use numbered lists for sequential steps
3. Structure longer responses with clear headings using Markdown (#, ##, ###)
4. When explaining technical concepts:
   - Break down complex ideas into smaller parts
   - Use examples where helpful
   - Explain your reasoning step by step
5. For code or technical solutions:
   - Explain the approach first
   - Provide well-commented code
   - Explain key parts after the code
6. Always maintain a helpful and professional tone
7. If uncertain, acknowledge the limitations of your knowledge
8. When appropriate, offer to provide more details or clarification

Respond in this structured, clear format while keeping responses natural and conversational."""

@app.route('/chat', methods=['POST'])
def chat():
    print("Received chat request")
    try:
        data = request.json
        print("Request data:", data)
        
        user_message = data.get('message')
        if not user_message:
            print("No message provided")
            return jsonify({'error': 'No message provided'}), 400

        # Create the message context with detailed system prompt
        messages = [
            {
                'role': 'system',
                'content': CLAUDE_SYSTEM_PROMPT
            },
            {
                'role': 'user',
                'content': user_message
            }
        ]

        # Add context for code-related queries
        if any(keyword in user_message.lower() for keyword in ['code', 'program', 'function', 'error', 'bug', 'implement']):
            messages.insert(1, {
                'role': 'system',
                'content': """For programming-related questions:
                1. Start with a brief overview of the solution
                2. Provide well-structured, commented code
                3. Explain key components after the code
                4. Include error handling best practices
                5. Suggest potential improvements or alternatives"""
            })

        # Add context for technical explanations
        if any(keyword in user_message.lower() for keyword in ['explain', 'how', 'what is', 'define', 'describe']):
            messages.insert(1, {
                'role': 'system',
                'content': """For explanations:
                1. Start with a clear, concise definition
                2. Break down complex concepts
                3. Use relevant examples
                4. Highlight key points using proper formatting
                5. Connect ideas to practical applications"""
            })

        print(f"Sending request to Ollama using {MODEL_NAME}...")
        response = ollama.chat(
            model=MODEL_NAME,
            messages=messages,
            stream=False
        )
        print("Received response from Ollama")

        # Post-process the response to ensure proper formatting
        formatted_response = response['message']['content']
        
        # Ensure code blocks are properly formatted
        if '```' not in formatted_response and any(keyword in user_message.lower() for keyword in ['code', 'program', 'function']):
            if 'python' in user_message.lower():
                formatted_response = formatted_response.replace('`python', '```python')
            elif 'javascript' in user_message.lower():
                formatted_response = formatted_response.replace('`javascript', '```javascript')
            else:
                formatted_response = formatted_response.replace('`', '```')

        return jsonify({'response': formatted_response})

    except Exception as e:
        print("Error occurred:", str(e))
        error_response = {
            'error': str(e),
            'formatted_message': f"""I apologize, but I encountered an error while processing your request. 

**Error details:** `{str(e)}`

Please try:
1. Checking if your request is properly formatted
2. Ensuring the message is not too long
3. Verifying that the server connection is stable

If the problem persists, please try again or rephrase your question."""
        }
        return jsonify(error_response), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        test_message = "Hello, this is a test message."
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {'role': 'system', 'content': 'Brief test response needed'},
                {'role': 'user', 'content': test_message}
            ],
            stream=False
        )
        return jsonify({
            'status': 'healthy',
            'model': MODEL_NAME,
            'message': 'Connected and functioning properly'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'message': 'Please ensure Ollama service is running and the model is properly installed'
        }), 500

if __name__ == '__main__':
    print(f"Starting Flask server with {MODEL_NAME} model...")
    print("Initializing with Claude-like response formatting...")
    try:
        # Verify Ollama connection
        ollama.chat(
            model=MODEL_NAME,
            messages=[{'role': 'user', 'content': 'test'}],
            stream=False
        )
        print(f"Successfully connected to {MODEL_NAME} model")
        print("Server is ready to generate Claude-like responses")
        app.run(debug=True, port=5000)
    except Exception as e:
        print(f"Error connecting to Ollama: {str(e)}")
        print(f"Please ensure Ollama is running and {MODEL_NAME} model is installed")
        print(f"\nTo install the model, run: ollama pull {MODEL_NAME}")
        exit(1)