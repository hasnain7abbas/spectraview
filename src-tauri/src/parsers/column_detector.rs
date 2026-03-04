/// Detect the delimiter used in data lines.
/// Priority: tab > comma > semicolon > whitespace
pub fn detect_delimiter(lines: &[&str]) -> char {
    let sample: Vec<&str> = lines.iter().take(20).copied().collect();
    if sample.is_empty() {
        return '\t';
    }

    let delimiters = ['\t', ',', ';'];

    for &delim in &delimiters {
        let counts: Vec<usize> = sample.iter().map(|l| l.matches(delim).count()).collect();
        if counts.iter().all(|&c| c > 0) {
            let first = counts[0];
            if counts.iter().all(|&c| c == first) {
                return delim;
            }
        }
    }

    // Fallback: whitespace
    ' '
}

/// Split a line by the detected delimiter.
/// For whitespace delimiter, split on any whitespace and filter empty tokens.
pub fn split_line(line: &str, delimiter: char) -> Vec<String> {
    if delimiter == ' ' {
        line.split_whitespace()
            .map(|s| s.to_string())
            .collect()
    } else {
        line.split(delimiter)
            .map(|s| s.trim().to_string())
            .collect()
    }
}

/// Try parsing a string as a float, handling scientific notation including Fortran 'd' notation.
pub fn parse_number(s: &str) -> Option<f64> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return None;
    }

    // Try direct parse first
    if let Ok(v) = trimmed.parse::<f64>() {
        return Some(v);
    }

    // Handle Fortran-style 'd'/'D' notation: 1.23d-4 -> 1.23e-4
    let replaced = trimmed.replace('d', "e").replace('D', "e");
    if let Ok(v) = replaced.parse::<f64>() {
        return Some(v);
    }

    None
}

/// Check if a line is a comment or metadata line.
pub fn is_comment(line: &str) -> bool {
    let trimmed = line.trim();
    trimmed.is_empty()
        || trimmed.starts_with('#')
        || trimmed.starts_with('%')
        || trimmed.starts_with('!')
        || trimmed.starts_with(';')
}

/// Determine if a line looks like a data line (contains at least one number).
pub fn is_data_line(line: &str, delimiter: char) -> bool {
    let fields = split_line(line, delimiter);
    fields.iter().any(|f| parse_number(f).is_some())
}
