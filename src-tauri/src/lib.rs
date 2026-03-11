use std::env;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use midir::MidiInput;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::Manager;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct MidiInputInfo {
    id: String,
    name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct BackendDiagnostics {
    native_runtime: bool,
    open_ai_configured: bool,
    open_ai_source: Option<String>,
    midi_inputs: Vec<MidiInputInfo>,
    message: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BeatPromptContext {
    tempo: u16,
    swing: f32,
    active_pattern_name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BeatPromptRequest {
    prompt: String,
    context: BeatPromptContext,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct PatternDraft {
    name: String,
    groove_tone: String,
    description: String,
    swing: f32,
    steps: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ArrangementDraft {
    label: String,
    pattern_role: String,
    repeats: u8,
    fill_on_last_repeat: Option<bool>,
    transition: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct GeneratedBeatIdea {
    summary: String,
    suggested_tempo: u16,
    swing: f32,
    groove_tone: String,
    feel: String,
    main_pattern: PatternDraft,
    fill_pattern: PatternDraft,
    arrangement: Vec<ArrangementDraft>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PersistImportedSampleRequest {
    drum_id: String,
    file_name: String,
    bytes: Vec<u8>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PersistedSample {
    path: String,
}

fn clamp_velocity(value: u8) -> u8 {
    match value {
        0..=48 => 72,
        49..=114 => 104,
        _ => 127,
    }
}

fn default_empty_steps() -> Value {
    json!({
        "kick": [],
        "snare": [],
        "closedHat": [],
        "openHat": [],
        "clap": [],
        "lowTom": [],
        "midTom": [],
        "crash": []
    })
}

fn fallback_idea(request: &BeatPromptRequest) -> GeneratedBeatIdea {
    let lowered = request.prompt.to_lowercase();
    let (tempo, swing, groove_tone, feel) = if lowered.contains("techno") {
        (132, 0.03, "tight", "driving, late-night, locked")
    } else if lowered.contains("boom bap")
        || lowered.contains("boom-bap")
        || lowered.contains("hip hop")
    {
        (92, 0.17, "laid-back", "dusty, human, behind the beat")
    } else if lowered.contains("broken") {
        (126, 0.11, "pushed", "off-axis, nimble, syncopated")
    } else {
        (
            request.context.tempo,
            request.context.swing,
            "tight",
            "balanced, direct, editable",
        )
    };

    let main_pattern = PatternDraft {
        name: "Fallback Main".to_string(),
        groove_tone: groove_tone.to_string(),
        description: format!(
            "Fallback groove for {}.",
            request.context.active_pattern_name
        ),
        swing,
        steps: json!({
            "kick": [
                { "index": 0, "velocity": 127 },
                { "index": 8, "velocity": 104 }
            ],
            "snare": [
                { "index": 4, "velocity": 104 },
                { "index": 12, "velocity": 127 }
            ],
            "closedHat": [
                { "index": 0, "velocity": 72 },
                { "index": 2, "velocity": 72 },
                { "index": 4, "velocity": 72 },
                { "index": 6, "velocity": 72 },
                { "index": 8, "velocity": 72 },
                { "index": 10, "velocity": 72 },
                { "index": 12, "velocity": 72 },
                { "index": 14, "velocity": 72 }
            ],
            "openHat": [{ "index": 15, "velocity": 72 }],
            "clap": [{ "index": 12, "velocity": 72 }],
            "lowTom": [],
            "midTom": [],
            "crash": [{ "index": 0, "velocity": 72 }]
        }),
    };

    let fill_pattern = PatternDraft {
        name: "Fallback Fill".to_string(),
        groove_tone: "pushed".to_string(),
        description: "Simple transition fill.".to_string(),
        swing,
        steps: json!({
            "kick": [{ "index": 0, "velocity": 104 }],
            "snare": [
                { "index": 4, "velocity": 104 },
                { "index": 12, "velocity": 127 }
            ],
            "closedHat": [],
            "openHat": [{ "index": 15, "velocity": 104 }],
            "clap": [],
            "lowTom": [{ "index": 13, "velocity": 104 }],
            "midTom": [{ "index": 14, "velocity": 104 }],
            "crash": [{ "index": 15, "velocity": 127 }]
        }),
    };

    GeneratedBeatIdea {
        summary: "Used the local fallback groove generator because native OpenAI access was unavailable.".to_string(),
        suggested_tempo: tempo,
        swing,
        groove_tone: groove_tone.to_string(),
        feel: feel.to_string(),
        main_pattern,
        fill_pattern,
        arrangement: vec![
            ArrangementDraft {
                label: "Main".to_string(),
                pattern_role: "main".to_string(),
                repeats: 4,
                fill_on_last_repeat: None,
                transition: "hold".to_string(),
            },
            ArrangementDraft {
                label: "Lift".to_string(),
                pattern_role: "main".to_string(),
                repeats: 2,
                fill_on_last_repeat: Some(true),
                transition: "fill".to_string(),
            },
        ],
    }
}

fn list_midi_inputs() -> Vec<MidiInputInfo> {
    let Ok(input) = MidiInput::new("musicbox-midi") else {
        return Vec::new();
    };

    input
        .ports()
        .iter()
        .enumerate()
        .map(|(index, port)| MidiInputInfo {
            id: format!("midi-input-{index}"),
            name: input
                .port_name(port)
                .unwrap_or_else(|_| format!("Input {index}")),
        })
        .collect()
}

fn candidate_key_sources() -> Vec<PathBuf> {
    vec![
        PathBuf::from("/Users/dennistrue/musicbox/.env.local"),
        PathBuf::from("/Users/dennistrue/musicbox/.env"),
        PathBuf::from("/Users/dennistrue/engineering_system/.env"),
        PathBuf::from("/Users/dennistrue/engineering_system/.secrets.env"),
        PathBuf::from("/Users/dennistrue/engineering_system/config.json"),
        PathBuf::from("/Users/dennistrue/engineering_system/reasoning/tool/config.json"),
    ]
}

fn extract_key_from_text(text: &str) -> Option<String> {
    for line in text.lines() {
        let trimmed = line.trim();
        if let Some(value) = trimmed.strip_prefix("OPENAI_API_KEY=") {
            return Some(value.trim_matches('"').trim().to_string());
        }

        if let Some(index) = trimmed.find("sk-") {
            let suffix = &trimmed[index..];
            let key: String = suffix
                .chars()
                .take_while(|character| !character.is_whitespace() && *character != '"' && *character != '\'')
                .collect();

            if !key.is_empty() {
                return Some(key);
            }
        }
    }

    None
}

fn load_openai_key() -> Option<(String, String)> {
    if let Ok(value) = env::var("OPENAI_API_KEY") {
        return Some((value, "environment".to_string()));
    }

    for path in candidate_key_sources() {
        if let Ok(contents) = fs::read_to_string(&path) {
            if let Some(value) = extract_key_from_text(&contents) {
                return Some((value, path.display().to_string()));
            }
        }
    }

    None
}

fn collect_response_text(response: &Value) -> Option<String> {
    if let Some(text) = response.get("output_text").and_then(Value::as_str) {
        return Some(text.to_string());
    }

    let mut text_chunks = Vec::new();

    if let Some(outputs) = response.get("output").and_then(Value::as_array) {
        for output in outputs {
            if let Some(content) = output.get("content").and_then(Value::as_array) {
                for part in content {
                    if let Some(text) = part.get("text").and_then(Value::as_str) {
                        text_chunks.push(text.to_string());
                    }
                }
            }
        }
    }

    if text_chunks.is_empty() {
        None
    } else {
        Some(text_chunks.join("\n"))
    }
}

fn validate_idea(mut idea: GeneratedBeatIdea) -> GeneratedBeatIdea {
    for draft in [&mut idea.main_pattern, &mut idea.fill_pattern] {
        let Some(map) = draft.steps.as_object_mut() else {
            draft.steps = default_empty_steps();
            continue;
        };

        for key in [
            "kick",
            "snare",
            "closedHat",
            "openHat",
            "clap",
            "lowTom",
            "midTom",
            "crash",
        ] {
            let Some(array) = map.get_mut(key).and_then(Value::as_array_mut) else {
                map.insert(key.to_string(), Value::Array(Vec::new()));
                continue;
            };

            for hit in array {
                if let Some(obj) = hit.as_object_mut() {
                    let velocity = obj
                        .get("velocity")
                        .and_then(Value::as_u64)
                        .unwrap_or(72) as u8;
                    obj.insert("velocity".to_string(), json!(clamp_velocity(velocity)));
                }
            }
        }
    }

    idea
}

async fn call_openai(request: &BeatPromptRequest) -> Result<GeneratedBeatIdea, String> {
    let Some((api_key, source)) = load_openai_key() else {
        return Err("OpenAI API key not found in environment or engineering system files.".to_string());
    };

    let schema = json!({
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "summary": { "type": "string" },
            "suggestedTempo": { "type": "integer" },
            "swing": { "type": "number" },
            "grooveTone": { "type": "string" },
            "feel": { "type": "string" },
            "mainPattern": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "name": { "type": "string" },
                    "grooveTone": { "type": "string" },
                    "description": { "type": "string" },
                    "swing": { "type": "number" },
                    "steps": { "type": "object" }
                },
                "required": ["name", "grooveTone", "description", "swing", "steps"]
            },
            "fillPattern": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "name": { "type": "string" },
                    "grooveTone": { "type": "string" },
                    "description": { "type": "string" },
                    "swing": { "type": "number" },
                    "steps": { "type": "object" }
                },
                "required": ["name", "grooveTone", "description", "swing", "steps"]
            },
            "arrangement": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "label": { "type": "string" },
                        "patternRole": { "type": "string" },
                        "repeats": { "type": "integer" },
                        "fillOnLastRepeat": { "type": "boolean" },
                        "transition": { "type": "string" }
                    },
                    "required": ["label", "patternRole", "repeats", "transition"]
                }
            }
        },
        "required": [
            "summary",
            "suggestedTempo",
            "swing",
            "grooveTone",
            "feel",
            "mainPattern",
            "fillPattern",
            "arrangement"
        ]
    });

    let system_prompt = "You are designing an editable drum-machine groove. Return JSON only. Respect 16-step sequencing. Use keys kick, snare, closedHat, openHat, clap, lowTom, midTom, crash. Velocities must be 72, 104, or 127. The arrangement should describe song blocks that remain editable.";
    let user_prompt = format!(
        "Prompt: {}\nTempo context: {}\nSwing context: {}\nCurrent pattern: {}",
        request.prompt, request.context.tempo, request.context.swing, request.context.active_pattern_name
    );

    let payload = json!({
        "model": "gpt-5-mini",
        "input": [
            {
                "role": "system",
                "content": [{ "type": "input_text", "text": system_prompt }]
            },
            {
                "role": "user",
                "content": [{ "type": "input_text", "text": user_prompt }]
            }
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "musicbox_beat_idea",
                "strict": true,
                "schema": schema
            }
        }
    });

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.openai.com/v1/responses")
        .bearer_auth(api_key)
        .json(&payload)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        return Err(format!(
            "OpenAI request failed ({}), key source: {}",
            response.status(),
            source
        ));
    }

    let response_json: Value = response.json().await.map_err(|error| error.to_string())?;
    let text = collect_response_text(&response_json)
        .ok_or_else(|| "OpenAI response did not include text output.".to_string())?;

    let idea: GeneratedBeatIdea =
        serde_json::from_str(&text).map_err(|error| error.to_string())?;

    Ok(validate_idea(idea))
}

