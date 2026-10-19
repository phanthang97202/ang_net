using System.Text;
using System.Text.Json;
using angnet.Domain.Dtos;

namespace angnet.Infrastructure.Data.Services;

// Accept only the nodes and attributes used by our Tiptap editor. Never accept arbitrary HTML.
internal static class PersonalNoteDocument
{
    private static readonly HashSet<string> Blocks = new()
    { "paragraph", "heading", "blockquote", "bulletList", "orderedList", "codeBlock", "horizontalRule", "taskList", "image" };
    private static readonly HashSet<string> Marks = new() { "bold", "italic", "strike", "underline", "code", "link" };

    public static string Text(string json)
    {
        if (string.IsNullOrWhiteSpace(json) || json.Length > PersonalNoteSaveDto.MaxContentLength) throw new ArgumentException("Invalid document");
        try
        {
            using var doc = JsonDocument.Parse(json, new JsonDocumentOptions { MaxDepth = 64 });
            var text = new StringBuilder();
            int count = 0;
            Visit(doc.RootElement, "root", text, ref count);
            if (text.Length > 500_000) throw new ArgumentException("Text is too long");
            return text.ToString().Trim();
        }
        catch (JsonException) { throw new ArgumentException("Invalid document"); }
    }

    private static void Visit(JsonElement node, string parent, StringBuilder text, ref int count)
    {
        if (++count > 20_000 || node.ValueKind != JsonValueKind.Object
            || !node.TryGetProperty("type", out var kind) || kind.ValueKind != JsonValueKind.String)
            throw new ArgumentException("Invalid document");
        string type = kind.GetString()!;
        bool allowed = parent switch
        {
            "root" => type == "doc",
            "doc" or "blockquote" or "listItem" or "taskItem" => Blocks.Contains(type),
            "paragraph" or "heading" => type is "text" or "hardBreak",
            "codeBlock" => type == "text",
            "bulletList" or "orderedList" => type == "listItem",
            "taskList" => type == "taskItem",
            _ => false,
        };
        if (!allowed) throw new ArgumentException("Unsupported node");
        foreach (var property in node.EnumerateObject())
            if (property.Name is not ("type" or "text" or "content" or "marks" or "attrs"))
                throw new ArgumentException("Unsupported document property");
        if (node.TryGetProperty("attrs", out var attrs)) ValidateAttrs(type, attrs);
        if (type == "image" && (attrs.ValueKind != JsonValueKind.Object || !attrs.TryGetProperty("src", out var src)
            || src.ValueKind != JsonValueKind.String || !ValidImage(src.GetString()!)))
            throw new ArgumentException("Invalid image");
        if (node.TryGetProperty("marks", out var marks))
        {
            if (type != "text" || marks.ValueKind != JsonValueKind.Array || marks.GetArrayLength() > 6)
                throw new ArgumentException("Invalid marks");
            foreach (var mark in marks.EnumerateArray())
            {
                if (mark.ValueKind != JsonValueKind.Object || !mark.TryGetProperty("type", out var markType)
                    || markType.ValueKind != JsonValueKind.String || !Marks.Contains(markType.GetString()!))
                    throw new ArgumentException("Unsupported mark");
                if (mark.TryGetProperty("attrs", out var markAttrs)) ValidateAttrs(markType.GetString()!, markAttrs);
            }
        }
        if (type == "text")
        {
            if (!node.TryGetProperty("text", out var value) || value.ValueKind != JsonValueKind.String
                || string.IsNullOrEmpty(value.GetString()) || node.TryGetProperty("content", out _))
                throw new ArgumentException("Invalid text");
            text.Append(value.GetString());
            return;
        }
        bool hasChildren = node.TryGetProperty("content", out var children);
        if (hasChildren && children.ValueKind != JsonValueKind.Array) throw new ArgumentException("Invalid content");
        if (type is "hardBreak" or "horizontalRule" or "image")
        {
            if (hasChildren) throw new ArgumentException("Invalid leaf");
            text.Append(' ');
            return;
        }
        if (type is "doc" or "bulletList" or "orderedList" or "taskList" or "listItem" or "taskItem" or "blockquote")
        {
            if (!hasChildren || children.GetArrayLength() == 0) throw new ArgumentException("Missing content");
            if (type is "listItem" or "taskItem" && (children[0].ValueKind != JsonValueKind.Object
                || !children[0].TryGetProperty("type", out var firstType) || firstType.ValueKind != JsonValueKind.String
                || firstType.GetString() != "paragraph"))
                throw new ArgumentException("Invalid list item");
        }
        if (hasChildren) foreach (var child in children.EnumerateArray()) Visit(child, type, text, ref count);
        text.Append(' ');
    }

