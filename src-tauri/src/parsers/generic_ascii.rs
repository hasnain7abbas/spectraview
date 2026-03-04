use serde::Serialize;
use std::path::Path;

use crate::parsers::column_detector::{
    detect_delimiter, is_comment, is_data_line, parse_number, split_line,
};

#[derive(Debug, Serialize, Clone)]
pub struct ParseMetadata {
    pub delimiter: String,
    pub comment_lines: usize,
    pub data_rows: usize,
    pub encoding: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ParsedData {
    pub file_name: String,
    pub headers: Vec<String>,
    pub columns: Vec<Vec<f64>>,
    pub metadata: ParseMetadata,
}

/// Read bytes and decode, trying UTF-8 first, then Windows-1252, then Shift-JIS.
fn decode_bytes(bytes: &[u8]) -> (String, String) {
    // Try UTF-8
    if let Ok(s) = std::str::from_utf8(bytes) {
        return (s.to_string(), "UTF-8".to_string());
    }

    // Try Windows-1252
    let (cow, _, had_errors) = encoding_rs::WINDOWS_1252.decode(bytes);
    if !had_errors {
        return (cow.into_owned(), "Windows-1252".to_string());
    }

    // Try Shift-JIS
    let (cow, _, _) = encoding_rs::SHIFT_JIS.decode(bytes);
    (cow.into_owned(), "Shift-JIS".to_string())
}

pub fn parse_generic_ascii(path: &str) -> Result<ParsedData, String> {
    let file_path = Path::new(path);
    let file_name = file_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let bytes = std::fs::read(path).map_err(|e| format!("Failed to read file: {}", e))?;
    let (content, encoding) = decode_bytes(&bytes);

    let all_lines: Vec<&str> = content.lines().collect();
    if all_lines.is_empty() {
        return Err("File is empty".to_string());
    }

    // Separate comment lines from potential data lines
    let mut comment_lines_count = 0;
    let non_comment_lines: Vec<&str> = all_lines
        .iter()
        .filter(|l| {
            if is_comment(l) {
                comment_lines_count += 1;
                false
            } else {
                true
            }
        })
        .copied()
        .collect();

    if non_comment_lines.is_empty() {
        return Err("No data lines found in file".to_string());
    }

    // Detect delimiter using data-looking lines
    let data_candidates: Vec<&str> = non_comment_lines.clone();
    let delimiter = detect_delimiter(&data_candidates);

    // Find header line: the first non-comment line that isn't purely numeric data
    let mut headers: Vec<String> = Vec::new();
    let mut data_start_idx = 0;

    if !non_comment_lines.is_empty() {
        let first_line = non_comment_lines[0];
        let fields = split_line(first_line, delimiter);
        let numeric_count = fields.iter().filter(|f| parse_number(f).is_some()).count();

        // If less than half the fields are numeric, treat as header
        if fields.len() > 0 && numeric_count < fields.len() / 2 + 1 {
            headers = fields;
            data_start_idx = 1;
        }
    }

    // Parse data rows
    let mut rows: Vec<Vec<f64>> = Vec::new();
    let mut max_cols = 0;

    for line in non_comment_lines.iter().skip(data_start_idx) {
        if !is_data_line(line, delimiter) {
            continue;
        }
        let fields = split_line(line, delimiter);
        let values: Vec<f64> = fields.iter().map(|f| parse_number(f).unwrap_or(f64::NAN)).collect();
        if values.len() > max_cols {
            max_cols = values.len();
        }
        rows.push(values);
    }

    if rows.is_empty() {
        return Err("No valid data rows found".to_string());
    }

    // Generate headers if none were found
    if headers.is_empty() {
        headers = (0..max_cols)
            .map(|i| format!("Column {}", i + 1))
            .collect();
    }

    // Ensure headers match column count
    while headers.len() < max_cols {
        headers.push(format!("Column {}", headers.len() + 1));
    }
    headers.truncate(max_cols);

    // Transpose row-major -> column-major
    let mut columns: Vec<Vec<f64>> = vec![Vec::with_capacity(rows.len()); max_cols];
    for row in &rows {
        for (col_idx, col) in columns.iter_mut().enumerate() {
            col.push(if col_idx < row.len() {
                row[col_idx]
            } else {
                f64::NAN
            });
        }
    }

    let delimiter_name = match delimiter {
        '\t' => "tab".to_string(),
        ',' => "comma".to_string(),
        ';' => "semicolon".to_string(),
        _ => "whitespace".to_string(),
    };

    Ok(ParsedData {
        file_name,
        headers,
        columns,
        metadata: ParseMetadata {
            delimiter: delimiter_name,
            comment_lines: comment_lines_count,
            data_rows: rows.len(),
            encoding,
        },
    })
}
