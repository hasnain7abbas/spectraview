use quick_xml::events::Event;
use quick_xml::Reader;
use std::path::Path;

use crate::parsers::generic_ascii::{ParseMetadata, ParsedData};

/// Parse a PANalytical .xrdml file.
/// Extracts 2Theta positions and intensity/counts data.
pub fn parse_xrdml(path: &str) -> Result<ParsedData, String> {
    let file_path = Path::new(path);
    let file_name = file_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let content =
        std::fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;

    let mut reader = Reader::from_str(&content);
    reader.trim_text(true);

    let mut two_theta_start: Option<f64> = None;
    let mut two_theta_end: Option<f64> = None;
    let mut intensities: Vec<f64> = Vec::new();

    // Track element context
    let mut in_positions = false;
    let mut is_two_theta = false;
    let mut in_start_position = false;
    let mut in_end_position = false;
    let mut in_intensities = false;
    let mut in_counts = false;

    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) | Ok(Event::Empty(ref e)) => {
                let local_name = e.local_name();
                let name = std::str::from_utf8(local_name.as_ref()).unwrap_or("");

                match name {
                    "positions" => {
                        in_positions = true;
                        is_two_theta = false;
                        // Check axis attribute
                        for attr in e.attributes().flatten() {
                            if attr.key.as_ref() == b"axis" {
                                let val = std::str::from_utf8(&attr.value).unwrap_or("");
                                if val == "2Theta" || val == "2theta" || val == "2THETA" {
                                    is_two_theta = true;
                                }
                            }
                        }
                    }
                    "startPosition" if in_positions && is_two_theta => {
                        in_start_position = true;
                    }
                    "endPosition" if in_positions && is_two_theta => {
                        in_end_position = true;
                    }
                    "intensities" | "counts" => {
                        if name == "intensities" {
                            in_intensities = true;
                        } else {
                            in_counts = true;
                        }
                    }
                    _ => {}
                }
            }
            Ok(Event::Text(ref e)) => {
                let text = e.unescape().unwrap_or_default().to_string();
                let text = text.trim();

                if in_start_position && is_two_theta {
                    if let Ok(v) = text.parse::<f64>() {
                        two_theta_start = Some(v);
                    }
                } else if in_end_position && is_two_theta {
                    if let Ok(v) = text.parse::<f64>() {
                        two_theta_end = Some(v);
                    }
                } else if in_intensities || in_counts {
                    // Intensities are space-separated values
                    let vals: Vec<f64> = text
                        .split_whitespace()
                        .filter_map(|s| s.parse::<f64>().ok())
                        .collect();
                    if !vals.is_empty() {
                        intensities = vals;
                    }
                }
            }
            Ok(Event::End(ref e)) => {
                let local_name = e.local_name();
                let name = std::str::from_utf8(local_name.as_ref()).unwrap_or("");
                match name {
                    "positions" => {
                        in_positions = false;
                        is_two_theta = false;
                    }
                    "startPosition" => in_start_position = false,
                    "endPosition" => in_end_position = false,
                    "intensities" => in_intensities = false,
                    "counts" => in_counts = false,
                    _ => {}
                }
            }
            Ok(Event::Eof) => break,
            Err(e) => return Err(format!("XML parse error: {}", e)),
            _ => {}
        }
        buf.clear();
    }

    if intensities.is_empty() {
        return Err("No intensity data found in XRDML file".to_string());
    }

    // Generate 2Theta column from start/end positions
    let start = two_theta_start.unwrap_or(0.0);
    let end = two_theta_end.unwrap_or(start + intensities.len() as f64 * 0.02);
    let n = intensities.len();

    let two_theta: Vec<f64> = if n > 1 {
        let step = (end - start) / (n as f64 - 1.0);
        (0..n).map(|i| start + i as f64 * step).collect()
    } else {
        vec![start]
    };

    let data_rows = n;
    let columns = vec![two_theta, intensities];
    let headers = vec!["2Theta".to_string(), "Intensity".to_string()];

    Ok(ParsedData {
        file_name,
        headers,
        columns,
        metadata: ParseMetadata {
            delimiter: "xrdml".to_string(),
            comment_lines: 0,
            data_rows,
            encoding: "UTF-8".to_string(),
        },
    })
}
