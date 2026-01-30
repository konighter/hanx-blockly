use serde::{Deserialize, Serialize};
mod client;
use client::{AiClient, AiConfig};

#[derive(Deserialize)]
pub struct GenerateBlocksArgs {
    pub prompt: String,
    pub context: String,
    pub api_key: Option<String>,
    pub api_url: Option<String>,
    pub model: Option<String>,
}

#[derive(Serialize)]
pub struct GenerateBlocksResponse {
    pub result: String,
}

#[tauri::command]
pub async fn generate_blocks(args: GenerateBlocksArgs) -> Result<GenerateBlocksResponse, String> {
    // Prioritize passed args, then env vars, then defaults (Logic moved to client::AiConfig::resolve)
    let config = AiConfig::resolve(args.api_key, args.api_url, args.model)?;

    let client = AiClient::new(config);
    let result = client.generate(args.prompt, args.context).await?;

    Ok(GenerateBlocksResponse { result })
}
