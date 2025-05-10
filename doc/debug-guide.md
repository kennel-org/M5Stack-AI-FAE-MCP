# M5 AI FAE Debug Guide (Under Development)

**Note: This project is currently under development. Features and APIs may change without prior notice.**

This document explains the changes made to improve interactions with the M5 AI FAE chatbot and provides debugging methods.

## Key Improvements

1. **Handling of "Thinking..." Text**
   - The "Thinking..." (考え中...) text in chatbot responses is now automatically removed
   - This allows for retrieving clean response text only

2. **Selector Optimization**
   - Changed to prioritize the most reliable CSS selectors
   - The following selectors, which have been verified through debug testing, are used with priority:
     - `.message.bot-message:last-child .message-text`
     - `.message.bot-message:nth-last-child(1) .message-text`
     - `.bot-message:last-child`

3. **Improved Error Handling**
   - More detailed error information is now provided
   - Consistent property names are used to facilitate debugging

## Debugging Methods

### Using the MCP Server

The MCP server provides an API for sending questions to the M5 AI FAE chatbot and retrieving answers.

```bash
# Start the server
node mcp-server.js

# API request example
curl -X POST -H "Content-Type: application/json" \
  -d '{"question":"Please tell me how to connect a GPS module to AtomS3 Lite"}' \
  http://localhost:3000/ask
```

### Response Structure

API responses include the following information:

```json
{
  "question": "Question text",
  "answer": "Clean answer text (with 'Thinking...' removed)",
  "html": "HTML format of the answer",
  "originalAnswer": "Original answer text (may include 'Thinking...')",
  "selectors": {
    "tested": true,
    "successful": true,
    "selectorUsed": "Selector used"
  }
}
```

## Troubleshooting

1. **If No Answer is Retrieved**
   - Check your network connection
   - Verify that the M5 AI FAE website (https://chat.m5stack.com/) is available
   - If the UI has changed, you may need to add new selectors

2. **If Selectors Don't Work**
   - The M5 AI FAE UI may have been updated
   - You can use the `debug-selectors.js` script to test new selectors

## Future Improvements

1. Adding selectors to support more UI patterns
2. Performance optimization of the answer retrieval process
3. Further improvement of error handling

---

Last updated: May 10, 2025
