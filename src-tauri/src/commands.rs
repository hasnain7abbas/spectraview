use std::path::Path;
use crate::parsers::{parse_generic_ascii, parse_xrdml};
use crate::parsers::generic_ascii::ParsedData;

#[tauri::command]
pub fn parse_file(path: String) -> Result<ParsedData, String> {
    let ext = Path::new(&path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "xrdml" => parse_xrdml(&path),
        _ => parse_generic_ascii(&path),
    }
}