#[tauri::command]
fn backend_status() -> BackendDiagnostics {
    let open_ai = load_openai_key();
    let midi_inputs = list_midi_inputs();

    BackendDiagnostics {
        native_runtime: true,
        open_ai_configured: open_ai.is_some(),
        open_ai_source: open_ai.map(|(_, source)| source),
        midi_inputs,
        message: "Native backend online. AI runs through Rust so the API key never enters frontend code."
            .to_string(),
    }
}

#[tauri::command]
async fn generate_beat_from_prompt(request: BeatPromptRequest) -> Result<GeneratedBeatIdea, String> {
    match call_openai(&request).await {
        Ok(idea) => Ok(idea),
        Err(_) => Ok(fallback_idea(&request)),
    }
}

#[tauri::command]
fn persist_imported_sample(
    app: tauri::AppHandle,
    request: PersistImportedSampleRequest,
) -> Result<PersistedSample, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("kits")
        .join("imported")
        .join(request.drum_id);

    fs::create_dir_all(&data_dir).map_err(|error| error.to_string())?;

    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_secs();
    let sanitized_name = request
        .file_name
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || character == '.' || character == '-' {
                character
            } else {
                '_'
            }
        })
        .collect::<String>();
    let destination = data_dir.join(format!("{stamp}-{sanitized_name}"));

    fs::write(&destination, request.bytes).map_err(|error| error.to_string())?;

    Ok(PersistedSample {
        path: destination.to_string_lossy().to_string(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            backend_status,
            generate_beat_from_prompt,
            persist_imported_sample
        ])
        .run(tauri::generate_context!())
        .expect("error while running musicbox");
}
