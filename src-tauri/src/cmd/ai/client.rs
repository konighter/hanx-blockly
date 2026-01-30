use reqwest::Client;
use serde_json::json;

pub struct AiConfig {
    pub api_key: String,
    pub api_url: String,
    pub model: String,
}

impl AiConfig {
    pub fn resolve(
        api_key: Option<String>,
        api_url: Option<String>,
        model: Option<String>
    ) -> Result<Self, String> {
        let api_key = api_key
            .or_else(|| std::env::var("AI_API_KEY").ok())
            .ok_or("AI API Key not configured. Please set it in Settings.")?;
            
        let api_url = api_url
            .or_else(|| std::env::var("AI_API_URL").ok())
            .unwrap_or_else(|| "https://api.deepseek.com/chat/completions".to_string());
            
        let model = model
            .or_else(|| std::env::var("AI_MODEL").ok())
            .unwrap_or_else(|| "deepseek-chat".to_string());
            
        Ok(Self { api_key, api_url, model })
    }
}

pub struct AiClient {
    client: Client,
    config: AiConfig,
}

impl AiClient {
    pub fn new(config: AiConfig) -> Self {
        Self {
            client: Client::new(),
            config,
        }
    }

    pub async fn generate(&self, prompt: String, context: String) -> Result<String, String> {
        let system_prompt = format!(
            "You are an expert Arduino and Blockly assistant. 
            Your task is to generate Blockly XML based on the user's description.
            Use only the blocks defined in the provided context.
            The output must be ONLY the XML string, no markdown, no explanation.
            
            Available Blocks Context:
            {}
            ",
            context
        );

        // Most providers (DeepSeek, OpenAI, Ollama/v1) support the OpenAI Chat Completion format
        let body = json!({
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        });

        let mut request = self.client.post(&self.config.api_url)
            .json(&body);

        // Only add Authorization header if api_key is present and not dummy "ollama" if using local ollama
        // but generally passing it doesn't hurt for OpenAI compatible endpoints except some strict ones.
        if !self.config.api_key.is_empty() {
             request = request.header("Authorization", format!("Bearer {}", self.config.api_key));
        }

        let response = request
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(format!("API Error {}: {}", status, text));
        }

        let json: serde_json::Value = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
        
        let content = json["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("Invalid response format: missing choices[0].message.content")?;

        Ok(content.to_string())
    }
}