    private static void ValidateAttrs(string type, JsonElement attrs)
    {
        if (attrs.ValueKind != JsonValueKind.Object) throw new ArgumentException("Invalid attributes");
        foreach (var attr in attrs.EnumerateObject())
        {
            bool valid = (type, attr.Name) switch
            {
                ("image", "src") => attr.Value.ValueKind == JsonValueKind.String,
                ("image", "alt" or "title") => attr.Value.ValueKind == JsonValueKind.Null
                    || (attr.Value.ValueKind == JsonValueKind.String && attr.Value.GetString()!.Length <= 500),
                ("image", "width" or "height") => attr.Value.ValueKind == JsonValueKind.Null
                    || (attr.Value.ValueKind == JsonValueKind.Number && attr.Value.TryGetInt32(out int dimension) && dimension is > 0 and <= 16000),
                ("heading", "level") => attr.Value.ValueKind == JsonValueKind.Number && attr.Value.TryGetInt32(out int level) && level is >= 1 and <= 3,
                ("orderedList", "start") => attr.Value.ValueKind == JsonValueKind.Number && attr.Value.TryGetInt32(out int start) && start is >= 1 and <= 1_000_000,
                ("orderedList", "type") => attr.Value.ValueKind == JsonValueKind.Null,
                ("taskItem", "checked") => attr.Value.ValueKind is JsonValueKind.True or JsonValueKind.False,
                ("codeBlock", "language") => attr.Value.ValueKind == JsonValueKind.Null
                    || (attr.Value.ValueKind == JsonValueKind.String && attr.Value.GetString()!.Length <= 50),
                ("link", "href") => attr.Value.ValueKind == JsonValueKind.String
                    && Uri.TryCreate(attr.Value.GetString(), UriKind.Absolute, out var uri)
                    && uri.Scheme is "http" or "https" or "mailto" or "tel",
                ("link", "target") => attr.Value.ValueKind == JsonValueKind.Null
                    || (attr.Value.ValueKind == JsonValueKind.String && attr.Value.GetString() is "_blank" or "_self"),
                ("link", "rel" or "class") => attr.Value.ValueKind == JsonValueKind.Null
                    || (attr.Value.ValueKind == JsonValueKind.String && attr.Value.GetString()!.Length <= 100),
                _ => false,
            };
            if (!valid) throw new ArgumentException("Unsupported attributes");
        }
    }

    private static bool ValidImage(string source)
    {
        const int maxBytes = 2 * 1024 * 1024;
        if (source.Length > ((maxBytes + 2) / 3) * 4 + 32) return false;
        int comma = source.IndexOf(',');
        if (comma < 0) return false;
        string header = source[..comma];
        if (header is not ("data:image/png;base64" or "data:image/jpeg;base64" or "data:image/gif;base64" or "data:image/webp;base64")) return false;
        byte[] bytes;
        try { bytes = Convert.FromBase64String(source[(comma + 1)..]); }
        catch (FormatException) { return false; }
        if (bytes.Length == 0 || bytes.Length > maxBytes) return false;
        return header switch {
            "data:image/png;base64" => bytes.AsSpan().StartsWith(new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a }),
            "data:image/jpeg;base64" => bytes.AsSpan().StartsWith(new byte[] { 0xff, 0xd8, 0xff }),
            "data:image/gif;base64" => bytes.AsSpan().StartsWith("GIF87a"u8) || bytes.AsSpan().StartsWith("GIF89a"u8),
            "data:image/webp;base64" => bytes.Length >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false,
        };
    }
}
