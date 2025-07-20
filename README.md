# Rbatis-X (Alpha)

A Visual Studio Code extension to improve the developer experience for the [rbatis](https://github.com/rbatis/rbatis) Rust crate.

**Note:** This is an early alpha release. Features are still a work in progress, and you may encounter bugs.

## Features

*   **Automatic File Recognition**: Automatically detects `.html` and `.xml` files containing the rbatis DTD and assigns the correct language mode, enabling a custom icon and specialized features.
*   **Rich Syntax Highlighting**: Provides layered highlighting for rbatis mapper files:
    *   Standard XML tags and attributes.
    *   Embedded SQL keywords.
    *   Rbatis-specific tags (`<if>`, `<include>`, etc.).
    *   Rbatis placeholders (`#{id}`).
*   **SQL Formatting**: Format the SQL code inside your `<select>`, `<insert>`, `<update>`, `<delete>`, and `<sql>` tags using a configurable SQL dialect.
*   **Code Navigation (Go to Definition)**:
    *   Jump from a Rust function with an `#[html_sql(...)]` attribute directly to the corresponding `<select>`, `<insert>`, etc., tag in the mapper file.
    *   Jump from an XML mapper tag back to the defining Rust function.
    *   Navigate from an `<include refid="..." />` tag to the defining `<sql id="..." />` tag within the same file.

## Extension Settings

This extension contributes the following settings:

*   `rbatis-x.formatting.dialect`: Specifies the SQL dialect used for formatting. Default is `"sql"`.

## Known Issues

*   As an alpha version, some edge cases in formatting or syntax highlighting may not be handled perfectly.
*   The indexer for code navigation runs on startup and watches for file changes, but may require a moment to catch up on large projects.

**Enjoy!**
