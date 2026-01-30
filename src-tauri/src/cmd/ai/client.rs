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
            .filter(|s| !s.is_empty() && s != "ollama")
            .or_else(|| std::env::var("AI_API_KEY").ok())
            .unwrap_or_default();
            
        let api_url = api_url
            .filter(|s| !s.is_empty())
            .or_else(|| std::env::var("AI_API_URL").ok())
            .unwrap_or_else(|| "https://api.deepseek.com/chat/completions".to_string());
            
        let model = model
            .filter(|s| !s.is_empty())
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
Your task is to generate valid Blockly XML based on the user's description.

STRICT RULES:
1. Output ONLY the XML string. No markdown, no '```xml', no explanations.
2. Use ONLY block types defined in the provided 'Available Blocks Context'.
3. Always wrap the generated blocks in an <arduino_setup> block if no parent is specified.
4. The structure must be valid Blockly XML.
5. The 'arduino_setup' block has two statement inputs: 'SETUP' and 'LOOP'.

Available Blocks Context (JSON):
{}

Example valid output for 'Flash the built-in LED every second':
<block type=\"arduino_setup\">
  <statement name=\"LOOP\">
    <block type=\"arduino_digital_write\">
      <value name=\"PIN\">
        <block type=\"math_number\"><field name=\"NUM\">13</field></block>
      </value>
      <value name=\"STATE\">
        <block type=\"arduino_highlow\"><field name=\"STATE\">HIGH</field></block>
      </value>
      <next>
        <block type=\"arduino_delay\">
          <field name=\"UNIT\">ms</field>
          <value name=\"VALUE\">
            <block type=\"math_number\"><field name=\"NUM\">1000</field></block>
          </value>
          <next>
            <block type=\"arduino_digital_write\">
              <value name=\"PIN\">
                <block type=\"math_number\"><field name=\"NUM\">13</field></block>
              </value>
              <value name=\"STATE\">
                <block type=\"arduino_highlow\"><field name=\"STATE\">LOW</field></block>
              </value>
              <next>
                <block type=\"arduino_delay\">
                  <field name=\"UNIT\">ms</field>
                  <value name=\"VALUE\">
                    <block type=\"math_number\"><field name=\"NUM\">1000</field></block>
                  </value>
                </block>
              </next>
            </block>
          </next>
        </block>
      </next>
    </block>
  </statement>
</block>
",
            context
        );

        let body = json!({
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        });

        println!("[AiClient] Requesting URL: {}", self.config.api_url);
        println!("[AiClient] Model: {}, Prompt: {}", self.config.model, prompt);
        println!("[AiClient] Context length: {} chars", context.len());
        if context.len() > 0 {
            println!("[AiClient] Context snippet: {}...", &context[..context.len().min(100)]);
        }

        log::info!("[AiClient] Requesting URL: {}", self.config.api_url);
        log::info!("[AiClient] Model: {}, Prompt: {}", self.config.model, prompt);

        let mut request = self.client.post(&self.config.api_url)
            .json(&body);

        if !self.config.api_key.is_empty() {
             request = request.header("Authorization", format!("Bearer {}", self.config.api_key));
        }

        let response = request
            .send()
            .await
            .map_err(|e| {
                println!("[AiClient] Request failed: {}", e);
                log::error!("[AiClient] Request failed: {}", e);
                format!("Request failed: {}", e)
            })?;

        let status = response.status();
        println!("[AiClient] Response Status: {}", status);
        log::info!("[AiClient] Response Status: {}", status);

        if !status.is_success() {
            let text = response.text().await.unwrap_or_default();
            println!("[AiClient] API Error {}: {}", status, text);
            log::error!("[AiClient] API Error {}: {}", status, text);
            return Err(format!("API Error {}: {}", status, text));
        }

        let json_text = response.text().await.map_err(|e| {
            println!("[AiClient] Failed to read response text: {}", e);
            log::error!("[AiClient] Failed to read response text: {}", e);
            format!("Failed to read response text: {}", e)
        })?;
        
        println!("[AiClient] Raw Response: {}", json_text);
        log::debug!("[AiClient] Raw Response: {}", json_text);

        let json: serde_json::Value = serde_json::from_str(&json_text).map_err(|e| {
            println!("[AiClient] JSON parse error: {}", e);
            log::error!("[AiClient] JSON parse error: {}", e);
            format!("JSON parse error: {}", e)
        })?;
        
        let content = json["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| {
                println!("[AiClient] Invalid response format: {}", json_text);
                log::error!("[AiClient] Invalid response format: {}", json_text);
                "Invalid response format: missing choices[0].message.content".to_string()
            })?;

        Ok(content.to_string())
    }
}
