use serde::{Deserialize, Serialize};
mod client;
use client::{AiClient, AiConfig};

#[tauri::command]
pub async fn generate_blocks(
    prompt: String, 
    context: String, 
    api_key: Option<String>, 
    api_url: Option<String>, 
    model: Option<String>
) -> Result<String, String> {
    println!("[AiCommand] generate_blocks entry");
    println!("[AiCommand] prompt: {}", prompt);
    println!("[AiCommand] context length: {} chars", context.len());
    if context.len() > 0 {
        println!("[AiCommand] context snippet: {}...", &context[..context.len().min(100)]);
    }
    
    // Prioritize passed args, then env vars, then defaults
    let config = AiConfig::resolve(api_key, api_url, model)?;

    println!("[AiCommand] Resolved config: url={}, model={}", config.api_url, config.model);
    log::info!("[AiCommand] Resolved config: url={}, model={}", config.api_url, config.model);

    let client = AiClient::new(config);
    let result = client.generate(prompt, context).await?;

    Ok(result)
}
