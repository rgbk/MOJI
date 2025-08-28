import Anthropic from '@anthropic-ai/sdk';

// Test script to check available models
async function testClaudeAPI() {
  const apiKey = (import.meta as any).env?.VITE_CLAUDE_API_KEY;
  
  if (!apiKey) {
    console.error('No API key found');
    return;
  }
  
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true
  });
  
  // Test comprehensive model list for Claude Max account
  const modelsToTest = [
    // Claude 3.5 models
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-5-haiku-20241022',
    
    // Alternative naming patterns
    'claude-3.5-sonnet-20241022',
    'claude-3.5-sonnet-20240620', 
    'claude-sonnet-3.5-20241022',
    
    // Claude 3 models
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    
    // Latest/generic names
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet',
    'claude-3-opus-latest',
    'claude-3-opus'
  ];
  
  console.log('Testing Claude models...');
  
  for (const model of modelsToTest) {
    try {
      console.log(`Testing ${model}...`);
      
      const message = await client.messages.create({
        model,
        max_tokens: 10,
        messages: [{ role: "user", content: "Hello" }]
      });
      
      console.log(`✅ ${model} WORKS!`);
      return model; // Return the first working model
    } catch (error) {
      console.log(`❌ ${model} failed:`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log('No models worked!');
  return null;
}

export { testClaudeAPI };