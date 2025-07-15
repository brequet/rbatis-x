/**
 * Regex to find SQL-defining tags like `<select>`, `<update>`, etc., and capture their `id`.
 */
export const SQL_TAG_REGEX = /<(?:select|insert|update|delete)\s+id\s*=\s*"([^"]+)"/;

/**
 * Regex to find `<include>` tags and capture their `refid`.
 */
export const INCLUDE_TAG_REGEX = /<include\s+refid\s*=\s*"([^"]+)"/;

/**
 * Regex for rbatis formatting, targeting major SQL blocks.
 */
export const FORMATTING_TAG_REGEX = /<(select|insert|update|delete|sql)\b[^>]*>([\s\S]*?)<\/\1>/g;

/**
 * Regex for the Rust `#[html_sql(...)]` attribute, capturing the relative path.
 */
export const RUST_HTML_SQL_ATTR_REGEX = /#\[html_sql\("([^"]+)"\)\]/;

/**
 * Regex for a typical Rust `pub async fn` signature, capturing the function name.
 */
export const RUST_FN_REGEX = /pub\s+async\s+fn\s+(\w+)/;

/**
 * DTD identifier to confirm the file is an rbatis/mybatis mapper.
 */
export const DTD_IDENTIFIER = 'mybatis-3-mapper.dtd';
