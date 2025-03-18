/**
 * Example Plugin
 * 
 * This is a simple example plugin for the ainFT execution client.
 */
module.exports = {
  id: 'example-plugin',
  name: 'Example Plugin',
  description: 'A simple example plugin for the ainFT execution client',
  version: '1.0.0',
  
  // Plugin capabilities
  capabilities: [
    {
      id: 'data-collector',
      type: 'data-collector',
      collectData: async (topics, context) => {
        console.log('Example plugin collecting data for topics:', topics);
        console.log('Context:', context);
        
        // Return some example data
        return {
          timestamp: new Date().toISOString(),
          message: 'This is example data from the example plugin',
          topics
        };
      }
    },
    {
      id: 'prompt-enhancer',
      type: 'prompt-enhancer',
      enhancePrompt: async (prompt, context, options) => {
        console.log('Example plugin enhancing prompt');
        
        // Add some context to the prompt
        return `${prompt}\n\nAdditional context from example plugin: The current time is ${new Date().toISOString()}`;
      }
    },
    {
      id: 'response-processor',
      type: 'response-processor',
      processResponse: async (response, context) => {
        console.log('Example plugin processing response');
        
        // Add a signature to the response
        return `${response}\n\n[Processed by Example Plugin]`;
      }
    }
  ],
  
  // Plugin lifecycle hooks
  initialize: async (config) => {
    console.log('Example plugin initialized with config:', config);
    return true;
  },
  
  cleanup: async () => {
    console.log('Example plugin cleaned up');
    return true;
  }
};
